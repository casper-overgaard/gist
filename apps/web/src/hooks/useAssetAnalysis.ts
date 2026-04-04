"use client";

import { useSessionStore } from "@/store/useSessionStore";
import { analyzeAssetAction } from "@/actions/analyze";
import { Asset } from "@signalboard/domain";

export function useAssetAnalysis() {
  const addAsset = useSessionStore((state) => state.addAsset);

  const triggerAnalysis = async (asset: Asset) => {
    const metadata = asset.metadata || {};

    await addAsset({ ...asset, metadata: { ...metadata, loadingStatus: "analyzing" } });

    let payload: { imageUrl?: string; text?: string } | null = null;

    if (asset.type === "image" && asset.contentRef) {
      payload = { imageUrl: asset.contentRef };
    } else if (asset.type === "url") {
      const urlMeta = metadata.urlMeta as { title?: string; description?: string } | undefined;
      const text = [urlMeta?.title, urlMeta?.description].filter(Boolean).join(". ");
      if (text) payload = { text };
    } else if (asset.type === "text" && asset.rawText) {
      payload = { text: asset.rawText };
    }

    if (!payload) {
      await addAsset({ ...asset, metadata: { ...metadata, loadingStatus: "idle" } });
      return;
    }

    const result = await analyzeAssetAction(payload);

    await addAsset({
      ...asset,
      metadata: {
        ...metadata,
        loadingStatus: "done",
        analysis: result.success && "data" in result ? result.data : null,
      },
    });
  };

  return { triggerAnalysis };
}
