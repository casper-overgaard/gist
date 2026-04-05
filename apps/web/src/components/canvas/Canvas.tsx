"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useSessionStore } from "@/store/useSessionStore";
import { Asset, CanvasEdge } from "@signalboard/domain";
import TextNodeComponent from "./TextNode";
import ImageNodeComponent from "./ImageNode";
import UrlNodeComponent from "./UrlNode";
import MergeNodeComponent from "./MergeNode";
import OutputNodeComponent from "./OutputNode";
import { uploadAssetImage } from "@/lib/storage";
import { fetchUrlMetadataAction } from "@/actions/fetchUrl";
import { useAssetAnalysis } from "@/hooks/useAssetAnalysis";
import ThemeToggle from "@/components/ThemeToggle";

const nodeTypes = {
  text: TextNodeComponent,
  image: ImageNodeComponent,
  url: UrlNodeComponent,
  merge: MergeNodeComponent,
  output: OutputNodeComponent,
};

function getSessionId() {
  return window.location.search.split("=")[1] || window.location.pathname.split("/").pop() || "";
}

function CanvasInner() {
  const { assets, edges: storedEdges, updateAssetPosition, addEdge: storeAddEdge, removeEdge: storeRemoveEdge, session } = useSessionStore();
  const { screenToFlowPosition } = useReactFlow();
  const { triggerAnalysis } = useAssetAnalysis();
  const containerRef = useRef<HTMLDivElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [urlInputOpen, setUrlInputOpen] = useState(false);
  const [urlLoading, setUrlLoading] = useState(false);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  // Sync nodes from assets, preserving selection state
  useEffect(() => {
    setNodes((prev) => {
      const prevMap = new Map(prev.map((n) => [n.id, n]));
      return assets.map((asset) => ({
        id: asset.id,
        position: { x: asset.canvasPosition?.x ?? 0, y: asset.canvasPosition?.y ?? 0 },
        data: { asset },
        type: asset.type === "text" ? "text" : asset.type === "url" ? "url" : asset.type === "merge" ? "merge" : asset.type === "output" ? "output" : "image",
        selected: prevMap.get(asset.id)?.selected ?? false,
      }));
    });
  }, [assets]);

  // Sync edges from Firestore
  useEffect(() => {
    setEdges(
      storedEdges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
      }))
    );
  }, [storedEdges]);

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      changes.forEach((change) => {
        if (change.type === "position" && change.position) {
          updateAssetPosition(change.id, change.position.x, change.position.y, !change.dragging);
        }
      });
      setNodes((prev) => applyNodeChanges(changes, prev));
    },
    [updateAssetPosition]
  );

  const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
    // Deletions: remove from Firestore
    changes.forEach((change) => {
      if (change.type === "remove") {
        storeRemoveEdge(change.id);
      }
    });
    setEdges((prev) => applyEdgeChanges(changes, prev));
  }, [storeRemoveEdge]);

  const handleConnect = useCallback(
    async (connection: Connection) => {
      const id = crypto.randomUUID();
      const newEdge: CanvasEdge = {
        id,
        source: connection.source,
        target: connection.target,
        createdAt: new Date().toISOString(),
      };
      await storeAddEdge(newEdge);
      setEdges((prev) => addEdge({ ...connection, id }, prev));
    },
    [storeAddEdge]
  );

  const pastePosition = useCallback(() => {
    const rect = containerRef.current?.getBoundingClientRect();
    const cx = (rect?.left ?? 0) + (rect?.width ?? window.innerWidth) / 2;
    const cy = (rect?.top ?? 0) + (rect?.height ?? window.innerHeight) / 2;
    return screenToFlowPosition({
      x: cx + (Math.random() * 140 - 70),
      y: cy + (Math.random() * 100 - 50),
    });
  }, [screenToFlowPosition]);

  const handleAddText = async () => {
    const sessionId = getSessionId();
    if (!sessionId) return;
    const pos = pastePosition();
    const newAsset: Asset = {
      id: crypto.randomUUID(),
      sessionId,
      type: "text" as const,
      rawText: "New idea...",
      metadata: {},
      canvasPosition: pos,
      createdAt: new Date().toISOString(),
    };
    await useSessionStore.getState().addAsset(newAsset);
  };

  const handleAddMergeNode = async () => {
    const sessionId = getSessionId();
    if (!sessionId) return;
    const pos = pastePosition();
    const newAsset: Asset = {
      id: crypto.randomUUID(),
      sessionId,
      type: "merge" as const,
      rawText: null,
      metadata: { loadingStatus: "idle" },
      canvasPosition: pos,
      createdAt: new Date().toISOString(),
    };
    await useSessionStore.getState().addAsset(newAsset);
  };

  const handleAddUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = urlInput.trim();
    if (!raw || urlLoading) return;
    const sessionId = getSessionId();
    if (!sessionId) return;

    setUrlLoading(true);
    setUrlInput("");
    setUrlInputOpen(false);

    const assetId = crypto.randomUUID();
    const pos = pastePosition();
    const placeholder: Asset = {
      id: assetId,
      sessionId,
      type: "url" as const,
      source: raw.startsWith("http") ? raw : `https://${raw}`,
      rawText: null,
      metadata: { loadingStatus: "fetching" },
      canvasPosition: pos,
      createdAt: new Date().toISOString(),
    };
    await useSessionStore.getState().addAsset(placeholder);

    try {
      const metaResult = await fetchUrlMetadataAction(raw);
      if (!metaResult.success) throw new Error(metaResult.error);
      const { title, description, imageUrl, domain, url } = metaResult.data;
      const readyAsset = {
        ...placeholder,
        source: url,
        metadata: { loadingStatus: "idle", urlMeta: { title, description, imageUrl, domain } },
      };
      await useSessionStore.getState().addAsset(readyAsset);
      await triggerAnalysis(readyAsset);
    } catch (err) {
      console.error("URL asset failed:", err);
      await useSessionStore.getState().addAsset({ ...placeholder, metadata: { loadingStatus: "error" } });
    } finally {
      setUrlLoading(false);
    }
  };

  const ingestImage = useCallback(async (file: File, pos: { x: number; y: number }) => {
    const sessionId = getSessionId();
    if (!sessionId) return;
    const newAsset: Asset = {
      id: crypto.randomUUID(),
      sessionId,
      type: "image" as const,
      rawText: null,
      metadata: { loadingStatus: "uploading" },
      canvasPosition: pos,
      createdAt: new Date().toISOString(),
    };
    await useSessionStore.getState().addAsset(newAsset);
    try {
      const imageUrl = await uploadAssetImage(sessionId, file);
      const readyAsset = { ...newAsset, contentRef: imageUrl, metadata: { loadingStatus: "idle" } };
      await useSessionStore.getState().addAsset(readyAsset);
      await triggerAnalysis(readyAsset);
    } catch (err) {
      console.error("Image upload failed:", err);
      await useSessionStore.getState().addAsset({ ...newAsset, metadata: { loadingStatus: "error" } });
    }
  }, [triggerAnalysis]);

  const ingestUrl = useCallback(async (raw: string, pos: { x: number; y: number }) => {
    const sessionId = getSessionId();
    if (!sessionId) return;
    const placeholder: Asset = {
      id: crypto.randomUUID(),
      sessionId,
      type: "url" as const,
      source: raw.startsWith("http") ? raw : `https://${raw}`,
      rawText: null,
      metadata: { loadingStatus: "fetching" },
      canvasPosition: pos,
      createdAt: new Date().toISOString(),
    };
    await useSessionStore.getState().addAsset(placeholder);
    try {
      const metaResult = await fetchUrlMetadataAction(raw);
      if (!metaResult.success) throw new Error(metaResult.error);
      const { title, description, imageUrl, domain, url } = metaResult.data;
      const readyAsset = {
        ...placeholder,
        source: url,
        metadata: { loadingStatus: "idle", urlMeta: { title, description, imageUrl, domain } },
      };
      await useSessionStore.getState().addAsset(readyAsset);
      await triggerAnalysis(readyAsset);
    } catch (err) {
      console.error("URL ingest failed:", err);
      await useSessionStore.getState().addAsset({ ...placeholder, metadata: { loadingStatus: "error" } });
    }
  }, [triggerAnalysis]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback(() => setIsDragging(false), []);

  const onDrop = useCallback(
    async (event: React.DragEvent) => {
      event.preventDefault();
      setIsDragging(false);
      const file = event.dataTransfer.files?.[0];
      if (!file?.type.startsWith("image/")) return;
      const pos = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      await ingestImage(file, pos);
    },
    [screenToFlowPosition, ingestImage]
  );

  useEffect(() => {
    const handlePaste = async (event: ClipboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      const cd = event.clipboardData;
      if (!cd) return;

      const imageItem = Array.from(cd.items).find((item) => item.type.startsWith("image/"));
      if (imageItem) {
        event.preventDefault();
        const file = imageItem.getAsFile();
        if (file) { await ingestImage(file, pastePosition()); return; }
      }

      const text = cd.getData("text/plain").trim();
      if (!text) return;
      event.preventDefault();
      const pos = pastePosition();
      const sessionId = getSessionId();
      if (!sessionId) return;

      if (/^https?:\/\//i.test(text) || /^www\./i.test(text)) {
        await ingestUrl(text, pos);
      } else {
        await useSessionStore.getState().addAsset({
          id: crypto.randomUUID(),
          sessionId,
          type: "text" as const,
          rawText: text,
          metadata: { loadingStatus: "idle" },
          canvasPosition: pos,
          createdAt: new Date().toISOString(),
        });
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [pastePosition, ingestImage, ingestUrl]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-[rgba(201,148,74,0.08)] border-2 border-dashed border-[rgba(201,148,74,0.50)] flex items-center justify-center pointer-events-none">
          <p className="text-sm tracking-[0.12em] uppercase text-sb-accent font-medium">Drop image to add</p>
        </div>
      )}

      {/* Workspace name / back link — top left */}
      <div className="absolute top-4 left-4 z-10">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-[10px] tracking-[0.14em] uppercase text-sb-text-muted hover:text-sb-text-secondary transition-colors"
        >
          <span>←</span>
          {session?.title && <span>{session.title}</span>}
        </Link>
      </div>

      {/* Toolbar — top right */}
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
              className="px-3 py-2 bg-sb-surface-1 border border-sb-border rounded text-sb-text-primary text-xs w-52 outline-none focus:border-[rgba(201,148,74,0.40)] placeholder-sb-text-muted transition-colors"
            />
            <button
              type="submit"
              disabled={urlLoading}
              className="px-3 py-2 bg-sb-surface-1 text-sb-text-primary border border-sb-border rounded hover:border-sb-border-hover transition-colors text-xs disabled:opacity-40"
            >
              {urlLoading ? "…" : "Add"}
            </button>
          </form>
        )}
        <button
          onClick={() => setUrlInputOpen((v) => !v)}
          className="px-3 py-2 bg-sb-surface-1 text-sb-text-muted border border-sb-border rounded hover:border-sb-border-hover hover:text-sb-text-primary transition-colors text-xs"
        >
          + URL
        </button>
        <button
          onClick={handleAddText}
          className="px-3 py-2 bg-sb-surface-1 text-sb-text-muted border border-sb-border rounded hover:border-sb-border-hover hover:text-sb-text-primary transition-colors text-xs"
        >
          + Text note
        </button>
        <button
          onClick={handleAddMergeNode}
          className="px-3 py-2 bg-sb-surface-1 text-sb-text-muted border border-sb-border rounded hover:border-sb-border-hover hover:text-sb-text-primary transition-colors text-xs"
        >
          + Merge
        </button>
        <ThemeToggle />
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        nodeTypes={nodeTypes}
        fitView
        style={{ background: "var(--sb-base)" }}
      >
        <Background variant={BackgroundVariant.Dots} gap={28} size={1} color="rgba(255,255,255,0.08)" />
        <Controls />
      </ReactFlow>
    </div>
  );
}

export default function Canvas() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  );
}
