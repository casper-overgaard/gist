import { Asset } from "@signalboard/domain";
import { Handle, Position } from "@xyflow/react";
import { useSessionStore } from "@/store/useSessionStore";

export default function ImageNodeComponent({ data }: { data: { asset: Asset } }) {
  const { asset } = data;
  const { removeAsset } = useSessionStore();
  const imageUrl = asset.contentRef || asset.source;
  const analysis = asset.metadata?.analysis;
  const metadata = asset.metadata || {};
  const confidence = analysis?.confidence ?? 0;

  return (
    <div className="bg-sb-surface-1 border border-[rgba(255,255,255,0.08)] rounded max-w-[300px] relative group overflow-hidden">
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

      {metadata.loadingStatus !== "done" && metadata.loadingStatus && (
        <div className="flex items-center justify-center p-6 min-h-[100px] animate-pulse">
          <p className="text-[10px] tracking-[0.12em] uppercase text-sb-text-muted">
            {metadata.loadingStatus === "uploading" ? "Uploading…" : "Analyzing…"}
          </p>
        </div>
      )}

      {imageUrl && metadata.loadingStatus !== "uploading" && (
        <img
          src={imageUrl}
          alt="Canvas asset"
          className="w-full h-auto object-cover"
          draggable={false}
        />
      )}

      {analysis?.tags && analysis.tags.length > 0 && (
        <div className="p-2 flex flex-wrap gap-1">
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

      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
}
