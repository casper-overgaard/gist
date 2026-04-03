import { Asset } from "@signalboard/domain";
import { Handle, Position } from "@xyflow/react";
import { useSessionStore } from "@/store/useSessionStore";

export default function UrlNodeComponent({ data }: { data: { asset: Asset } }) {
  const { asset } = data;
  const { removeAsset } = useSessionStore();

  const meta = asset.metadata?.urlMeta as {
    title?: string;
    description?: string;
    imageUrl?: string;
    domain?: string;
  } | undefined;

  const analysis = asset.metadata?.analysis;
  const loadingStatus = asset.metadata?.loadingStatus;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded shadow-xl w-[260px] relative group">
      <button
        onClick={() => removeAsset(asset.id)}
        className="absolute top-1.5 right-1.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 flex items-center justify-center rounded text-neutral-500 hover:text-red-400 hover:bg-neutral-800 text-xs leading-none"
        title="Remove"
      >
        ×
      </button>
      <Handle type="target" position={Position.Top} className="opacity-0" />

      {meta?.imageUrl && (
        <img
          src={meta.imageUrl}
          alt=""
          className="w-full h-28 object-cover rounded-t"
          draggable={false}
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      )}

      <div className="p-3">
        <p className="text-[10px] text-neutral-500 uppercase tracking-wide mb-1">
          {meta?.domain ?? asset.source ?? "URL"}
        </p>

        {loadingStatus === "fetching" && (
          <p className="text-xs text-neutral-400 animate-pulse">Fetching page...</p>
        )}
        {loadingStatus === "analyzing" && (
          <p className="text-xs text-neutral-400 animate-pulse">Analyzing...</p>
        )}

        {meta?.title && (
          <p className="text-xs text-neutral-200 font-medium leading-snug line-clamp-2">
            {meta.title}
          </p>
        )}
        {meta?.description && (
          <p className="text-[11px] text-neutral-500 mt-1 leading-snug line-clamp-2">
            {meta.description}
          </p>
        )}

        {analysis?.tags && analysis.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1 border-t border-neutral-800 pt-2">
            {analysis.tags.slice(0, 4).map((tag: string) => (
              <span
                key={tag}
                className="text-[10px] bg-neutral-800 text-neutral-300 px-1.5 py-0.5 rounded border border-neutral-700 uppercase tracking-wide"
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
