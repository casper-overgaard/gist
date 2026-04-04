"use client";

import { useSessionStore } from "@/store/useSessionStore";

interface PinButtonProps {
  assetId: string;
  signal: string;
  pinnedSignals: string[];
}

export default function PinButton({ assetId, signal, pinnedSignals }: PinButtonProps) {
  const { togglePinnedSignal } = useSessionStore();
  const isPinned = pinnedSignals.includes(signal);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        togglePinnedSignal(assetId, signal);
      }}
      title={isPinned ? "Unpin signal" : "Pin signal"}
      className={`shrink-0 w-4 h-4 flex items-center justify-center text-[10px] transition-colors ${
        isPinned
          ? "text-sb-accent opacity-100"
          : "text-sb-text-muted opacity-40 hover:opacity-100"
      }`}
    >
      {isPinned ? "◆" : "◇"}
    </button>
  );
}
