import React, { useState, useEffect } from "react";
import { Asset } from "@signalboard/domain";
import { Handle, Position } from "@xyflow/react";
import { useSessionStore } from "@/store/useSessionStore";
import { analyzeAssetAction } from "@/actions/analyze";

export default function TextNodeComponent({ data }: { data: { asset: Asset } }) {
  const { asset } = data;
  const { updateAssetText, addAsset } = useSessionStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [textVal, setTextVal] = useState(asset.rawText || "");

  const analysis = asset.metadata?.analysis;
  const metadata = asset.metadata || {};

  // Sync internal state if DB changes externally
  useEffect(() => {
    if (!isEditing && asset.rawText !== textVal) {
      setTextVal(asset.rawText || "");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asset.rawText, isEditing]);

  const handleBlur = async () => {
    setIsEditing(false);
    if (textVal !== asset.rawText && textVal.trim() !== "") {
      // 1. Save text
      await updateAssetText(asset.id, textVal);
      
      // 2. Set analyzing status
      const placeholderAuth = { ...asset, rawText: textVal, metadata: { ...metadata, loadingStatus: 'analyzing' } };
      await addAsset(placeholderAuth);

      // 3. Analyze text
      const analysisResult = await analyzeAssetAction({ text: textVal });
      
      // 4. Save analysis
      await addAsset({
        ...placeholderAuth,
        metadata: {
          ...metadata,
          loadingStatus: 'done',
          analysis: analysisResult.success ? analysisResult.data : null
        }
      });
    }
  };

  return (
    <div className="bg-neutral-800 border border-neutral-700 w-[240px] p-4 font-mono text-sm rounded shadow-lg">
      <Handle type="target" position={Position.Top} className="opacity-0" />
      
      {isEditing ? (
        <textarea
          autoFocus
          className="w-full bg-transparent text-white outline-none resize-none"
          value={textVal}
          onChange={(e) => setTextVal(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              e.currentTarget.blur();
            }
          }}
        />
      ) : (
        <div 
          className="text-white whitespace-pre-wrap cursor-text min-h-[1.5rem]"
          onClick={() => setIsEditing(true)}
        >
          {textVal || "Click to type note..."}
        </div>
      )}

      {/* Loading state rendering */}
      {metadata.loadingStatus === 'analyzing' && (
        <div className="mt-2 text-xs text-neutral-400 animate-pulse">
          Analyzing note...
        </div>
      )}

      {/* Display Analysis Tags */}
      {analysis?.tags && analysis.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1 border-t border-neutral-700 pt-2">
          {analysis.tags.slice(0, 4).map((tag: string) => (
            <span key={tag} className="text-[10px] bg-neutral-900 text-neutral-300 px-1.5 py-0.5 rounded shadow-sm border border-neutral-700 uppercase tracking-wide">
              {tag}
            </span>
          ))}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
}
