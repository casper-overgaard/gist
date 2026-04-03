"use client";

import React, { useCallback, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Node,
  NodeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useSessionStore } from "@/store/useSessionStore";
import TextNodeComponent from "./TextNode";
import ImageNodeComponent from "./ImageNode";
import UrlNodeComponent from "./UrlNode";
import { uploadAssetImage } from "@/lib/storage";
import { analyzeAssetAction } from "@/actions/analyze";
import { fetchUrlMetadataAction } from "@/actions/fetchUrl";

const nodeTypes = {
  text: TextNodeComponent,
  image: ImageNodeComponent,
  url: UrlNodeComponent,
};

export default function Canvas() {
  const { assets, updateAssetPosition } = useSessionStore();
  const [isDragging, setIsDragging] = React.useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [urlInputOpen, setUrlInputOpen] = useState(false);
  const [urlLoading, setUrlLoading] = useState(false);

  const nodes: Node[] = React.useMemo(
    () =>
      assets.map((asset) => ({
        id: asset.id,
        position: { x: asset.canvasPosition?.x ?? 0, y: asset.canvasPosition?.y ?? 0 },
        data: { asset },
        type: asset.type === "text" ? "text" : asset.type === "url" ? "url" : "image",
      })),
    [assets]
  );

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      changes.forEach((change) => {
        if (change.type === "position" && change.position) {
          // If dragging, we update local Zustand state but don't hammer Firebase.
          // If dragging finished (!change.dragging), we fire the Firebase mutation.
          updateAssetPosition(change.id, change.position.x, change.position.y, !change.dragging);
        }
      });
    },
    [updateAssetPosition]
  );

  const handleAddText = async () => {
    if (!assets) return;
    const newAsset = {
      id: crypto.randomUUID(),
      sessionId: assets[0]?.sessionId || "", // We should ideally get sessionId from params, but store holds it
      type: "text" as const,
      rawText: "New idea...",
      canvasPosition: { x: Math.random() * 200, y: Math.random() * 200 },
      createdAt: new Date().toISOString()
    };
    
    // Quick fallback to ensure we have a valid session id in case assets is empty
    const sessionId = window.location.search.split("=")[1] || window.location.pathname.split("/").pop();
    if (sessionId) {
      newAsset.sessionId = sessionId;
      await useSessionStore.getState().addAsset(newAsset);
    }
  };

  const handleAddUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = urlInput.trim();
    if (!raw || urlLoading) return;

    const sessionId = window.location.search.split("=")[1] || window.location.pathname.split("/").pop();
    if (!sessionId) return;

    setUrlLoading(true);
    setUrlInput("");
    setUrlInputOpen(false);

    const assetId = crypto.randomUUID();
    const placeholder: any = {
      id: assetId,
      sessionId,
      type: "url" as const,
      source: raw.startsWith("http") ? raw : `https://${raw}`,
      rawText: null,
      metadata: { loadingStatus: "fetching" },
      canvasPosition: { x: Math.random() * 300 + 100, y: Math.random() * 200 + 50 },
      createdAt: new Date().toISOString(),
    };
    await useSessionStore.getState().addAsset(placeholder);

    try {
      const metaResult = await fetchUrlMetadataAction(raw);
      if (!metaResult.success) throw new Error(metaResult.error);

      const { title, description, imageUrl, domain, url } = metaResult.data;
      const analysisText = [title, description].filter(Boolean).join(". ");

      const withMeta = {
        ...placeholder,
        source: url,
        metadata: { loadingStatus: "analyzing", urlMeta: { title, description, imageUrl, domain } },
      };
      await useSessionStore.getState().addAsset(withMeta);

      const analysisResult = analysisText
        ? await analyzeAssetAction({ text: analysisText })
        : { success: false };

      await useSessionStore.getState().addAsset({
        ...withMeta,
        metadata: {
          ...withMeta.metadata,
          loadingStatus: "done",
          analysis: analysisResult.success ? (analysisResult as any).data : null,
        },
      });
    } catch (err) {
      console.error("URL asset failed:", err);
      await useSessionStore.getState().addAsset({
        ...placeholder,
        metadata: { loadingStatus: "error" },
      });
    } finally {
      setUrlLoading(false);
    }
  };

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const onDrop = useCallback(async (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    
    const sessionId = window.location.search.split("=")[1] || window.location.pathname.split("/").pop();
    if (!sessionId || !assets) return;

    // Optional: get drop position natively if we had access to ReactFlow instance projecting to canvas coords
    // For now we just dump them near center
    const dropX = event.clientX / 2;
    const dropY = event.clientY / 2;

    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      if (!file.type.startsWith('image/')) return;

      const newAsset: any = {
        id: crypto.randomUUID(),
        sessionId: sessionId,
        type: "image",
        rawText: null,
        metadata: { loadingStatus: 'uploading' },
        canvasPosition: { x: dropX, y: dropY },
        createdAt: new Date().toISOString()
      };
      
      // Save placeholder asset optimistic
      await useSessionStore.getState().addAsset(newAsset);

      // Upload image
      const imageUrl = await uploadAssetImage(sessionId, file);
      
      // Update with image url
      newAsset.contentRef = imageUrl;
      newAsset.metadata = { loadingStatus: 'analyzing' };
      await useSessionStore.getState().addAsset(newAsset); // setDoc overwrites keeping ID

      // Fire Analysis
      const analysisResult = await analyzeAssetAction({ imageUrl });
      
      // Persist analysis onto asset natively
      newAsset.metadata = { 
        loadingStatus: 'done',
        analysis: analysisResult.success ? analysisResult.data : null 
      };
      await useSessionStore.getState().addAsset(newAsset);
    }
  }, [assets]);

  return (
    <div 
      className="w-full h-full relative"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-blue-500/20 border-4 border-blue-500 border-dashed flex items-center justify-center pointer-events-none">
          <p className="text-4xl font-bold font-sans text-blue-400 drop-shadow-md">Drop Image to Analyze</p>
        </div>
      )}
      <div className="absolute top-4 right-4 z-10 flex gap-2 items-start">
        {urlInputOpen && (
          <form onSubmit={handleAddUrl} className="flex gap-1">
            <input
              autoFocus
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && setUrlInputOpen(false)}
              placeholder="https://..."
              className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded text-white text-sm w-56 outline-none focus:border-neutral-500 placeholder-neutral-600"
            />
            <button
              type="submit"
              disabled={urlLoading}
              className="px-3 py-2 bg-neutral-800 text-white border border-neutral-700 rounded shadow hover:bg-neutral-700 transition text-sm disabled:opacity-40"
            >
              {urlLoading ? "..." : "Add"}
            </button>
          </form>
        )}
        <button
          onClick={() => setUrlInputOpen((v) => !v)}
          className="px-4 py-2 bg-neutral-800 text-white border border-neutral-700 rounded shadow hover:bg-neutral-700 transition text-sm"
        >
          + URL
        </button>
        <button
          onClick={handleAddText}
          className="px-4 py-2 bg-neutral-800 text-white border border-neutral-700 rounded shadow hover:bg-neutral-700 transition text-sm"
        >
          + Text Note
        </button>
      </div>
      <ReactFlow
        nodes={nodes}
        onNodesChange={handleNodesChange}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background gap={24} size={2} color="#333" />
        <Controls />
      </ReactFlow>
    </div>
  );
}
