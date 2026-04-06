import { Asset } from "@signalboard/domain";
import { Handle, Position } from "@xyflow/react";
import { useSessionStore } from "@/store/useSessionStore";

interface UrlNodeProps {
  data: { asset: Asset };
  selected: boolean;
}

export default function UrlNodeComponent({ data, selected }: UrlNodeProps) {
  const { asset } = data;
  const { removeAsset } = useSessionStore();

  const meta = asset.metadata?.urlMeta as {
    title?: string;
    description?: string;
    imageUrl?: string;
    domain?: string;
  } | undefined;

  const analysis = asset.metadata?.analysis;
  const loadingStatus = asset.metadata?.loadingStatus as string | undefined;
  const confidence = analysis?.confidence ?? 0;
  const signalCount = (analysis?.perceptualSignals?.length ?? 0) + (analysis?.craftSignals?.length ?? 0);

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

      <div className="p-3">
        {/* Domain stamp */}
        <p className="text-[9px] tracking-[0.16em] uppercase font-medium text-sb-accent opacity-60 mb-1.5">
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

        {loadingStatus === "analyzing" ? (
          <p className="mt-2 text-[9px] tracking-[0.12em] uppercase font-medium text-sb-accent opacity-60 animate-pulse">
            Extracting signals…
          </p>
        ) : signalCount > 0 ? (
          <p className="mt-1 text-[9px] text-sb-accent opacity-50">
            {signalCount} signal{signalCount !== 1 ? "s" : ""}
          </p>
        ) : null}
      </div>

      <Handle type="source" position={Position.Bottom} className="!w-2.5 !h-2.5 !bg-[rgba(201,148,74,0.4)] !border-[rgba(201,148,74,0.6)] opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}
