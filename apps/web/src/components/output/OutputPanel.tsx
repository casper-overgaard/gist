"use client";

import { useState, useRef, useEffect } from "react";
import { useSessionStore } from "@/store/useSessionStore";
import { generateOutputAction } from "@/actions/output";

interface OutputPanelProps {
  sessionId: string;
}

export default function OutputPanel({ sessionId }: OutputPanelProps) {
  const {
    session,
    synthesis,
    questions,
    answers,
    assets,
    outputs,
    isGeneratingOutput,
    setIsGeneratingOutput,
    updateUserIntent,
    writeOutput,
  } = useSessionStore();

  const [intentDraft, setIntentDraft] = useState(session?.userIntent ?? "");
  const [copied, setCopied] = useState(false);
  const intentSavedRef = useRef(session?.userIntent ?? "");

  // Sync intent from session once it loads
  useEffect(() => {
    if (session?.userIntent && intentDraft === "") {
      setIntentDraft(session.userIntent);
      intentSavedRef.current = session.userIntent;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.userIntent]);

  const latestOutput = outputs[0] ?? null;
  const canGenerate = !!synthesis;

  const handleIntentBlur = async () => {
    if (intentDraft !== intentSavedRef.current) {
      intentSavedRef.current = intentDraft;
      await updateUserIntent(sessionId, intentDraft);
    }
  };

  const handleGenerate = async () => {
    if (!session || !synthesis || isGeneratingOutput) return;
    setIsGeneratingOutput(true);

    try {
      const answeredPairs = questions
        .filter((q) => q.status === "answered")
        .map((q) => {
          const answer = answers.find((a) => a.questionId === q.id);
          const answerStr = Array.isArray(answer?.answerValue)
            ? answer.answerValue.join(", ")
            : answer?.answerValue ?? "";
          return { question: q.prompt, answer: answerStr };
        });

      const allSignals = assets.flatMap((a) => [
        ...(a.metadata?.analysis?.perceptualSignals ?? []),
        ...(a.metadata?.analysis?.craftSignals ?? []),
      ]);

      const pinnedSignals = assets.flatMap((a) => a.metadata?.pinnedSignals ?? []);

      const result = await generateOutputAction({
        sessionId,
        synthesis: {
          aggregateSignals: synthesis.aggregateSignals,
          conflictingSignals: synthesis.conflictingSignals,
        },
        answeredPairs,
        allSignals,
        pinnedSignals,
        userIntent: intentDraft,
        version: outputs.length + 1,
      });

      if (!result.success) throw new Error(result.error);
      if (!result.data) throw new Error("No data returned");
      await writeOutput(sessionId, result.data);
    } catch (err) {
      console.error("Output generation failed:", err);
    } finally {
      setIsGeneratingOutput(false);
    }
  };

  const handleCopySpec = () => {
    if (!latestOutput?.markdownBody) return;
    navigator.clipboard.writeText(latestOutput.markdownBody).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleExportSpec = () => {
    if (!latestOutput?.markdownBody) return;
    const blob = new Blob([latestOutput.markdownBody], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${session?.title ?? "direction"}-design.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3.5 border-b border-sb-border-subtle flex items-center justify-between">
        <div>
          <p className="text-[10px] tracking-[0.15em] uppercase font-medium text-sb-accent opacity-70">
            Direction Brief
          </p>
          {latestOutput && (
            <p className="text-[11px] text-sb-text-muted mt-0.5">
              v{latestOutput.version}
            </p>
          )}
        </div>
        <div className="flex gap-1.5 items-center">
          {latestOutput && (
            <>
              <button
                onClick={handleCopySpec}
                className="text-[10px] tracking-[0.06em] uppercase px-2.5 py-1.5 rounded border border-sb-border text-sb-text-muted hover:text-sb-text-primary hover:border-sb-border-hover transition-colors"
              >
                {copied ? "Copied" : "Copy spec"}
              </button>
              <button
                onClick={handleExportSpec}
                className="text-[10px] tracking-[0.06em] uppercase px-2.5 py-1.5 rounded border border-sb-border text-sb-text-muted hover:text-sb-text-primary hover:border-sb-border-hover transition-colors"
              >
                Export .md
              </button>
            </>
          )}
          <button
            onClick={handleGenerate}
            disabled={isGeneratingOutput || !canGenerate}
            className="text-[10px] tracking-[0.06em] uppercase px-2.5 py-1.5 rounded border border-sb-border text-sb-text-muted hover:text-sb-text-primary hover:border-sb-border-hover transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {isGeneratingOutput ? "…" : latestOutput ? "Re-generate" : "Generate"}
          </button>
        </div>
      </div>

      {/* Intent input */}
      <div className="px-4 pt-3 pb-2 border-b border-sb-border-subtle">
        <textarea
          value={intentDraft}
          onChange={(e) => setIntentDraft(e.target.value)}
          onBlur={handleIntentBlur}
          placeholder="What are you working on? (e.g. a portfolio site, a SaaS dashboard…)"
          rows={2}
          className="w-full bg-sb-base border border-sb-border rounded px-3 py-2 text-xs text-sb-text-primary outline-none focus:border-[rgba(201,148,74,0.40)] placeholder-sb-text-muted resize-none transition-colors"
        />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {isGeneratingOutput && (
          <p className="text-[10px] tracking-[0.10em] uppercase text-sb-text-muted animate-pulse pt-3">
            Generating brief…
          </p>
        )}

        {!isGeneratingOutput && !latestOutput && (
          <p className="text-xs text-sb-text-muted pt-3 leading-relaxed">
            {canGenerate
              ? "Signals synthesized. Describe your project above, then generate."
              : "Synthesize signals in the Clarify panel first."}
          </p>
        )}

        {!isGeneratingOutput && latestOutput && (
          <div className="pt-3">
            <HumanBrief payload={latestOutput.structuredPayload} />
          </div>
        )}
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function HumanBrief({ payload }: { payload: Record<string, any> }) {
  return (
    <div className="space-y-5">
      {payload.directionStatement && (
        <div>
          <p className="text-[9px] tracking-[0.15em] uppercase text-sb-accent opacity-60 mb-1.5">Direction</p>
          <p className="text-sb-text-secondary text-xs leading-relaxed">{payload.directionStatement}</p>
        </div>
      )}

      {payload.keyDecisions?.length > 0 && (
        <div>
          <p className="text-[9px] tracking-[0.15em] uppercase text-sb-accent opacity-60 mb-1.5">Key Decisions</p>
          <div className="space-y-2.5">
            {payload.keyDecisions.map((d: { decision: string; rationale: string }, i: number) => (
              <div key={i}>
                <p className="text-xs text-sb-text-primary leading-snug">{d.decision}</p>
                <p className="text-[11px] text-sb-text-muted mt-0.5 leading-relaxed">{d.rationale}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {payload.isAndIsNot && (
        <div>
          <p className="text-[9px] tracking-[0.15em] uppercase text-sb-accent opacity-60 mb-2">Is / Is Not</p>
          <p className="text-sb-text-secondary text-xs leading-relaxed">
            <span className="text-sb-text-muted">Is — </span>{payload.isAndIsNot.is?.join(", ")}
          </p>
          <p className="text-sb-text-secondary text-xs leading-relaxed mt-1">
            <span className="text-sb-text-muted">Is not — </span>{payload.isAndIsNot.isNot?.join(", ")}
          </p>
        </div>
      )}

      {payload.confidenceNotes && (
        <div className="border border-[rgba(201,148,74,0.20)] rounded p-3 bg-[rgba(201,148,74,0.05)]">
          <p className="text-[9px] tracking-[0.15em] uppercase text-sb-accent opacity-60 mb-1.5">
            Confidence Notes
          </p>
          <p className="text-sb-text-secondary text-xs leading-relaxed">{payload.confidenceNotes}</p>
        </div>
      )}
    </div>
  );
}
