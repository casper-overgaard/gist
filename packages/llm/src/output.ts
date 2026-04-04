import { generateObject } from "ai";
import { z } from "zod";
import { defaultModel } from "./openrouter";
import { OutputDocument } from "@signalboard/domain";

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
The output will be used directly by an AI coding assistant (Claude Code, Codex, Cursor) as a design system reference.
Both outputs must be grounded entirely in the specific signals provided — no generic design advice, no filler.

You will produce two things:

1. humanBrief — a structured summary of the design direction for human review:
   - directionStatement: 2–3 sentences capturing the core aesthetic direction
   - keyDecisions: 4–6 specific design decisions, each with a rationale tied to the signals
   - isAndIsNot: 3–5 items each — what this direction IS, and what it explicitly IS NOT
   - confidenceNotes: honest note about any unresolved tensions or low-confidence decisions

2. systemSpec — a complete markdown design.md file the developer can drop into a project.
   Structure it exactly like this:

# Design System

## Intent
[2–3 sentences: the user's project goal and how the signals inform the direction]

## Design Tokens
\`\`\`css
:root {
  /* Derive actual hex/rgba values from the color signals — do not use placeholders */
  --color-base: #[value];
  --color-surface: #[value];
  --color-surface-raised: #[value];
  --color-border: rgba([r],[g],[b],0.08);
  --color-border-hover: rgba([r],[g],[b],0.14);
  --color-text-primary: #[value];
  --color-text-secondary: #[value];
  --color-text-muted: #[value];
  --color-accent: #[value];
}
\`\`\`

## Color Palette
| Token | Value | Use |
|---|---|---|
[3–6 rows: token name, actual value, usage description derived from signals]

## Typography
| Role | Classes | Notes |
|---|---|---|
[4–6 rows: role (heading/body/label/caption), Tailwind class string, note on why this fits the signals]

## Spacing
Base unit: [value]px — [justify based on signals]
[3–4 lines covering component padding, section gaps, micro-spacing]

## Component Patterns
### Buttons
[Primary and secondary button Tailwind class patterns]

### Cards
[Card surface, border, padding Tailwind class pattern]

### Inputs
[Input field Tailwind class pattern]

## Guardrails
[5–8 specific rules: "Never [X]", "Always [Y]" — tied to the signals]

Be precise. Derive actual values. If a signal mentions "amber", use an actual amber hex.
If a signal mentions "borderless ghost buttons", describe the exact class pattern.
Every section should feel earned by the input signals.`;

function buildUserMessage(
  synthesis: { aggregateSignals: string[]; conflictingSignals: string[] },
  answeredPairs: AnsweredPair[],
  allSignals: string[],
  pinnedSignals: string[],
  userIntent: string
): string {
  const lines: string[] = [];

  if (userIntent.trim()) {
    lines.push(`Project intent: ${userIntent}`);
    lines.push("");
  }

  lines.push(`Aggregate signals: ${synthesis.aggregateSignals.join(", ")}`);

  if (synthesis.conflictingSignals.length > 0) {
    lines.push(`Conflicting signals: ${synthesis.conflictingSignals.join(", ")}`);
  }

  if (pinnedSignals.length > 0) {
    lines.push(`\nUser-pinned signals (highest weight — the user specifically called these out):\n${pinnedSignals.map((s) => `- ${s}`).join("\n")}`);
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
  userIntent: string,
  version: number
): Promise<OutputDocument> {
  const userContent = buildUserMessage(synthesis, answeredPairs, allSignals, pinnedSignals, userIntent);

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
