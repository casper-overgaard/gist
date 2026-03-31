import { Asset } from "@signalboard/domain";
import { Handle, Position } from "@xyflow/react";

export default function ImageNodeComponent({ data }: { data: { asset: Asset } }) {
  const { asset } = data;
  const imageUrl = asset.contentRef || asset.source;
  const analysis = asset.metadata?.analysis;
  const metadata = asset.metadata || {};

  return (
    <div className="bg-neutral-900 border border-neutral-800 p-2 rounded shadow-xl max-w-[300px]">
      <Handle type="target" position={Position.Top} className="opacity-0" />
      
      {/* Loading state rendering */}
      {metadata.loadingStatus !== 'done' && metadata.loadingStatus && (
        <div className="flex items-center justify-center p-4 min-h-[100px] border border-dashed border-neutral-700 bg-neutral-800 animate-pulse rounded text-neutral-400 text-sm">
          {metadata.loadingStatus === 'uploading' ? 'Uploading Image...' : 'Analyzing Style...'}
        </div>
      )}

      {/* Render Image once available */}
      {imageUrl && metadata.loadingStatus !== 'uploading' && (
        <img
          src={imageUrl}
          alt="Canvas Element"
          className="w-full h-auto rounded object-cover"
          draggable={false}
        />
      )}

      {/* Display Analysis Tags directly on the node */}
      {analysis?.tags && analysis.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {analysis.tags.slice(0, 4).map((tag: string) => (
            <span key={tag} className="text-[10px] bg-neutral-800 text-neutral-300 px-1.5 py-0.5 rounded shadow-sm border border-neutral-700 uppercase tracking-wide">
              {tag}
            </span>
          ))}
        </div>
      )}
      
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
}
