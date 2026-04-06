"use client";

import { useEffect, useRef, useState } from "react";
import { useSessionStore } from "@/store/useSessionStore";
import PinButton from "@/components/canvas/PinButton";

export default function CardInspectorPanel() {
  const { selectedAssetId, assets, updateAssetAnnotation } = useSessionStore();
  const asset = assets.find((a) => a.id === selectedAssetId) ?? null;

  const [annotationDraft, setAnnotationDraft] = useState("");
  const annotationSaved = useRef("");
  const [signalsExpanded, setSignalsExpanded] = useState(false);

  useEffect(() => {
    const val = asset?.metadata?.annotation ?? "";
    setAnnotationDraft(val);
    annotationSaved.current = val;
    setSignalsExpanded(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asset?.id]);

  const isEmpty = !asset || asset.type === "merge" || asset.type === "output";

  const analysis = asset?.metadata?.analysis;
  const perceptualSignals: string[] = analysis?.perceptualSignals ?? [];
  const craftSignals: string[] = analysis?.craftSignals ?? [];
  const pinnedSignals: string[] = asset?.metadata?.pinnedSignals ?? [];
  const loadingStatus = asset?.metadata?.loadingStatus as string | undefined;
  const signalCount = perceptualSignals.length + craftSignals.length;
  const pinnedCount = pinnedSignals.length;

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
      return text ? (text.length > 60 ? text.slice(0, 60) + "…" : text) : "Note";
    }
    return null;
  })();

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-sb-border-subtle">
        <p className="text-[9px] tracking-[0.15em] uppercase font-medium text-sb-accent opacity-60">
          Card
        </p>
        {cardLabel && (
          <p className="text-[11px] text-sb-text-muted mt-0.5 truncate">{cardLabel}</p>
        )}
      </div>

      {isEmpty ? (
        <div className="px-4 py-5 flex items-center justify-center">
          <p className="text-[10px] text-sb-text-muted opacity-30 text-center leading-relaxed">
            Select a card to annotate
          </p>
        </div>
      ) : (
        <div className="flex flex-col">
          {/* Annotation — primary surface */}
          <div className="px-4 pt-3 pb-2">
            <textarea
              rows={4}
              className="w-full bg-transparent outline-none text-[11px] text-sb-text-secondary leading-relaxed resize-none placeholder-sb-text-muted"
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

          {/* Signal summary — secondary, collapsed by default */}
          <div className="px-4 pb-3 border-t border-sb-border-subtle pt-2.5">
            {loadingStatus === "analyzing" ? (
              <p className="text-[9px] tracking-[0.12em] uppercase text-sb-accent opacity-50 animate-pulse">
                Extracting signals…
              </p>
            ) : signalCount > 0 ? (
              <button
                onClick={() => setSignalsExpanded((v) => !v)}
                className="flex items-center w-full text-left text-[10px] text-sb-text-muted hover:text-sb-text-secondary transition-colors"
              >
                <span>
                  {signalCount} signal{signalCount !== 1 ? "s" : ""}
                  {pinnedCount > 0 && (
                    <span className="text-sb-accent"> · {pinnedCount} pinned</span>
                  )}
                </span>
                <span className="ml-auto opacity-40 text-[8px] leading-none">
                  {signalsExpanded ? "▴" : "▾"}
                </span>
              </button>
            ) : (
              <p className="text-[10px] text-sb-text-muted opacity-30">No signals yet</p>
            )}

            {signalsExpanded && signalCount > 0 && (
              <div className="mt-2 space-y-0.5 max-h-[120px] overflow-y-auto">
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
            )}
          </div>
        </div>
      )}
    </div>
  );
}
