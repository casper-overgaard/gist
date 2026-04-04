"use client";

import React, { useCallback, useState } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  Node,
  NodeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useSessionStore } from "@/store/useSessionStore";
import { Asset } from "@signalboard/domain";
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
      sessionId: assets[0]?.sessionId || "",
      type: "text" as const,
      rawText: "New idea...",
      canvasPosition: { x: Math.random() * 200, y: Math.random() * 200 },
      createdAt: new Date().toISOString(),
    };

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
    const placeholder: Asset = {
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
          analysis: analysisResult.success && "data" in analysisResult ? analysisResult.data : null,
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
    event.dataTransfer.dropEffect = "copy";
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const onDrop = useCallback(
    async (event: React.DragEvent) => {
      event.preventDefault();
      setIsDragging(false);

      const sessionId = window.location.search.split("=")[1] || window.location.pathname.split("/").pop();
      if (!sessionId || !assets) return;

      const dropX = event.clientX / 2;
      const dropY = event.clientY / 2;

      if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
        const file = event.dataTransfer.files[0];
        if (!file.type.startsWith("image/")) return;

        const newAsset: Asset = {
          id: crypto.randomUUID(),
          sessionId: sessionId,
          type: "image" as const,
          rawText: null,
          metadata: { loadingStatus: "uploading" },
          canvasPosition: { x: dropX, y: dropY },
          createdAt: new Date().toISOString(),
        };

        await useSessionStore.getState().addAsset(newAsset);

        const imageUrl = await uploadAssetImage(sessionId, file);

        newAsset.contentRef = imageUrl;
        newAsset.metadata = { loadingStatus: "analyzing" };
        await useSessionStore.getState().addAsset(newAsset);

        const analysisResult = await analyzeAssetAction({ imageUrl });

        newAsset.metadata = {
          loadingStatus: "done",
          analysis: analysisResult.success ? analysisResult.data : null,
        };
        await useSessionStore.getState().addAsset(newAsset);
      }
    },
    [assets]
  );

  return (
    <div
      className="w-full h-full relative"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-[rgba(201,148,74,0.08)] border-2 border-dashed border-[rgba(201,148,74,0.50)] flex items-center justify-center pointer-events-none">
          <p className="text-sm tracking-[0.12em] uppercase text-sb-accent font-medium">
            Drop image to analyze
          </p>
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
              className="px-3 py-2 bg-sb-surface-1 border border-[rgba(255,255,255,0.08)] rounded text-sb-text-primary text-xs w-52 outline-none focus:border-[rgba(201,148,74,0.40)] placeholder-sb-text-muted transition-colors"
            />
            <button
              type="submit"
              disabled={urlLoading}
              className="px-3 py-2 bg-sb-surface-1 text-sb-text-primary border border-[rgba(255,255,255,0.08)] rounded hover:border-[rgba(255,255,255,0.14)] transition-colors text-xs disabled:opacity-40"
            >
              {urlLoading ? "…" : "Add"}
            </button>
          </form>
        )}
        <button
          onClick={() => setUrlInputOpen((v) => !v)}
          className="px-3 py-2 bg-sb-surface-1 text-sb-text-secondary border border-[rgba(255,255,255,0.08)] rounded hover:border-[rgba(255,255,255,0.14)] hover:text-sb-text-primary transition-colors text-xs"
        >
          + URL
        </button>
        <button
          onClick={handleAddText}
          className="px-3 py-2 bg-sb-surface-1 text-sb-text-secondary border border-[rgba(255,255,255,0.08)] rounded hover:border-[rgba(255,255,255,0.14)] hover:text-sb-text-primary transition-colors text-xs"
        >
          + Text note
        </button>
      </div>

      <ReactFlow
        nodes={nodes}
        onNodesChange={handleNodesChange}
        nodeTypes={nodeTypes}
        fitView
        style={{ background: "#100F0E" }}
        colorMode="dark"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={28}
          size={1}
          color="rgba(255,255,255,0.08)"
        />
        <Controls />
      </ReactFlow>
    </div>
  );
}
