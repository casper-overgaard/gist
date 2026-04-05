import { useState, useCallback, useMemo } from "react";
import { Handle, Position, useReactFlow } from "@xyflow/react";
import { Asset } from "@signalboard/domain";
import { ConnectedAsset } from "@signalboard/llm";
import { useSessionStore } from "@/store/useSessionStore";
import { generateMergeOutputAction } from "@/actions/merge";

interface MergeNodeProps {
  data: { asset: Asset };
  id: string;
  selected: boolean;
}

function getSessionId() {
  return window.location.search.split("=")[1] || window.location.pathname.split("/").pop() || "";
}

export default function MergeNodeComponent({ data, id, selected }: MergeNodeProps) {
  const { asset } = data;
  const { assets, edges, session, removeAsset, addAsset } = useSessionStore();
  const { getNode } = useReactFlow();

  const [isGenerating, setIsGenerating] = useState(false);

  // Find assets connected to this merge node as sources
  const connectedAssets = useMemo(() => {
    const connectedIds = edges.filter((e) => e.target === id).map((e) => e.source);
    return connectedIds
      .map((aid) => assets.find((a) => a.id === aid))
      .filter((a): a is Asset => !!a && a.type !== "merge" && a.type !== "output");
  }, [edges, assets, id]);

  const loadingStatus = asset.metadata?.loadingStatus as string | undefined;
  const borderClass = selected
    ? "border-[rgba(201,148,74,0.50)]"
    : "border-[rgba(201,148,74,0.20)] hover:border-[rgba(201,148,74,0.40)]";

  const handleGenerate = useCallback(async () => {
    if (isGenerating || connectedAssets.length < 1) return;
    setIsGenerating(true);

    const sessionId = getSessionId();
    if (!sessionId) return;

    const connectedAssetInputs: ConnectedAsset[] = connectedAssets.map((a) => ({
      type: a.type,
      label:
        (a.metadata?.urlMeta as { title?: string; domain?: string } | undefined)?.title ||
        (a.metadata?.urlMeta as { title?: string; domain?: string } | undefined)?.domain ||
        a.source ||
        a.type,
      annotation: (a.metadata?.annotation as string | undefined) || undefined,
      perceptualSignals: (a.metadata?.analysis?.perceptualSignals as string[]) ?? [],
      craftSignals: (a.metadata?.analysis?.craftSignals as string[]) ?? [],
    }));

    // Update merge node to "generating" state
    await addAsset({ ...asset, metadata: { ...asset.metadata, loadingStatus: "generating" } });

    try {
      const result = await generateMergeOutputAction({
        assets: connectedAssetInputs,
        sessionContext: session?.userIntent,
      });

      if (!result.success) throw new Error(result.error);

      // Place the OutputNode to the right of this merge node
      const mergeNode = getNode(id);
      const outputPos = {
        x: (mergeNode?.position.x ?? 0) + 320,
        y: mergeNode?.position.y ?? 0,
      };

      const outputAsset: Asset = {
        id: crypto.randomUUID(),
        sessionId,
        type: "output" as const,
        rawText: null,
        metadata: {
          loadingStatus: "idle",
          mergeOutput: result.data,
          sourceNodeId: id,
        },
        canvasPosition: outputPos,
        createdAt: new Date().toISOString(),
      };

      await addAsset(outputAsset);
      await addAsset({ ...asset, metadata: { ...asset.metadata, loadingStatus: "idle", lastOutputId: outputAsset.id } });
    } catch (err) {
      console.error("Merge generation failed:", err);
      await addAsset({ ...asset, metadata: { ...asset.metadata, loadingStatus: "idle" } });
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, connectedAssets, asset, addAsset, getNode, id, session]);

  return (
    <div className={`bg-sb-surface-1 border rounded w-[220px] relative group transition-colors ${borderClass}`}>
      <button
        onClick={() => removeAsset(asset.id)}
        className="absolute top-1.5 right-1.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 flex items-center justify-center rounded text-sb-text-muted hover:text-sb-destructive hover:bg-[rgba(0,0,0,0.30)] text-sm leading-none"
        title="Remove"
      >
        ×
      </button>

      {/* Multiple target handles for connecting from asset nodes */}
      <Handle type="target" position={Position.Left} id="in" className="!w-2.5 !h-2.5 !bg-[rgba(201,148,74,0.4)] !border-[rgba(201,148,74,0.6)] opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="px-3 py-3">
        <p className="text-[9px] tracking-[0.16em] uppercase font-medium text-sb-accent mb-2">
          Merge
        </p>

        {connectedAssets.length === 0 ? (
          <p className="text-[11px] text-sb-text-muted leading-relaxed">
            Connect asset nodes to this merge node to synthesize a spec fragment.
          </p>
        ) : (
          <div className="mb-2.5">
            <p className="text-[11px] text-sb-text-muted mb-1.5">
              {connectedAssets.length} reference{connectedAssets.length !== 1 ? "s" : ""} connected
            </p>
            <div className="space-y-0.5">
              {connectedAssets.map((a) => (
                <p key={a.id} className="text-[10px] text-sb-text-muted opacity-60 truncate">
                  {(a.metadata?.urlMeta as { title?: string; domain?: string } | undefined)?.domain ||
                    (a.metadata?.urlMeta as { title?: string; domain?: string } | undefined)?.title ||
                    a.source ||
                    a.type}
                </p>
              ))}
            </div>
          </div>
        )}

        {loadingStatus === "generating" || isGenerating ? (
          <p className="text-[9px] tracking-[0.12em] uppercase font-medium text-sb-accent opacity-60 animate-pulse">
            Synthesizing…
          </p>
        ) : (
          <button
            onClick={handleGenerate}
            disabled={connectedAssets.length < 1}
            className="text-[9px] tracking-[0.10em] uppercase font-medium text-sb-accent px-2 py-1 rounded border border-[rgba(201,148,74,0.22)] hover:border-[rgba(201,148,74,0.50)] opacity-60 hover:opacity-100 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
          >
            Generate fragment
          </button>
        )}
      </div>

      <Handle type="source" position={Position.Right} id="out" className="opacity-0" />
    </div>
  );
}
