"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useSessionStore } from "@/store/useSessionStore";
import Canvas from "@/components/canvas/Canvas";
import CardInspectorPanel from "@/components/inspector/CardInspectorPanel";
import ClarificationPanel from "@/components/clarification/ClarificationPanel";
import OutputPanel from "@/components/output/OutputPanel";

function SessionContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const { initializeSession, isLoading, error } = useSessionStore();

  useEffect(() => {
    if (!id) return;
    const unsub = initializeSession(id);
    return () => unsub();
  }, [id, initializeSession]);

  if (isLoading) {
    return (
      <div className="flex bg-sb-base text-sb-text-secondary h-screen items-center justify-center">
        <span className="text-xs tracking-[0.12em] uppercase animate-pulse">Loading workspace…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-2 bg-sb-base h-screen items-center justify-center">
        <span className="text-sm text-sb-text-primary font-medium">Something went wrong</span>
        <span className="text-xs text-sb-text-muted">{error}</span>
      </div>
    );
  }

  if (!id) {
    return (
      <div className="flex bg-sb-base h-screen items-center justify-center">
        <span className="text-xs text-sb-text-muted">No session ID provided.</span>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex bg-sb-base text-sb-text-primary overflow-hidden">
      <div className="flex-1 h-full min-w-0">
        <Canvas />
      </div>
      <div className="w-80 h-full border-l border-sb-border-subtle flex flex-col overflow-hidden shrink-0">
        <div className="shrink-0">
          <CardInspectorPanel />
        </div>
        <div className="h-px bg-sb-border-subtle shrink-0" />
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <ClarificationPanel sessionId={id} />
        </div>
        <div className="h-px bg-sb-border-subtle shrink-0" />
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <OutputPanel sessionId={id} />
        </div>
      </div>
    </div>
  );
}

export default function SessionPage() {
  return (
    <Suspense fallback={<div className="bg-sb-base h-screen" />}>
      <SessionContent />
    </Suspense>
  );
}
