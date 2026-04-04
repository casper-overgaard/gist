import { Asset } from "@signalboard/domain";
import { Handle, Position } from "@xyflow/react";
import { useSessionStore } from "@/store/useSessionStore";
import { useAssetAnalysis } from "@/hooks/useAssetAnalysis";

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

  const borderClass = selected
    ? "border-[rgba(201,148,74,0.35)]"
    : "border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.14)]";

  return (
    <div className={`bg-sb-surface-1 border rounded w-[260px] relative group overflow-hidden transition-colors ${borderClass}`}>
      {/* Confidence thread */}
      {analysis && (
        <div
          className="absolute left-0 top-0 bottom-0 w-0.5 z-10"
          style={{ backgroundColor: `rgba(201, 148, 74, ${Math.max(0.2, confidence).toFixed(2)})` }}
        />
      )}

      <button
        onClick={() => removeAsset(asset.id)}
        className="absolute top-1.5 right-1.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 flex items-center justify-center rounded text-sb-text-muted hover:text-sb-destructive hover:bg-[rgba(0,0,0,0.40)] text-sm leading-none"
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
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      )}

      <div className="p-3">
        <p className="text-[9px] tracking-[0.14em] uppercase text-sb-accent opacity-60 mb-1.5">
          {meta?.domain ?? asset.source ?? "URL"}
        </p>

        {loadingStatus === "fetching" && (
          <p className="text-[10px] text-sb-text-muted animate-pulse">Fetching page…</p>
        )}

        {meta?.title && (
          <p className="text-xs text-sb-text-primary font-medium leading-snug line-clamp-2">
            {meta.title}
          </p>
        )}
        {meta?.description && (
          <p className="text-[11px] text-sb-text-secondary mt-1 leading-snug line-clamp-2">
            {meta.description}
          </p>
        )}

        {loadingStatus === "analyzing" && (
          <p className="mt-2 text-[9px] tracking-[0.12em] uppercase text-sb-accent opacity-60 animate-pulse">
            Extracting signals…
          </p>
        )}

        {loadingStatus === "idle" && meta?.title && (
          <button
            onClick={() => triggerAnalysis(asset)}
            className="mt-2 text-[9px] tracking-[0.10em] uppercase text-sb-accent px-2 py-1 rounded border border-[rgba(201,148,74,0.25)] hover:border-[rgba(201,148,74,0.50)] opacity-70 hover:opacity-100 transition-all"
          >
            Analyze
          </button>
        )}

        {analysis?.tags && analysis.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1 border-t border-[rgba(255,255,255,0.06)] pt-2">
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
