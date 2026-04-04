import { useState } from "react";
import { Handle, Position } from "@xyflow/react";
import { Asset, MergeOutput } from "@signalboard/domain";
import { useSessionStore } from "@/store/useSessionStore";

interface OutputNodeProps {
  data: { asset: Asset };
  selected: boolean;
}

function getSessionId() {
  return window.location.search.split("=")[1] || window.location.pathname.split("/").pop() || "";
}

export default function OutputNodeComponent({ data, selected }: OutputNodeProps) {
  const { asset } = data;
  const { removeAsset, addMergeFragment, session } = useSessionStore();
  const [addedToBrief, setAddedToBrief] = useState(false);

  const mergeOutput = asset.metadata?.mergeOutput as MergeOutput | undefined;

  const borderClass = selected
    ? "border-[rgba(201,148,74,0.50)]"
    : "border-[rgba(201,148,74,0.20)] hover:border-[rgba(201,148,74,0.35)]";

  const handleAddToBrief = async () => {
    if (!mergeOutput || addedToBrief) return;
    const sessionId = getSessionId();
    if (!sessionId) return;
    await addMergeFragment(sessionId, mergeOutput);
    setAddedToBrief(true);
  };

  if (!mergeOutput) return null;

  return (
    <div className={`bg-[rgba(201,148,74,0.04)] border rounded w-[280px] relative group transition-colors ${borderClass}`}>
      {/* Accent thread */}
      <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l" style={{ backgroundColor: "rgba(201,148,74,0.40)" }} />

      <button
        onClick={() => removeAsset(asset.id)}
        className="absolute top-1.5 right-1.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 flex items-center justify-center rounded text-sb-text-muted hover:text-sb-destructive hover:bg-[rgba(0,0,0,0.30)] text-sm leading-none"
        title="Remove"
      >
        ×
      </button>

      <Handle type="target" position={Position.Left} className="opacity-0" />

      <div className="px-3 pt-3 pb-3">
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div>
            <p className="text-[9px] tracking-[0.16em] uppercase font-medium text-sb-accent opacity-70 mb-0.5">
              Spec Fragment
            </p>
            <p className="text-[13px] font-medium text-sb-text-primary leading-snug">
              {mergeOutput.elementName}
            </p>
          </div>
        </div>

        <p className="text-[11px] text-sb-text-secondary leading-relaxed mb-3">
          {mergeOutput.inferredIntent}
        </p>

        {/* Tokens */}
        {mergeOutput.tokens.length > 0 && (
          <div className="mb-2.5">
            <p className="text-[9px] tracking-[0.14em] uppercase text-sb-accent opacity-50 mb-1.5">Tokens</p>
            <div className="space-y-1">
              {mergeOutput.tokens.map((t, i) => (
                <div key={i} className="flex items-baseline gap-2">
                  <code className="text-[10px] text-sb-accent font-mono">{t.value}</code>
                  <span className="text-[10px] text-sb-text-muted opacity-70 truncate">{t.use}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Class patterns */}
        {mergeOutput.classPatterns.length > 0 && (
          <div className="mb-2.5">
            <p className="text-[9px] tracking-[0.14em] uppercase text-sb-accent opacity-50 mb-1.5">Patterns</p>
            <div className="space-y-1.5">
              {mergeOutput.classPatterns.map((p, i) => (
                <div key={i}>
                  <p className="text-[9px] text-sb-text-muted opacity-60 mb-0.5">{p.component}</p>
                  <code className="text-[10px] text-sb-text-secondary font-mono leading-relaxed break-all">{p.classes}</code>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rules */}
        {mergeOutput.rules.length > 0 && (
          <div className="mb-3">
            <p className="text-[9px] tracking-[0.14em] uppercase text-sb-accent opacity-50 mb-1.5">Rules</p>
            <div className="space-y-1">
              {mergeOutput.rules.map((r, i) => (
                <p key={i} className="text-[10px] text-sb-text-muted leading-relaxed">— {r}</p>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleAddToBrief}
          disabled={addedToBrief}
          className="text-[9px] tracking-[0.10em] uppercase font-medium text-sb-accent px-2 py-1 rounded border border-[rgba(201,148,74,0.22)] hover:border-[rgba(201,148,74,0.50)] opacity-60 hover:opacity-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {addedToBrief ? "Added to brief" : "Add to brief"}
        </button>
      </div>

      <Handle type="source" position={Position.Right} className="opacity-0" />
    </div>
  );
}
