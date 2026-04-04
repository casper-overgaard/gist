import { Asset } from "@signalboard/domain";
import { Handle, Position } from "@xyflow/react";
import { useSessionStore } from "@/store/useSessionStore";
import { useAssetAnalysis } from "@/hooks/useAssetAnalysis";
import PinButton from "./PinButton";

interface UrlNodeProps {
  data: { asset: Asset };
  selected: boolean;
}

export default function UrlNodeComponent({ data, selected }: UrlNodeProps) {
  const { asset } = data;
  const { removeAsset } = useSessionStore();
  const { triggerAnalysis } = useAssetAnalysis();

  const meta = asset.metadata?.urlMeta as {
    title?: string;
    description?: string;
    imageUrl?: string;
    domain?: string;
  } | undefined;

  const analysis = asset.metadata?.analysis;
  const loadingStatus = asset.metadata?.loadingStatus as string | undefined;
  const confidence = analysis?.confidence ?? 0;
  const pinnedSignals: string[] = asset.metadata?.pinnedSignals ?? [];

  const perceptualSignals: string[] = analysis?.perceptualSignals ?? [];
  const craftSignals: string[] = analysis?.craftSignals ?? [];
  const hasSignals = perceptualSignals.length > 0 || craftSignals.length > 0;

  const borderClass = selected
    ? "border-[rgba(201,148,74,0.35)]"
    : "border-sb-border hover:border-sb-border-hover";

  return (
    <div className={`bg-sb-surface-1 border rounded w-[260px] relative group overflow-hidden transition-colors ${borderClass}`}>
      {analysis && (
        <div
          className="absolute left-0 top-0 bottom-0 w-0.5 z-10"
          style={{ backgroundColor: `rgba(201, 148, 74, ${Math.max(0.2, confidence).toFixed(2)})` }}
        />
      )}

      <button
        onClick={() => removeAsset(asset.id)}
        className="absolute top-1.5 right-1.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 flex items-center justify-center rounded text-sb-text-muted hover:text-sb-destructive hover:bg-[rgba(0,0,0,0.30)] text-sm leading-none"
        title="Remove"
      >
        ×
      </button>

      <Handle type="target" position={Position.Top} className="opacity-0" />

      {meta?.imageUrl && (
        <img
          src={meta.imageUrl}
          alt=""
          className="w-full h-28 object-cover"
          draggable={false}
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      )}

      <div className="p-3">
        {/* Domain stamp */}
        <p className="text-[9px] tracking-[0.16em] uppercase font-medium text-sb-accent opacity-60 mb-2">
          {meta?.domain ?? asset.source ?? "URL"}
        </p>

        {loadingStatus === "fetching" && (
          <p className="text-[10px] text-sb-text-muted animate-pulse">Fetching page…</p>
        )}

        {meta?.title && (
          <p className="text-[13px] font-medium leading-snug text-sb-text-primary line-clamp-2">
            {meta.title}
          </p>
        )}
        {meta?.description && (
          <p className="text-[11px] text-sb-text-secondary mt-1.5 leading-[1.55] line-clamp-2">
            {meta.description}
          </p>
        )}

        {loadingStatus === "analyzing" && (
          <p className="mt-2 text-[9px] tracking-[0.12em] uppercase font-medium text-sb-accent opacity-60 animate-pulse">
            Extracting signals…
          </p>
        )}

        {loadingStatus === "idle" && meta?.title && (
          <button
            onClick={() => triggerAnalysis(asset)}
            className="mt-2.5 text-[9px] tracking-[0.10em] uppercase font-medium text-sb-accent px-2 py-1 rounded border border-[rgba(201,148,74,0.22)] hover:border-[rgba(201,148,74,0.50)] opacity-60 hover:opacity-100 transition-all"
          >
            Analyze
          </button>
        )}

        {/* Signals — rest=hidden, hover=read-only, active=pins visible */}
        {hasSignals && (
          <div className={`border-t border-sb-border-subtle pt-2 mt-2 transition-opacity duration-150 ${selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
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
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
}
