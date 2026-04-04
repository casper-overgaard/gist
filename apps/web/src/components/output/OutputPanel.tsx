"use client";

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
    setOutputType,
    writeOutput,
  } = useSessionStore();

  const latestOutput = outputs[0] ?? null;
  const canGenerate = !!synthesis;

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

      const allSignals = assets.flatMap((a) => a.metadata?.analysis?.descriptiveSignals ?? []);

      const result = await generateOutputAction({
        sessionId,
        outputType: session.selectedOutputType,
        synthesis: {
          aggregateSignals: synthesis.aggregateSignals,
          conflictingSignals: synthesis.conflictingSignals,
        },
        answeredPairs,
        allSignals,
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

  const handleExport = () => {
    if (!latestOutput) return;
    const blob = new Blob([latestOutput.markdownBody], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${session?.title ?? "direction"}-brief.md`;
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
              v{latestOutput.version} · {latestOutput.outputType}
            </p>
          )}
        </div>
        <div className="flex gap-1.5 items-center">
          {latestOutput && (
            <button
              onClick={handleExport}
              className="text-[10px] tracking-[0.06em] uppercase px-2.5 py-1.5 rounded border border-sb-border text-sb-text-muted hover:text-sb-text-primary hover:border-sb-border-hover transition-colors"
            >
              Export .md
            </button>
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

      {session && (
        <div className="px-4 pt-3 pb-2 flex gap-1.5">
          {(["UI/Product Style Direction", "Brand/Visual Direction Brief"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setOutputType(sessionId, type)}
              className={`text-[10px] tracking-[0.06em] uppercase px-2.5 py-1.5 rounded transition-colors ${
                session.selectedOutputType === type
                  ? "bg-[rgba(201,148,74,0.14)] text-sb-accent border border-[rgba(201,148,74,0.30)]"
                  : "border border-sb-border-subtle text-sb-text-muted hover:text-sb-text-primary hover:border-sb-border-hover"
              }`}
            >
              {type === "UI/Product Style Direction" ? "UI / Product" : "Brand / Visual"}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {isGeneratingOutput && (
          <p className="text-[10px] tracking-[0.10em] uppercase text-sb-text-muted animate-pulse pt-3">
            Generating brief…
          </p>
        )}

        {!isGeneratingOutput && !latestOutput && (
          <p className="text-xs text-sb-text-muted pt-3 leading-relaxed">
            {canGenerate
              ? "Signals synthesized. Generate a brief when ready."
              : "Synthesize signals in the Clarify panel first."}
          </p>
        )}

        {!isGeneratingOutput && latestOutput && (
          <div className="pt-3">
            <OutputBody output={latestOutput} />
          </div>
        )}
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function OutputBody({ output }: { output: { outputType: string; structuredPayload: Record<string, any>; confidenceNotes: string } }) {
  const p = output.structuredPayload;

  if (output.outputType === "UI/Product Style Direction") {
    return (
      <div className="space-y-5">
        <Section title="Direction Summary" body={p.directionSummary} />
        <TagList title="Core Attributes" items={p.coreAttributes} />
        <TagList title="Visual Principles" items={p.visualPrinciples} />
        <Section title="Color Direction" body={p.colorDirection} />
        <Section title="Typography" body={p.typographyDirection} />
        <Section title="Layout & Composition" body={p.layoutCompositionDirection} />
        <Section title="Interaction & Motion" body={p.interactionMotionCues} />
        {p.isAndIsNot && (
          <div>
            <p className="text-[9px] tracking-[0.15em] uppercase text-sb-accent opacity-60 mb-2">Is / Is Not</p>
            <p className="text-sb-text-secondary text-xs leading-relaxed">
              <span className="text-sb-text-muted">Is — </span>{p.isAndIsNot.is?.join(", ")}
            </p>
            <p className="text-sb-text-secondary text-xs leading-relaxed mt-1">
              <span className="text-sb-text-muted">Is not — </span>{p.isAndIsNot.isNot?.join(", ")}
            </p>
          </div>
        )}
        <TagList title="Guardrails" items={p.implementationGuardrails} />
        <TagList title="Next Steps" items={p.suggestedNextSteps} />
        {p.confidenceNotes && <ConfidenceNote note={p.confidenceNotes} />}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Section title="Direction Summary" body={p.directionSummary} />
      <TagList title="Brand Personality" items={p.brandPersonality} />
      <Section title="Visual Territory" body={p.visualTerritory} />
      <Section title="Color Direction" body={p.colorDirection} />
      <Section title="Typography" body={p.typographyDirection} />
      <Section title="Composition & Art Direction" body={p.compositionArtDirection} />
      <TagList title="Tone Descriptors" items={p.toneDescriptors} />
      <TagList title="What to Avoid" items={p.whatToAvoid} />
      <Section title="Reference Rationale" body={p.referenceRationale} />
      <TagList title="Next Steps" items={p.suggestedNextSteps} />
      {p.confidenceNotes && <ConfidenceNote note={p.confidenceNotes} />}
    </div>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <p className="text-[9px] tracking-[0.15em] uppercase text-sb-accent opacity-60 mb-1.5">{title}</p>
      <p className="text-sb-text-secondary text-xs leading-relaxed">{body}</p>
    </div>
  );
}

function TagList({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <div>
      <p className="text-[9px] tracking-[0.15em] uppercase text-sb-accent opacity-60 mb-1.5">{title}</p>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-sb-text-secondary text-xs flex gap-2">
            <span className="text-sb-text-muted shrink-0 mt-px">—</span>
            <span className="leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ConfidenceNote({ note }: { note: string }) {
  return (
    <div className="border border-[rgba(201,148,74,0.20)] rounded p-3 bg-[rgba(201,148,74,0.05)]">
      <p className="text-[9px] tracking-[0.15em] uppercase text-sb-accent opacity-60 mb-1.5">
        Confidence Notes
      </p>
      <p className="text-sb-text-secondary text-xs leading-relaxed">{note}</p>
    </div>
  );
}
