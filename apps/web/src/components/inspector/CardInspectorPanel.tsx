"use client";

import { useEffect, useRef, useState } from "react";
import { useSessionStore } from "@/store/useSessionStore";
import PinButton from "@/components/canvas/PinButton";

export default function CardInspectorPanel() {
  const { selectedAssetId, assets, updateAssetAnnotation } = useSessionStore();
  const asset = assets.find((a) => a.id === selectedAssetId) ?? null;

  const [annotationDraft, setAnnotationDraft] = useState("");
  const annotationSaved = useRef("");

  useEffect(() => {
    const val = asset?.metadata?.annotation ?? "";
    setAnnotationDraft(val);
    annotationSaved.current = val;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asset?.id]);

  const isEmpty = !asset || asset.type === "merge" || asset.type === "output";

  const analysis = asset?.metadata?.analysis;
  const perceptualSignals: string[] = analysis?.perceptualSignals ?? [];
  const craftSignals: string[] = analysis?.craftSignals ?? [];
  const pinnedSignals: string[] = asset?.metadata?.pinnedSignals ?? [];
  const loadingStatus = asset?.metadata?.loadingStatus as string | undefined;

  const cardLabel = (() => {
    if (!asset) return null;
    if (asset.type === "url") {
      const domain = (asset.metadata?.urlMeta as { domain?: string } | undefined)?.domain;
      const title = (asset.metadata?.urlMeta as { title?: string } | undefined)?.title;
      return domain || title || asset.source || "URL";
    }
    if (asset.type === "image") return "Image";
    if (asset.type === "text") {
      const text = asset.rawText?.trim();
      return text ? text.slice(0, 60) + (text.length > 60 ? "…" : "") : "Note";
    }
    return null;
  })();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-sb-border-subtle shrink-0">
        <p className="text-[10px] tracking-[0.15em] uppercase font-medium text-sb-accent opacity-70">
          Card
        </p>
        {cardLabel && (
          <p className="text-[11px] text-sb-text-muted mt-0.5 truncate">{cardLabel}</p>
        )}
      </div>

      {isEmpty ? (
        <div className="flex-1 flex items-center justify-center px-4">
          <p className="text-[10px] text-sb-text-muted opacity-40 text-center leading-relaxed">
            Select a reference card to inspect signals and annotate
          </p>
        </div>
      ) : (
        <>
          {/* Signals */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1 min-h-0">
            {loadingStatus === "analyzing" && (
              <p className="text-[9px] tracking-[0.12em] uppercase font-medium text-sb-accent opacity-60 animate-pulse">
                Extracting signals…
              </p>
            )}

            {perceptualSignals.length === 0 && craftSignals.length === 0 && loadingStatus !== "analyzing" && (
              <p className="text-[11px] text-sb-text-muted opacity-40 leading-relaxed">
                No signals yet.
              </p>
            )}

            {perceptualSignals.map((s) => (
              <div key={s} className="flex items-start gap-1.5">
                <span className="text-[11px] text-sb-text-muted leading-relaxed flex-1">{s}</span>
                <PinButton assetId={asset!.id} signal={s} pinnedSignals={pinnedSignals} />
              </div>
            ))}
            {craftSignals.map((s) => (
              <div key={s} className="flex items-start gap-1.5">
                <span className="text-[9px] text-sb-text-muted opacity-60 leading-relaxed flex-1">{s}</span>
                <PinButton assetId={asset!.id} signal={s} pinnedSignals={pinnedSignals} />
              </div>
            ))}
          </div>

          {/* Annotation */}
          <div className="px-4 pb-4 pt-2 border-t border-sb-border-subtle shrink-0">
            <textarea
              className="w-full bg-sb-base border border-sb-border rounded px-3 py-2 text-[11px] text-sb-text-secondary leading-relaxed resize-none outline-none focus:border-[rgba(201,148,74,0.40)] placeholder-sb-text-muted transition-colors"
              rows={3}
              placeholder="What about this is relevant? What to ignore?"
              value={annotationDraft}
              onChange={(e) => setAnnotationDraft(e.target.value)}
              onBlur={() => {
                if (annotationDraft !== annotationSaved.current) {
                  annotationSaved.current = annotationDraft;
                  updateAssetAnnotation(asset!.id, annotationDraft);
                }
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}
