import { Asset } from "@signalboard/domain";
import { Handle, Position } from "@xyflow/react";
import { useSessionStore } from "@/store/useSessionStore";

interface ImageNodeProps {
  data: { asset: Asset };
  selected: boolean;
}

export default function ImageNodeComponent({ data, selected }: ImageNodeProps) {
  const { asset } = data;
  const { removeAsset } = useSessionStore();

  const imageUrl = asset.contentRef || asset.source;
  const analysis = asset.metadata?.analysis;
  const metadata = asset.metadata || {};
  const loadingStatus = metadata.loadingStatus as string | undefined;
  const confidence = analysis?.confidence ?? 0;

  const borderClass = selected
    ? "border-[rgba(201,148,74,0.35)]"
    : "border-sb-border hover:border-sb-border-hover";

  return (
    <div className={`bg-sb-surface-1 border rounded max-w-[300px] relative group overflow-hidden transition-colors ${borderClass}`}>
      {analysis && (
        <div
          className="absolute left-0 top-0 bottom-0 w-0.5 z-10"
          style={{ backgroundColor: `rgba(201, 148, 74, ${Math.max(0.2, confidence).toFixed(2)})` }}
        />
      )}

      <button
        onClick={() => removeAsset(asset.id)}
        className="absolute top-1.5 right-1.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 flex items-center justify-center rounded text-sb-text-muted hover:text-sb-destructive hover:bg-[rgba(0,0,0,0.35)] text-sm leading-none"
        title="Remove"
      >
        ×
      </button>

      <div className={`absolute top-1.5 left-3 z-10 transition-opacity ${selected ? "opacity-100" : "opacity-0 group-hover:opacity-60"}`}>
        <p className="text-[9px] tracking-[0.14em] uppercase font-medium text-sb-text-muted">Image</p>
      </div>

      <Handle type="target" position={Position.Top} className="opacity-0" />

      {loadingStatus === "uploading" && (
        <div className="flex items-center justify-center h-40 animate-pulse">
          <p className="text-[9px] tracking-[0.12em] uppercase font-medium text-sb-text-muted">Uploading…</p>
        </div>
      )}

      {imageUrl && loadingStatus !== "uploading" && (
        <img src={imageUrl} alt="Canvas asset" className="w-full h-40 object-cover" draggable={false} />
      )}

      {loadingStatus === "analyzing" && (
        <div className="px-3 py-2">
          <p className="text-[9px] tracking-[0.12em] uppercase font-medium text-sb-accent opacity-60 animate-pulse">
            Extracting signals…
          </p>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!w-2.5 !h-2.5 !bg-[rgba(201,148,74,0.4)] !border-[rgba(201,148,74,0.6)] opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}
