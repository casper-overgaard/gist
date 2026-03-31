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

      const allSignals = assets
        .flatMap((a) => a.metadata?.analysis?.descriptiveSignals ?? []);

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

      if (!result.success || !result.data) throw new Error(result.error);
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
      <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-neutral-200 tracking-wide uppercase">
            Direction Brief
          </h2>
          {latestOutput && (
            <p className="text-xs text-neutral-500 mt-0.5">
              v{latestOutput.version} · {latestOutput.outputType}
            </p>
          )}
        </div>
        <div className="flex gap-2 items-center">
          {latestOutput && (
            <button
              onClick={handleExport}
              className="text-xs px-2 py-1 rounded border border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-500 transition-colors"
            >
              Export .md
            </button>
          )}
          <button
            onClick={handleGenerate}
            disabled={isGeneratingOutput || !canGenerate}
            className="text-xs px-2 py-1 rounded border border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isGeneratingOutput ? "..." : latestOutput ? "Re-generate" : "Generate"}
          </button>
        </div>
      </div>

      {session && (
        <div className="px-4 pt-3 flex gap-2">
          {(["UI/Product Style Direction", "Brand/Visual Direction Brief"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setOutputType(sessionId, type)}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                session.selectedOutputType === type
                  ? "bg-white text-black font-medium"
                  : "border border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-500"
              }`}
            >
              {type === "UI/Product Style Direction" ? "UI/Product" : "Brand/Visual"}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        {isGeneratingOutput && (
          <p className="text-xs text-neutral-500 animate-pulse">Generating brief...</p>
        )}

        {!isGeneratingOutput && !latestOutput && (
          <p className="text-xs text-neutral-600">
            {canGenerate
              ? "Signals synthesized. Generate a brief when ready."
              : "Synthesize signals in the Clarify panel first."}
          </p>
        )}

        {!isGeneratingOutput && latestOutput && (
          <OutputBody output={latestOutput} />
        )}
      </div>
    </div>
  );
}

function OutputBody({ output }: { output: { outputType: string; structuredPayload: Record<string, any>; confidenceNotes: string } }) {
  const p = output.structuredPayload;

  if (output.outputType === "UI/Product Style Direction") {
    return (
      <div className="space-y-5 text-sm">
        <Section title="Direction Summary" body={p.directionSummary} />
        <TagList title="Core Attributes" items={p.coreAttributes} />
        <TagList title="Visual Principles" items={p.visualPrinciples} />
        <Section title="Color Direction" body={p.colorDirection} />
        <Section title="Typography" body={p.typographyDirection} />
        <Section title="Layout & Composition" body={p.layoutCompositionDirection} />
        <Section title="Interaction & Motion" body={p.interactionMotionCues} />
        {p.isAndIsNot && (
          <div>
            <p className="text-xs text-neutral-500 uppercase tracking-widest mb-1">Is / Is Not</p>
            <p className="text-neutral-300 text-xs"><span className="text-neutral-500">Is: </span>{p.isAndIsNot.is?.join(", ")}</p>
            <p className="text-neutral-300 text-xs mt-0.5"><span className="text-neutral-500">Is not: </span>{p.isAndIsNot.isNot?.join(", ")}</p>
          </div>
        )}
        <TagList title="Guardrails" items={p.implementationGuardrails} />
        <TagList title="Next Steps" items={p.suggestedNextSteps} />
        {p.confidenceNotes && <ConfidenceNote note={p.confidenceNotes} />}
      </div>
    );
  }

  return (
    <div className="space-y-5 text-sm">
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
      <p className="text-xs text-neutral-500 uppercase tracking-widest mb-1">{title}</p>
      <p className="text-neutral-300 leading-relaxed">{body}</p>
    </div>
  );
}

function TagList({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <div>
      <p className="text-xs text-neutral-500 uppercase tracking-widest mb-1">{title}</p>
      <ul className="space-y-0.5">
        {items.map((item, i) => (
          <li key={i} className="text-neutral-300 text-xs before:content-['—'] before:mr-2 before:text-neutral-600">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ConfidenceNote({ note }: { note: string }) {
  return (
    <div className="border border-neutral-700 rounded p-3 bg-neutral-900">
      <p className="text-xs text-neutral-500 uppercase tracking-widest mb-1">Confidence Notes</p>
      <p className="text-neutral-400 text-xs leading-relaxed">{note}</p>
    </div>
  );
}
