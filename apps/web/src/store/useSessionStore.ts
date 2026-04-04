import { create } from "zustand";
import {
  Asset,
  Session,
  SessionSynthesis,
  ClarificationQuestion,
  ClarificationAnswer,
  OutputDocument,
} from "@signalboard/domain";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";

interface SessionState {
  session: Session | null;
  assets: Asset[];
  synthesis: SessionSynthesis | null;
  questions: ClarificationQuestion[];
  answers: ClarificationAnswer[];
  outputs: OutputDocument[];
  isSynthesizing: boolean;
  isGeneratingOutput: boolean;
  isLoading: boolean;
  error: string | null;

  initializeSession: (sessionId: string) => () => void;
  createSession: (title: string) => Promise<string>;
  addAsset: (asset: Asset) => Promise<void>;
  updateAssetText: (assetId: string, text: string) => Promise<void>;
  updateAssetPosition: (assetId: string, x: number, y: number, saveToDb?: boolean) => Promise<void>;
  removeAsset: (assetId: string) => Promise<void>;
  setOutputType: (sessionId: string, outputType: Session["selectedOutputType"]) => Promise<void>;
  togglePinnedSignal: (assetId: string, signal: string) => Promise<void>;
  updateUserIntent: (sessionId: string, intent: string) => Promise<void>;
  writeSynthesis: (sessionId: string, synthesis: Omit<SessionSynthesis, "id" | "sessionId" | "createdAt">) => Promise<void>;
  writeQuestions: (sessionId: string, questions: ClarificationQuestion[]) => Promise<void>;
  answerQuestion: (sessionId: string, answer: ClarificationAnswer) => Promise<void>;
  writeOutput: (sessionId: string, output: OutputDocument) => Promise<void>;
  setIsSynthesizing: (v: boolean) => void;
  setIsGeneratingOutput: (v: boolean) => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  session: null,
  assets: [],
  synthesis: null,
  questions: [],
  answers: [],
  outputs: [],
  isSynthesizing: false,
  isGeneratingOutput: false,
  isLoading: true,
  error: null,

  initializeSession: (sessionId: string) => {
    set({ isLoading: true, error: null });

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

    const assetsRef = collection(db, `sessions/${sessionId}/assets`);
    const unsubAssets = onSnapshot(
      assetsRef,
      (snapshot) => {
        const assets: Asset[] = [];
        snapshot.forEach((doc) => assets.push(doc.data() as Asset));
        set({ assets });
      },
      (error) => set({ error: error.message })
    );

    const synthRef = doc(db, `sessions/${sessionId}/synthesis`, "latest");
    const unsubSynthesis = onSnapshot(
      synthRef,
      (snapshot) => {
        if (snapshot.exists()) {
          set({ synthesis: snapshot.data() as SessionSynthesis });
        }
      },
      (error) => console.error("Synthesis subscription error:", error)
    );

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

    const answersRef = collection(db, `sessions/${sessionId}/answers`);
    const unsubAnswers = onSnapshot(
      answersRef,
      (snapshot) => {
        const answers: ClarificationAnswer[] = [];
        snapshot.forEach((doc) => answers.push(doc.data() as ClarificationAnswer));
        set({ answers });
      },
      (error) => console.error("Answers subscription error:", error)
    );

    const outputsRef = collection(db, `sessions/${sessionId}/outputs`);
    const unsubOutputs = onSnapshot(
      outputsRef,
      (snapshot) => {
        const outputs: OutputDocument[] = [];
        snapshot.forEach((doc) => outputs.push(doc.data() as OutputDocument));
        set({ outputs: outputs.sort((a, b) => b.version - a.version) });
      },
      (error) => console.error("Outputs subscription error:", error)
    );

    return () => {
      unsubSession();
      unsubAssets();
      unsubSynthesis();
      unsubQuestions();
      unsubAnswers();
      unsubOutputs();
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
      selectedOutputType: "Design Spec",
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
    set({ assets: assets.map((a) => (a.id === assetId ? { ...a, rawText: text } : a)) });
    const assetRef = doc(db, `sessions/${session.id}/assets`, assetId);
    await updateDoc(assetRef, { rawText: text });
  },

  updateAssetPosition: async (assetId: string, x: number, y: number, saveToDb: boolean = true) => {
    const { session, assets } = get();
    if (!session) return;
    set({ assets: assets.map((a) => (a.id === assetId ? { ...a, canvasPosition: { x, y } } : a)) });
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

  setOutputType: async (sessionId: string, outputType: Session["selectedOutputType"]) => {
    const sessionRef = doc(db, "sessions", sessionId);
    await updateDoc(sessionRef, { selectedOutputType: outputType, updatedAt: new Date().toISOString() });
  },

  togglePinnedSignal: async (assetId: string, signal: string) => {
    const { session, assets } = get();
    if (!session) return;
    const asset = assets.find((a) => a.id === assetId);
    if (!asset) return;
    const current: string[] = asset.metadata?.pinnedSignals ?? [];
    const next = current.includes(signal)
      ? current.filter((s) => s !== signal)
      : [...current, signal];
    set({
      assets: assets.map((a) =>
        a.id === assetId ? { ...a, metadata: { ...a.metadata, pinnedSignals: next } } : a
      ),
    });
    const assetRef = doc(db, `sessions/${session.id}/assets`, assetId);
    await updateDoc(assetRef, { "metadata.pinnedSignals": next });
  },

  updateUserIntent: async (sessionId: string, intent: string) => {
    const sessionRef = doc(db, "sessions", sessionId);
    await updateDoc(sessionRef, { userIntent: intent, updatedAt: new Date().toISOString() });
    set((state) => ({
      session: state.session ? { ...state.session, userIntent: intent } : null,
    }));
  },

  writeSynthesis: async (sessionId: string, synthesis: Omit<SessionSynthesis, "id" | "sessionId" | "createdAt">) => {
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
    const qRef = doc(db, `sessions/${sessionId}/questions`, answer.questionId);
    await updateDoc(qRef, { status: "answered" });
    set((state) => ({
      questions: state.questions.map((q) =>
        q.id === answer.questionId ? { ...q, status: "answered" } : q
      ),
    }));
  },

  writeOutput: async (sessionId: string, output: OutputDocument) => {
    const outputRef = doc(db, `sessions/${sessionId}/outputs`, output.id);
    await setDoc(outputRef, output);
    const sessionRef = doc(db, "sessions", sessionId);
    await updateDoc(sessionRef, {
      latestOutputId: output.id,
      updatedAt: new Date().toISOString(),
    });
  },

  setIsSynthesizing: (v: boolean) => set({ isSynthesizing: v }),
  setIsGeneratingOutput: (v: boolean) => set({ isGeneratingOutput: v }),
}));
