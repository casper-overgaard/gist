"use client";

import { useSessionStore } from "@/store/useSessionStore";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Session } from "@signalboard/domain";
import { getRecentSessions } from "@/lib/sessions";
import ThemeToggle from "@/components/ThemeToggle";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function Home() {
  const [title, setTitle] = useState("");
  const [sessions, setSessions] = useState<Session[]>([]);
  const router = useRouter();
  const createSession = useSessionStore((state) => state.createSession);

  useEffect(() => {
    getRecentSessions().then(setSessions).catch(console.error);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const sessionId = await createSession(title);
      router.push(`/session?id=${sessionId}`);
    } catch (err) {
      console.error("Failed to create session", err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-sb-base selection:bg-[rgba(201,148,74,0.20)]">
      <div className="max-w-sm w-full space-y-10">

        <div className="space-y-3">
          <h1 className="text-3xl font-light tracking-tight text-sb-text-primary">Signalboard</h1>
          <p className="text-sb-text-secondary text-sm leading-relaxed">
            Bring raw inspiration. Leave with structured direction.
          </p>
        </div>

        <form onSubmit={handleCreate} className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-[9px] tracking-[0.16em] uppercase font-medium text-sb-accent opacity-70 block">
              Workspace name
            </label>
            <input
              type="text"
              required
              placeholder="Brand refresh, Q3 product direction..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-sb-surface-1 border border-sb-border focus:border-[rgba(201,148,74,0.40)] outline-none rounded-lg text-sb-text-primary placeholder-sb-text-muted text-sm transition-colors"
            />
          </div>
          <button
            type="submit"
            className="w-full px-4 py-3 text-sm font-medium bg-sb-accent text-sb-base rounded-lg hover:opacity-90 transition-opacity"
          >
            Create workspace
          </button>
        </form>

        {sessions.length > 0 && (
          <div>
            <p className="text-[9px] tracking-[0.16em] uppercase font-medium text-sb-text-muted mb-3">
              Recent workspaces
            </p>
            <div className="space-y-1">
              {sessions.map((session) => (
                <Link
                  key={session.id}
                  href={`/session?id=${session.id}`}
                  className="flex items-center justify-between px-3 py-2.5 rounded border border-sb-border hover:border-sb-border-hover group transition-colors"
                >
                  <span className="text-sm text-sb-text-primary truncate pr-4">{session.title}</span>
                  <span className="text-[10px] text-sb-text-muted shrink-0">{formatDate(session.createdAt)}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <ThemeToggle />
        </div>

      </div>
    </div>
  );
}
