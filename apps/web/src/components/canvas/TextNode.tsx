import React, { useState, useEffect, useRef } from "react";
import { Asset } from "@signalboard/domain";
import { Handle, Position } from "@xyflow/react";
import { useSessionStore } from "@/store/useSessionStore";
import { useAssetAnalysis } from "@/hooks/useAssetAnalysis";
import PinButton from "./PinButton";

interface TextNodeProps {
  data: { asset: Asset };
  selected: boolean;
}

export default function TextNodeComponent({ data, selected }: TextNodeProps) {
  const { asset } = data;
  const { updateAssetText, addAsset, removeAsset, updateAssetAnnotation } = useSessionStore();
  const { triggerAnalysis } = useAssetAnalysis();

  const [isEditing, setIsEditing] = useState(false);
  const [textVal, setTextVal] = useState(asset.rawText || "");
  const [annotationDraft, setAnnotationDraft] = useState<string>("");
  const annotationSaved = useRef("");

  const analysis = asset.metadata?.analysis;
  const metadata = asset.metadata || {};
  const loadingStatus = metadata.loadingStatus as string | undefined;
  const confidence = analysis?.confidence ?? 0;
  const pinnedSignals: string[] = metadata.pinnedSignals ?? [];
  const savedAnnotation: string = metadata.annotation ?? "";

  const perceptualSignals: string[] = analysis?.perceptualSignals ?? [];
  const craftSignals: string[] = analysis?.craftSignals ?? [];
  const hasSignals = perceptualSignals.length > 0 || craftSignals.length > 0;

  useEffect(() => {
    if (!isEditing && asset.rawText !== textVal) setTextVal(asset.rawText || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asset.rawText, isEditing]);

  useEffect(() => {
    const val = metadata.annotation ?? "";
    setAnnotationDraft(val);
    annotationSaved.current = val;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asset.id]);

  const handleBlur = async () => {
    setIsEditing(false);
    if (textVal !== asset.rawText && textVal.trim() !== "") {
      await updateAssetText(asset.id, textVal);
      await addAsset({ ...asset, rawText: textVal, metadata: { ...metadata, loadingStatus: "idle" } });
    }
  };

  const borderClass = isEditing
    ? "border-[rgba(201,148,74,0.45)]"
    : selected
    ? "border-[rgba(201,148,74,0.35)]"
    : "border-sb-border hover:border-sb-border-hover";

  return (
    <div className={`bg-sb-surface-1 border w-[240px] rounded relative group overflow-hidden transition-colors ${borderClass}`}>
      {analysis && (
        <div
          className="absolute left-0 top-0 bottom-0 w-0.5"
          style={{ backgroundColor: `rgba(201, 148, 74, ${Math.max(0.2, confidence).toFixed(2)})` }}
        />
      )}

      <button
        onClick={() => removeAsset(asset.id)}
        className="absolute top-1.5 right-1.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 flex items-center justify-center rounded text-sb-text-muted hover:text-sb-destructive hover:bg-[rgba(128,128,128,0.12)] text-sm leading-none"
        title="Remove"
      >
        ×
      </button>

      <Handle type="target" position={Position.Top} className="opacity-0" />

      <div className="px-4 pt-3 pb-3">
        {/* Type label */}
        <p className={`text-[9px] tracking-[0.16em] uppercase font-medium text-sb-text-muted mb-2 transition-opacity ${selected || isEditing ? "opacity-100" : "opacity-0 group-hover:opacity-60"}`}>
          Note
        </p>

        {isEditing ? (
          <textarea
            autoFocus
            className="w-full bg-transparent text-sb-text-primary outline-none resize-none font-mono text-[13px] leading-[1.65]"
            value={textVal}
            onChange={(e) => setTextVal(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); e.currentTarget.blur(); }
            }}
          />
        ) : (
          <div
            className="text-sb-text-primary whitespace-pre-wrap cursor-text min-h-[1.5rem] font-mono text-[13px] leading-[1.65]"
            onClick={() => setIsEditing(true)}
          >
            {textVal || <span className="text-sb-text-muted italic font-mono text-[13px]">Click to type…</span>}
          </div>
        )}

        {loadingStatus === "analyzing" && (
          <p className="mt-2.5 text-[9px] tracking-[0.12em] uppercase font-medium text-sb-accent opacity-60 animate-pulse">
            Extracting signals…
          </p>
        )}

        {loadingStatus === "idle" && !isEditing && (
          <button
            onClick={() => triggerAnalysis(asset)}
            className="mt-3 text-[9px] tracking-[0.10em] uppercase font-medium text-sb-accent px-2 py-1 rounded border border-[rgba(201,148,74,0.22)] hover:border-[rgba(201,148,74,0.50)] opacity-60 hover:opacity-100 transition-all"
          >
            Analyze
          </button>
        )}

        {/* Signals + annotation — rest=hidden, hover=read-only, active=editable */}
        {(hasSignals || savedAnnotation) && (
          <div className={`border-t border-sb-border-subtle pt-2 mt-3 transition-opacity duration-150 ${selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
            {perceptualSignals.map((s) => (
              <div key={s} className="flex items-start gap-1.5 mb-1">
                <span className="text-[11px] text-sb-text-muted leading-relaxed flex-1">{s}</span>
                {selected && <PinButton assetId={asset.id} signal={s} pinnedSignals={pinnedSignals} />}
              </div>
            ))}
            {craftSignals.map((s) => (
              <div key={s} className="flex items-start gap-1.5 mb-0.5">
                <span className="text-[9px] text-sb-text-muted opacity-60 leading-relaxed flex-1">{s}</span>
                {selected && <PinButton assetId={asset.id} signal={s} pinnedSignals={pinnedSignals} />}
              </div>
            ))}
            {selected ? (
              <textarea
                className="nodrag mt-2 w-full bg-sb-base border border-sb-border rounded px-2.5 py-2 text-[11px] text-sb-text-secondary leading-relaxed resize-none outline-none focus:border-[rgba(201,148,74,0.40)] placeholder-sb-text-muted transition-colors"
                rows={2}
                placeholder="What about this is relevant? What to ignore?"
                value={annotationDraft}
                onChange={(e) => setAnnotationDraft(e.target.value)}
                onBlur={() => {
                  if (annotationDraft !== annotationSaved.current) {
                    annotationSaved.current = annotationDraft;
                    updateAssetAnnotation(asset.id, annotationDraft);
                  }
                }}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              savedAnnotation && (
                <p className="mt-2 text-[11px] text-sb-text-muted italic leading-relaxed">"{savedAnnotation}"</p>
              )
            )}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
}
