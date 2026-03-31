"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useSessionStore } from "@/store/useSessionStore";
import Canvas from "@/components/canvas/Canvas";

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

  return (
    <div className="w-full h-screen relative bg-neutral-950 overflow-hidden text-white">
      <Canvas />
    </div>
  );
}

export default function SessionPage() {
  return (
    <Suspense fallback={<div className="bg-black h-screen" />}>
      <SessionContent />
    </Suspense>
  )
}
