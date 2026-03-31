"use client";

import { useSessionStore } from "@/store/useSessionStore";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const [title, setTitle] = useState("");
  const router = useRouter();
  const createSession = useSessionStore((state) => state.createSession);

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
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-black text-white selection:bg-neutral-800">
      <div className="max-w-md w-full space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-4xl font-light tracking-tight">Signalboard</h1>
          <p className="text-neutral-400">Messy inspiration into structured direction.</p>
        </div>

        <form onSubmit={handleCreate} className="mt-8 space-y-4">
          <input
            type="text"
            required
            placeholder="Name your new workspace..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 focus:border-neutral-700 outline-none rounded-lg text-white placeholder-neutral-500 transition-colors"
          />
          <button
            type="submit"
            className="w-full px-4 py-3 text-sm font-medium bg-white text-black rounded-lg hover:bg-neutral-200 transition-colors"
          >
            Create Session
          </button>
        </form>
      </div>
    </div>
  );
}
