import React, { useState, useEffect } from "react";
import { Asset } from "@signalboard/domain";
import { Handle, Position } from "@xyflow/react";
import { useSessionStore } from "@/store/useSessionStore";
import { analyzeAssetAction } from "@/actions/analyze";

export default function TextNodeComponent({ data }: { data: { asset: Asset } }) {
  const { asset } = data;
  const { updateAssetText, addAsset, removeAsset } = useSessionStore();

  const [isEditing, setIsEditing] = useState(false);
  const [textVal, setTextVal] = useState(asset.rawText || "");

  const analysis = asset.metadata?.analysis;
  const metadata = asset.metadata || {};
  const confidence = analysis?.confidence ?? 0;

  useEffect(() => {
    if (!isEditing && asset.rawText !== textVal) {
      setTextVal(asset.rawText || "");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asset.rawText, isEditing]);

  const handleBlur = async () => {
    setIsEditing(false);
    if (textVal !== asset.rawText && textVal.trim() !== "") {
      await updateAssetText(asset.id, textVal);

      const placeholderAuth = { ...asset, rawText: textVal, metadata: { ...metadata, loadingStatus: "analyzing" } };
      await addAsset(placeholderAuth);

      const analysisResult = await analyzeAssetAction({ text: textVal });

      await addAsset({
        ...placeholderAuth,
        metadata: {
          ...metadata,
          loadingStatus: "done",
          analysis: analysisResult.success ? analysisResult.data : null,
        },
      });
    }
  };

  return (
    <div className="bg-sb-surface-1 border border-[rgba(255,255,255,0.08)] w-[240px] rounded relative group overflow-hidden">
      {/* Confidence thread */}
      {analysis && (
        <div
          className="absolute left-0 top-0 bottom-0 w-0.5"
          style={{ backgroundColor: `rgba(201, 148, 74, ${Math.max(0.2, confidence).toFixed(2)})` }}
        />
      )}

      <button
        onClick={() => removeAsset(asset.id)}
        className="absolute top-1.5 right-1.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 flex items-center justify-center rounded text-sb-text-muted hover:text-sb-destructive hover:bg-[rgba(255,255,255,0.06)] text-sm leading-none"
        title="Remove"
      >
        ×
      </button>

      <Handle type="target" position={Position.Top} className="opacity-0" />

      <div className="p-4">
        {isEditing ? (
          <textarea
            autoFocus
            className="w-full bg-transparent text-sb-text-primary outline-none resize-none font-mono text-xs leading-relaxed"
            value={textVal}
            onChange={(e) => setTextVal(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.blur();
              }
            }}
          />
        ) : (
          <div
            className="text-sb-text-primary whitespace-pre-wrap cursor-text min-h-[1.5rem] font-mono text-xs leading-relaxed"
            onClick={() => setIsEditing(true)}
          >
            {textVal || <span className="text-sb-text-muted">Click to type note…</span>}
          </div>
        )}

        {metadata.loadingStatus === "analyzing" && (
          <p className="mt-2 text-[10px] tracking-[0.10em] uppercase text-sb-accent opacity-60 animate-pulse">
            Analyzing…
          </p>
        )}

        {analysis?.tags && analysis.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1 border-t border-[rgba(255,255,255,0.06)] pt-2.5">
            {analysis.tags.slice(0, 4).map((tag: string) => (
              <span
                key={tag}
                className="text-[9px] tracking-[0.12em] uppercase bg-sb-base text-sb-text-muted px-1.5 py-0.5 rounded border border-[rgba(255,255,255,0.06)]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
}
