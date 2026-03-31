"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useSessionStore } from "@/store/useSessionStore";
import Canvas from "@/components/canvas/Canvas";
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
      <div className="flex bg-black text-white h-screen items-center justify-center">
        <span className="text-sm font-medium animate-pulse">Loading Workspace...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-2 bg-black text-white h-screen items-center justify-center">
        <span className="text-xl font-bold">Error</span>
        <span className="text-sm text-neutral-400">{error}</span>
      </div>
    );
  }

  if (!id) {
    return (
      <div className="flex bg-black text-white h-screen items-center justify-center">
        <span className="text-sm text-neutral-400">No session ID provided.</span>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex bg-neutral-950 text-white overflow-hidden">
      <div className="flex-1 h-full min-w-0">
        <Canvas />
      </div>
      <div className="w-80 h-full border-l border-neutral-800 flex flex-col overflow-hidden shrink-0">
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <ClarificationPanel sessionId={id} />
        </div>
        <div className="h-px bg-neutral-800 shrink-0" />
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <OutputPanel sessionId={id} />
        </div>
      </div>
    </div>
  );
}

export default function SessionPage() {
  return (
    <Suspense fallback={<div className="bg-black h-screen" />}>
      <SessionContent />
    </Suspense>
  );
}
