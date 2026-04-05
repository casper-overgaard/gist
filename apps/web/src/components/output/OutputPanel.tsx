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
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedAllIncludes, setCopiedAllIncludes] = useState(false);
  const intentSavedRef = useRef(session?.userIntent ?? "");

  const specUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/spec/${sessionId}`
    : `/api/spec/${sessionId}`;

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

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const fragmentUrls = assets
    .filter((a) => a.type === "output" && (a.metadata?.mergeOutput as { elementSlug?: string } | undefined)?.elementSlug)
    .map((a) => {
      const mo = a.metadata!.mergeOutput as { elementName: string; elementSlug: string };
      return { elementName: mo.elementName, url: `${origin}/api/spec/${sessionId}/${mo.elementSlug}` };
    });

  const handleCopyAllIncludes = () => {
    if (fragmentUrls.length === 0) return;
    const text = fragmentUrls.map((f) => `@include ${f.url}`).join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopiedAllIncludes(true);
      setTimeout(() => setCopiedAllIncludes(false), 2000);
    });
  };

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

      const assetAnnotations = assets
        .filter((a) => a.metadata?.annotation?.trim())
        .map((a) => ({
          assetType: a.type as string,
          label: (a.metadata?.urlMeta as { title?: string; domain?: string } | undefined)?.title
            || (a.metadata?.urlMeta as { title?: string; domain?: string } | undefined)?.domain
            || a.source
            || a.type,
          annotation: (a.metadata?.annotation ?? "") as string,
        }));

      const result = await generateOutputAction({
        sessionId,
        synthesis: {
          aggregateSignals: synthesis.aggregateSignals,
          conflictingSignals: synthesis.conflictingSignals,
        },
        answeredPairs,
        allSignals,
        pinnedSignals,
        assetAnnotations,
        userIntent: intentDraft,
        version: outputs.length + 1,
        mergeFragments: session.mergeFragments ?? [],
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

  const handleCopyForClaudeCode = () => {
    if (!latestOutput?.markdownBody) return;
    navigator.clipboard.writeText(latestOutput.markdownBody).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleCopyForCursor = () => {
    if (!latestOutput?.markdownBody) return;
    const wrapped = `<rules>\n${latestOutput.markdownBody}\n</rules>`;
    navigator.clipboard.writeText(wrapped).then(() => {
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
    a.download = `CLAUDE.md`;
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
                onClick={handleCopyForClaudeCode}
                title="Copy as CLAUDE.md instructions for Claude Code"
                className="text-[10px] tracking-[0.06em] uppercase px-2.5 py-1.5 rounded border border-sb-border text-sb-text-muted hover:text-sb-text-primary hover:border-sb-border-hover transition-colors"
              >
                {copied ? "Copied" : "Claude Code"}
              </button>
              <button
                onClick={handleCopyForCursor}
                title="Copy wrapped in <rules> block for Cursor"
                className="text-[10px] tracking-[0.06em] uppercase px-2.5 py-1.5 rounded border border-sb-border text-sb-text-muted hover:text-sb-text-primary hover:border-sb-border-hover transition-colors"
              >
                Cursor
              </button>
              <button
                onClick={handleExportSpec}
                title="Export as CLAUDE.md"
                className="text-[10px] tracking-[0.06em] uppercase px-2.5 py-1.5 rounded border border-sb-border text-sb-text-muted hover:text-sb-text-primary hover:border-sb-border-hover transition-colors"
              >
                Export
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

      {/* Spec URL — live link for @include in CLAUDE.md */}
      {latestOutput && (
        <div className="px-4 py-2 border-b border-sb-border-subtle flex items-center gap-2">
          <code className="text-[9px] text-sb-text-muted font-mono truncate flex-1 opacity-60">
            {specUrl}
          </code>
          <button
            onClick={() => {
              navigator.clipboard.writeText(specUrl).then(() => {
                setCopiedUrl(true);
                setTimeout(() => setCopiedUrl(false), 2000);
              });
            }}
            className="text-[9px] tracking-[0.06em] uppercase shrink-0 px-2 py-1 rounded border border-sb-border text-sb-text-muted hover:text-sb-text-primary hover:border-sb-border-hover transition-colors"
          >
            {copiedUrl ? "Copied" : "Copy URL"}
          </button>
        </div>
      )}

      {/* Component spec URLs */}
      {fragmentUrls.length > 0 && (
        <div className="px-4 py-2.5 border-b border-sb-border-subtle">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[9px] tracking-[0.14em] uppercase text-sb-accent opacity-60 font-medium">
              Component Specs
            </p>
            <button
              onClick={handleCopyAllIncludes}
              className="text-[9px] tracking-[0.06em] uppercase px-2 py-1 rounded border border-sb-border text-sb-text-muted hover:text-sb-text-primary hover:border-sb-border-hover transition-colors"
            >
              {copiedAllIncludes ? "Copied" : "Copy all @includes"}
            </button>
          </div>
          <div className="space-y-1.5">
            {fragmentUrls.map((f) => (
              <div key={f.url} className="flex items-center gap-2">
                <code className="text-[9px] font-mono text-sb-text-muted truncate flex-1 opacity-60">
                  {f.url}
                </code>
                <span className="text-[9px] text-sb-text-muted shrink-0 opacity-40">{f.elementName}</span>
              </div>
            ))}
          </div>
        </div>
      )}

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
