import { generateObject } from "ai";
import { z } from "zod";
import { defaultModel } from "./openrouter";
import { OutputDocument, MergeOutput } from "@signalboard/domain";
import { AssetAnnotation } from "./synthesis";

const DesignSpecOutputSchema = z.object({
  humanBrief: z.object({
    directionStatement: z.string(),
    keyDecisions: z.array(z.object({
      decision: z.string(),
      rationale: z.string(),
    })).max(6),
    isAndIsNot: z.object({
      is: z.array(z.string()),
      isNot: z.array(z.string()),
    }),
    confidenceNotes: z.string().optional(),
  }),
  systemSpec: z.string(),
});

type AnsweredPair = { question: string; answer: string };

const SYSTEM_PROMPT = `You are a creative director producing a design specification for a software project.
The output will be consumed directly by an AI coding assistant (Claude Code, Codex, Cursor) as a project design spec.
Both outputs must be grounded entirely in the specific signals and annotations provided — no generic design advice, no filler.

IMPORTANT: Where user annotations exist, they override inferred signals. The user has told you exactly what interests them about each reference — honour that.

You will produce two things:

1. humanBrief — structured direction summary for human review:
   - directionStatement: 2–3 sentences capturing the core direction, informed by annotations
   - keyDecisions: 4–6 specific design decisions, each with rationale tied to signals or annotations
   - isAndIsNot: 3–5 items each
   - confidenceNotes: honest note about unresolved tensions or low-confidence decisions

2. systemSpec — a CLAUDE.md-compatible project spec file.
   This file will be dropped into a project root where Claude Code reads it as coding instructions.
   Format rules — these are strict:
   - Write as imperative instructions, NOT documentation prose
   - Every color decision: include the actual derived hex or rgba value as a Tailwind arbitrary class (e.g. \`bg-[#1A1816]\`, \`text-[#F0EBE3]\`)
   - Every spacing decision: include the actual Tailwind class or px value
   - Every component pattern: include the actual class string — not a description of it
   - Short rules over paragraphs
   - Derive actual hex values from the color signals — never use placeholder values like [value]

   Structure the systemSpec exactly like this (use these exact section headings):

# Design Spec
> [1-line project intent]

## Colors
- Base background: \`bg-[#hex]\` — [one-line rule]
- Primary text: \`text-[#hex]\`
- Secondary text: \`text-[#hex]\`
- Accent / interactive: \`bg-[#hex]\` / \`text-[#hex]\` — [rule for when to use]
- Border default: \`border-[rgba(r,g,b,0.08)]\`
- Border hover: \`border-[rgba(r,g,b,0.14)]\`
[add rows only where signals support them]

## Typography
- Body: \`text-[Npx] leading-[N]\` — [justification]
- Labels: \`text-[Npx] tracking-[Nem] uppercase font-medium\`
- Headings: \`text-[Npx] font-[weight] leading-[N]\`
[add rows only where signals support them]

## Spacing
Base unit: [N]px
- Component padding: \`p-3\` / \`p-4\`
- Section gaps: \`space-y-[N]\` or \`gap-[N]\`
[2–3 lines max]

## Component Patterns

### Buttons
Primary: \`[full Tailwind class string]\`
Ghost: \`[full Tailwind class string]\`

### Cards
\`[full Tailwind class string]\`

### Inputs
\`[full Tailwind class string]\`

## Rules
- Never [X] — [why]
- Always [Y] — [why]
[5–8 specific rules, each tied to a signal or annotation]`;

function buildUserMessage(
  synthesis: { aggregateSignals: string[]; conflictingSignals: string[] },
  answeredPairs: AnsweredPair[],
  allSignals: string[],
  pinnedSignals: string[],
  assetAnnotations: AssetAnnotation[],
  userIntent: string,
  mergeFragments: MergeOutput[]
): string {
  const lines: string[] = [];

  if (userIntent.trim()) {
    lines.push(`Project intent: ${userIntent}`);
    lines.push("");
  }

  if (assetAnnotations.length > 0) {
    lines.push("User annotations per reference (highest weight — honour these above all inferred signals):");
    assetAnnotations.forEach((a) => {
      lines.push(`- ${a.assetType} "${a.label}": ${a.annotation}`);
    });
    lines.push("");
  }

  if (mergeFragments.length > 0) {
    lines.push("Element spec fragments (user-confirmed via Merge nodes — incorporate these directly):");
    mergeFragments.forEach((f) => {
      lines.push(`\n### ${f.elementName}`);
      lines.push(`Intent: ${f.inferredIntent}`);
      if (f.tokens.length > 0) {
        lines.push("Tokens: " + f.tokens.map((t) => `${t.name}=${t.value} (${t.use})`).join(", "));
      }
      if (f.classPatterns.length > 0) {
        f.classPatterns.forEach((p) => lines.push(`${p.component}: \`${p.classes}\``));
      }
      if (f.rules.length > 0) {
        f.rules.forEach((r) => lines.push(`- ${r}`));
      }
    });
    lines.push("");
  }

  lines.push(`Aggregate signals: ${synthesis.aggregateSignals.join(", ")}`);

  if (synthesis.conflictingSignals.length > 0) {
    lines.push(`Conflicting signals: ${synthesis.conflictingSignals.join(", ")}`);
  }

  if (pinnedSignals.length > 0) {
    lines.push(`\nUser-pinned signals:\n${pinnedSignals.map((s) => `- ${s}`).join("\n")}`);
  }

  if (allSignals.length > 0) {
    lines.push(`\nAll asset signals:\n${allSignals.slice(0, 40).map((s) => `- ${s}`).join("\n")}`);
  }

  if (answeredPairs.length > 0) {
    lines.push("\nClarification answers:");
    answeredPairs.forEach(({ question, answer }) => {
      lines.push(`  Q: ${question}\n  A: ${answer}`);
    });
  }

  return lines.join("\n");
}

export async function generateOutput(
  sessionId: string,
  synthesis: {
    aggregateSignals: string[];
    conflictingSignals: string[];
  },
  answeredPairs: AnsweredPair[],
  allSignals: string[],
  pinnedSignals: string[],
  assetAnnotations: AssetAnnotation[],
  userIntent: string,
  version: number,
  mergeFragments: MergeOutput[] = []
): Promise<OutputDocument> {
  const userContent = buildUserMessage(
    synthesis,
    answeredPairs,
    allSignals,
    pinnedSignals,
    assetAnnotations,
    userIntent,
    mergeFragments
  );

  const result = await generateObject({
    model: defaultModel,
    schema: DesignSpecOutputSchema,
    messages: [
      { role: "system" as const, content: SYSTEM_PROMPT },
      { role: "user" as const, content: userContent },
    ],
    mode: "json",
  });

  const { humanBrief, systemSpec } = result.object;

  return {
    id: crypto.randomUUID(),
    sessionId,
    outputType: "Design Spec",
    version,
    structuredPayload: humanBrief as Record<string, unknown>,
    markdownBody: systemSpec,
    confidenceNotes: humanBrief.confidenceNotes ?? "",
    createdAt: new Date().toISOString(),
  };
}
