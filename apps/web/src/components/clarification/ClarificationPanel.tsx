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
      const analyses: AssetAnalysis[] = assets
        .filter((a) => a.metadata?.analysis)
        .map((a): AssetAnalysis => ({
          id: crypto.randomUUID(),
          assetId: a.id,
          createdAt: new Date().toISOString(),
          modelVersion: a.metadata?.analysis?.modelVersion || "google/gemini-2.5-flash",
          tags: a.metadata?.analysis?.tags || [],
          perceptualSignals: a.metadata?.analysis?.perceptualSignals || [],
          craftSignals: a.metadata?.analysis?.craftSignals || [],
          confidence: a.metadata?.analysis?.confidence || 0.5,
        }));

      const pinnedSignals = assets.flatMap((a) => a.metadata?.pinnedSignals ?? []);

      const assetAnnotations = assets
        .filter((a) => a.metadata?.annotation?.trim())
        .map((a) => ({
          assetType: a.type,
          label: (a.metadata?.urlMeta as { title?: string; domain?: string } | undefined)?.title
            || (a.metadata?.urlMeta as { title?: string; domain?: string } | undefined)?.domain
            || a.source
            || a.type,
          annotation: (a.metadata?.annotation ?? "") as string,
        }));

      const result = await synthesizeSessionAction(sessionId, analyses, pinnedSignals, assetAnnotations);
      if (!result.success || !result.data) throw new Error(result.error);

      const synthesis = result.data;
      await writeSynthesis(sessionId, synthesis);

      if (synthesis.ambiguityScore > 0.3 && synthesis.recommendedQuestions.length > 0) {
        const clarResult = await planClarificationQuestionsAction(
          sessionId,
          synthesis.recommendedQuestions,
          synthesis.aggregateSignals,
          synthesis.conflictingSignals,
          pinnedSignals
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
        <div className="px-4 py-3.5 border-b border-sb-border-subtle">
          <p className="text-[10px] tracking-[0.15em] uppercase font-medium text-sb-accent opacity-70">
            Clarify Direction
          </p>
          <p className="text-xs text-sb-text-muted mt-1 leading-relaxed">
            {hasAnalyzedAssets
              ? "Signals ready. Run synthesis to generate targeted questions."
              : "Add and analyze assets on the canvas first."}
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <button
            onClick={handleSynthesize}
            disabled={isSynthesizing || !hasAnalyzedAssets}
            className="px-4 py-2.5 bg-sb-accent text-sb-base text-xs font-medium rounded hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {isSynthesizing ? "Synthesizing…" : "Synthesize signals"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3.5 border-b border-sb-border-subtle flex items-center justify-between">
        <div>
          <p className="text-[10px] tracking-[0.15em] uppercase font-medium text-sb-accent opacity-70">
            Clarify Direction
          </p>
          <p className="text-[11px] text-sb-text-muted mt-0.5">
            {pendingQuestions.length} remaining · {answeredQuestions.length} answered
          </p>
        </div>
        <button
          onClick={handleSynthesize}
          disabled={isSynthesizing}
          className="text-[10px] tracking-[0.08em] uppercase px-2.5 py-1.5 rounded border border-sb-border text-sb-text-muted hover:text-sb-text-primary hover:border-sb-border-hover transition-colors disabled:opacity-30"
        >
          {isSynthesizing ? "…" : "Re-run"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {pendingQuestions.map((q) => (
          <QuestionCard key={q.id} question={q} sessionId={sessionId} />
        ))}
        {answeredQuestions.length > 0 && (
          <>
            <p className="text-[9px] tracking-[0.16em] uppercase text-sb-text-muted pt-3 pb-1 px-1">
              Answered
            </p>
            {answeredQuestions.map((q) => (
              <QuestionCard key={q.id} question={q} sessionId={sessionId} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
