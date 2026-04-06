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
  const { assets, edges: storedEdges, updateAssetPosition, addEdge: storeAddEdge, removeEdge: storeRemoveEdge, session, setSelectedAssetId, isLoading } = useSessionStore();
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
      setNodes((prev) => {
        const next = applyNodeChanges(changes, prev);
        const selected = next.find((n) => n.selected);
        setSelectedAssetId(selected?.id ?? null);
        return next;
      });
    },
    [updateAssetPosition, setSelectedAssetId]
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

      {/* Empty canvas ghost state */}
      {!isLoading && assets.length === 0 && !isDragging && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none select-none gap-3">
          <p className="text-[11px] text-sb-text-muted opacity-40 tracking-[0.08em]">
            Drop an image · Paste a URL · Add a note
          </p>
          <p className="text-[9px] text-sb-text-muted opacity-25 tracking-[0.14em] uppercase">
            Collect references to synthesize a design spec
          </p>
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

      {/* Toolbar — bottom center dock */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-1 items-center bg-sb-surface-1 border border-sb-border rounded-full px-2 py-1.5 shadow-sm">
        <button
          onClick={() => setUrlInputOpen((v) => !v)}
          aria-label="Add URL"
          title="Add URL"
          className={`w-8 h-8 flex items-center justify-center rounded-full text-sb-text-muted hover:text-sb-text-primary hover:bg-[rgba(201,148,74,0.08)] transition-colors ${urlInputOpen ? "text-sb-accent bg-[rgba(201,148,74,0.08)]" : ""}`}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M5.5 8.5L8.5 5.5M6 3.5L6.47 3.03A3.18 3.18 0 0 1 11 7.53L10.5 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            <path d="M8 10.5L7.53 10.97A3.18 3.18 0 0 1 3 6.47L3.5 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </button>
        <button
          onClick={handleAddText}
          aria-label="Add text note"
          title="Add text note"
          className="w-8 h-8 flex items-center justify-center rounded-full text-sb-text-muted hover:text-sb-text-primary hover:bg-[rgba(201,148,74,0.08)] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="2" y="2" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M4.5 5H9.5M4.5 7H8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </button>
        <div className="w-px h-4 bg-sb-border mx-0.5" />
        <button
          onClick={handleAddMergeNode}
          aria-label="Add merge node"
          title="Add merge node"
          className="w-8 h-8 flex items-center justify-center rounded-full text-sb-text-muted hover:text-sb-accent hover:bg-[rgba(201,148,74,0.08)] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="3" cy="4" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
            <circle cx="3" cy="10" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
            <circle cx="11" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M4.5 4.5L9.5 6.5M4.5 9.5L9.5 7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </button>
        <div className="w-px h-4 bg-sb-border mx-0.5" />
        <ThemeToggle />
      </div>

      {/* URL input popover */}
      {urlInputOpen && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20">
          <form onSubmit={handleAddUrl} className="flex gap-1 bg-sb-surface-1 border border-sb-border rounded-lg p-1.5 shadow-sm">
            <input
              autoFocus
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && setUrlInputOpen(false)}
              placeholder="https://..."
              className="px-3 py-1.5 bg-transparent text-sb-text-primary text-xs w-52 outline-none placeholder-sb-text-muted"
            />
            <button
              type="submit"
              disabled={urlLoading}
              className="px-3 py-1.5 bg-sb-accent text-sb-base rounded text-xs font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              {urlLoading ? "…" : "Add"}
            </button>
          </form>
        </div>
      )}

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
