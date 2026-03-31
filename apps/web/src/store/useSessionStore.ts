import { create } from "zustand";
import { Asset, Session, ClarificationQuestion, ClarificationAnswer } from "@signalboard/domain";
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
  questions: ClarificationQuestion[];
  isSynthesizing: boolean;
  isLoading: boolean;
  error: string | null;

  initializeSession: (sessionId: string) => () => void;
  createSession: (title: string) => Promise<string>;
  addAsset: (asset: Asset) => Promise<void>;
  updateAssetText: (assetId: string, text: string) => Promise<void>;
  updateAssetPosition: (assetId: string, x: number, y: number, saveToDb?: boolean) => Promise<void>;
  removeAsset: (assetId: string) => Promise<void>;
  writeSynthesis: (sessionId: string, synthesis: any) => Promise<void>;
  writeQuestions: (sessionId: string, questions: ClarificationQuestion[]) => Promise<void>;
  answerQuestion: (sessionId: string, answer: ClarificationAnswer) => Promise<void>;
  setIsSynthesizing: (v: boolean) => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  session: null,
  assets: [],
  questions: [],
  isSynthesizing: false,
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

    // 3. Subscribe to Clarification Questions
    const questionsRef = collection(db, `sessions/${sessionId}/questions`);
    const unsubQuestions = onSnapshot(
      questionsRef,
      (snapshot) => {
        const questions: ClarificationQuestion[] = [];
        snapshot.forEach((doc) => questions.push(doc.data() as ClarificationQuestion));
        set({ questions: questions.sort((a, b) => a.priority - b.priority) });
      },
      (error) => set({ error: error.message })
    );

    // Return combined unsubscription function
    return () => {
      unsubSession();
      unsubAssets();
      unsubQuestions();
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

  writeSynthesis: async (sessionId: string, synthesis: any) => {
    const synthRef = doc(db, `sessions/${sessionId}/synthesis`, "latest");
    await setDoc(synthRef, { ...synthesis, sessionId, createdAt: new Date().toISOString() });
  },

  writeQuestions: async (sessionId: string, questions: ClarificationQuestion[]) => {
    for (const q of questions) {
      const qRef = doc(db, `sessions/${sessionId}/questions`, q.id);
      await setDoc(qRef, q);
    }
  },

  answerQuestion: async (sessionId: string, answer: ClarificationAnswer) => {
    const answerRef = doc(db, `sessions/${sessionId}/answers`, answer.questionId);
    await setDoc(answerRef, answer);
    // Mark question as answered
    const qRef = doc(db, `sessions/${sessionId}/questions`, answer.questionId);
    await updateDoc(qRef, { status: "answered" });
    // Optimistic UI
    set((state) => ({
      questions: state.questions.map((q) =>
        q.id === answer.questionId ? { ...q, status: "answered" } : q
      )
    }));
  },

  setIsSynthesizing: (v: boolean) => set({ isSynthesizing: v }),
}));
