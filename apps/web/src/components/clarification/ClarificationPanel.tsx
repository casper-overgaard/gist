"use client";

import { useSessionStore } from "@/store/useSessionStore";
import { synthesizeSessionAction } from "@/actions/synthesize";
import { planClarificationQuestionsAction } from "@/actions/clarification";
import QuestionCard from "./QuestionCard";
import { AssetAnalysis } from "@signalboard/domain";

interface ClarificationPanelProps {
  sessionId: string;
}

export default function ClarificationPanel({ sessionId }: ClarificationPanelProps) {
  const { assets, questions, isSynthesizing, setIsSynthesizing, writeSynthesis, writeQuestions } = useSessionStore();

  const pendingQuestions = questions.filter((q) => q.status === "pending");
  const answeredQuestions = questions.filter((q) => q.status === "answered");
  const hasAnalyzedAssets = assets.some((a) => a.metadata?.analysis);

  const handleSynthesize = async () => {
    if (isSynthesizing || !hasAnalyzedAssets) return;
    setIsSynthesizing(true);

    try {
      // Collect all asset analyses
      const analyses: AssetAnalysis[] = assets
        .filter((a) => a.metadata?.analysis)
        .map((a): AssetAnalysis => ({
          id: crypto.randomUUID(),
          assetId: a.id,
          createdAt: new Date().toISOString(),
          modelVersion: a.metadata?.analysis?.modelVersion || "google/gemini-2.5-flash",
          tags: a.metadata?.analysis?.tags || [],
          descriptiveSignals: a.metadata?.analysis?.descriptiveSignals || [],
          confidence: a.metadata?.analysis?.confidence || 0.5,
        }));

      // Run synthesis server action
      const result = await synthesizeSessionAction(sessionId, analyses);
      if (!result.success || !result.data) throw new Error(result.error);

      const synthesis = result.data;

      // Persist synthesis to Firestore
      await writeSynthesis(sessionId, synthesis);

      // Plan clarification questions if ambiguity is meaningful (> 0.3)
      if (synthesis.ambiguityScore > 0.3 && synthesis.recommendedQuestions.length > 0) {
        // NOTE: planClarificationQuestions calls OpenRouter — this runs client-side here.
        // In Wave 4 we will move this to a dedicated Server Action.
        // For now include the key directly in the action, not directly here.
        // We call the synthesize action which handles it server-side.
        const clarResult = await planClarificationQuestionsAction(
          sessionId,
          synthesis.recommendedQuestions,
          synthesis.aggregateSignals,
          synthesis.conflictingSignals
        );
        if (!clarResult.success || !clarResult.data) throw new Error(clarResult.error);
        await writeQuestions(sessionId, clarResult.data);
      }
    } catch (err) {
      console.error("Synthesis failed:", err);
    } finally {
      setIsSynthesizing(false);
    }
  };

  if (questions.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-neutral-800">
          <h2 className="text-sm font-semibold text-neutral-200 tracking-wide uppercase">Clarify Direction</h2>
          <p className="text-xs text-neutral-500 mt-1">
            {hasAnalyzedAssets
              ? "Add assets to the canvas, then synthesize to generate targeted questions."
              : "Add and analyze assets on the canvas first."}
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <button
            onClick={handleSynthesize}
            disabled={isSynthesizing || !hasAnalyzedAssets}
            className="px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSynthesizing ? "Synthesizing..." : "Synthesize Signals"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-neutral-200 tracking-wide uppercase">Clarify Direction</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            {pendingQuestions.length} remaining · {answeredQuestions.length} answered
          </p>
        </div>
        <button
          onClick={handleSynthesize}
          disabled={isSynthesizing}
          className="text-xs px-2 py-1 rounded border border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-500 transition-colors disabled:opacity-40"
        >
          {isSynthesizing ? "..." : "Re-run"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {pendingQuestions.map((q) => (
          <QuestionCard key={q.id} question={q} sessionId={sessionId} />
        ))}
        {answeredQuestions.length > 0 && (
          <>
            <p className="text-xs text-neutral-600 uppercase tracking-widest pt-2">Answered</p>
            {answeredQuestions.map((q) => (
              <QuestionCard key={q.id} question={q} sessionId={sessionId} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

