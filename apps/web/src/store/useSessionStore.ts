import { create } from "zustand";
import { Asset, Session } from "@signalboard/domain";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot
} from "firebase/firestore";

interface SessionState {
  session: Session | null;
  assets: Asset[];
  isLoading: boolean;
  error: string | null;

  initializeSession: (sessionId: string) => () => void;
  createSession: (title: string) => Promise<string>;
  addAsset: (asset: Asset) => Promise<void>;
  updateAssetText: (assetId: string, text: string) => Promise<void>;
  updateAssetPosition: (assetId: string, x: number, y: number, saveToDb?: boolean) => Promise<void>;
  removeAsset: (assetId: string) => Promise<void>;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  session: null,
  assets: [],
  isLoading: true,
  error: null,

  initializeSession: (sessionId: string) => {
    set({ isLoading: true, error: null });

    // 1. Subscribe to Session
    const sessionRef = doc(db, "sessions", sessionId);
    const unsubSession = onSnapshot(
      sessionRef,
      (snapshot) => {
        if (snapshot.exists()) {
          set({ session: snapshot.data() as Session, isLoading: false });
        } else {
          set({ error: "Session not found", isLoading: false });
        }
      },
      (error) => set({ error: error.message, isLoading: false })
    );

    // 2. Subscribe to Assets
    const assetsRef = collection(db, `sessions/${sessionId}/assets`);
    const unsubAssets = onSnapshot(
      assetsRef,
      (snapshot) => {
        const assets: Asset[] = [];
        snapshot.forEach((doc) => {
          assets.push(doc.data() as Asset);
        });
        set({ assets });
      },
      (error) => set({ error: error.message })
    );

    // Return combined unsubscription function
    return () => {
      unsubSession();
      unsubAssets();
    };
  },

  createSession: async (title: string) => {
    const newSessionId = crypto.randomUUID();
    const now = new Date().toISOString();
    const newSession: Session = {
      id: newSessionId,
      title,
      createdAt: now,
      updatedAt: now,
      status: "active",
      selectedOutputType: "UI/Product Style Direction",
      latestOutputId: null,
    };

    const sessionRef = doc(db, "sessions", newSessionId);
    await setDoc(sessionRef, newSession);
    return newSessionId;
  },

  addAsset: async (asset: Asset) => {
    const { session } = get();
    if (!session) throw new Error("No active session");

    const assetRef = doc(db, `sessions/${session.id}/assets`, asset.id);
    await setDoc(assetRef, asset);
  },

  updateAssetText: async (assetId: string, text: string) => {
    const { session, assets } = get();
    if (!session) return;

    // Optimistic UI update
    set({
      assets: assets.map((a) =>
        a.id === assetId ? { ...a, rawText: text } : a
      ),
    });

    const assetRef = doc(db, `sessions/${session.id}/assets`, assetId);
    await updateDoc(assetRef, { rawText: text });
  },

  updateAssetPosition: async (assetId: string, x: number, y: number, saveToDb: boolean = true) => {
    const { session, assets } = get();
    if (!session) return;

    // Optimistic UI update for immediate 60fps React Flow drags
    set({
      assets: assets.map((a) =>
        a.id === assetId ? { ...a, canvasPosition: { x, y } } : a
      ),
    });

    if (saveToDb) {
      const assetRef = doc(db, `sessions/${session.id}/assets`, assetId);
      await updateDoc(assetRef, { canvasPosition: { x, y } }).catch((err) => {
         console.error("Failed to persist node location", err);
      });
    }
  },

  removeAsset: async (assetId: string) => {
    const { session } = get();
    if (!session) return;

    const assetRef = doc(db, `sessions/${session.id}/assets`, assetId);
    await deleteDoc(assetRef);
  },
}));
