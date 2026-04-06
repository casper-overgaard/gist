"use client";

import { useEffect, useRef, useState } from "react";
import { useSessionStore } from "@/store/useSessionStore";
import CardInspectorPanel from "@/components/inspector/CardInspectorPanel";
import ClarificationPanel from "@/components/clarification/ClarificationPanel";
import OutputPanel from "@/components/output/OutputPanel";

type Tab = "card" | "synthesize" | "brief";

interface RightPanelProps {
  sessionId: string;
}

export default function RightPanel({ sessionId }: RightPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("synthesize");
  const prevSelectedRef = useRef<string | null>(null);

  const selectedAssetId = useSessionStore((s) => s.selectedAssetId);
  const hasAnalyzedAssets = useSessionStore((s) =>
    s.assets.some((a) => a.metadata?.analysis)
  );
  const synthesis = useSessionStore((s) => s.synthesis);
  const isSynthesizing = useSessionStore((s) => s.isSynthesizing);
  const pendingQuestions = useSessionStore((s) =>
    s.questions.filter((q) => q.status === "pending")
  );
  const hasOutput = useSessionStore((s) => s.outputs.length > 0);

  // Switch to card tab when a reference card is selected
  useEffect(() => {
    if (selectedAssetId && selectedAssetId !== prevSelectedRef.current) {
      const { assets } = useSessionStore.getState();
      const asset = assets.find((a) => a.id === selectedAssetId);
      if (asset && asset.type !== "merge" && asset.type !== "output") {
        setActiveTab("card");
      }
    }
    prevSelectedRef.current = selectedAssetId;
  }, [selectedAssetId]);

  // Badge conditions
  const synthesizeBadge =
    (hasAnalyzedAssets && !synthesis && !isSynthesizing) ||
    pendingQuestions.length > 0;
  const briefBadge = hasOutput;
  const cardBadge = !!selectedAssetId;

  const tabs: { id: Tab; label: string; badge: boolean }[] = [
    { id: "card", label: "Card", badge: cardBadge },
    { id: "synthesize", label: "Synthesize", badge: synthesizeBadge },
    { id: "brief", label: "Brief", badge: briefBadge },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Tab row */}
      <div className="flex items-end border-b border-sb-border-subtle px-3 shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative text-[9px] tracking-[0.14em] uppercase font-medium py-3.5 px-2.5 transition-colors ${
              activeTab === tab.id
                ? "text-sb-accent"
                : "text-sb-text-muted hover:text-sb-text-secondary"
            }`}
          >
            {tab.label}
            {/* Active underline */}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-2.5 right-2.5 h-px bg-sb-accent" />
            )}
            {/* Attention badge */}
            {tab.badge && activeTab !== tab.id && (
              <span className="absolute top-3 right-1 w-1 h-1 rounded-full bg-sb-accent" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {activeTab === "card" && <CardInspectorPanel />}
        {activeTab === "synthesize" && <ClarificationPanel sessionId={sessionId} />}
        {activeTab === "brief" && <OutputPanel sessionId={sessionId} />}
      </div>
    </div>
  );
}
