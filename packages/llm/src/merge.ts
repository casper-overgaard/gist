import { generateObject } from "ai";
import { z } from "zod";
import { defaultModel } from "./openrouter";
import { MergeOutput } from "@signalboard/domain";

export interface ConnectedAsset {
  type: string;
  label: string; // domain/title/filename
  annotation?: string;
  perceptualSignals: string[];
  craftSignals: string[];
}

const MergeOutputZodSchema = z.object({
  elementName: z.string().describe("Name of the UI element being synthesized, e.g. 'Hero Section', 'Card Component', 'Navigation Bar'"),
  inferredIntent: z.string().describe("One-line description of what was merged and why — the design decision being made"),
  tokens: z.array(z.object({
    name: z.string().describe("Token name, e.g. 'accent', 'card-bg', 'heading-size'"),
    value: z.string().describe("Concrete value — hex, rgba, px, Tailwind class, e.g. '#C9944A', '13px', 'rounded-lg'"),
    use: z.string().describe("Where/how this token is used"),
  })).max(8),
  classPatterns: z.array(z.object({
    component: z.string().describe("Component name, e.g. 'Card', 'Button', 'Heading'"),
    classes: z.string().describe("Full Tailwind class string, e.g. 'bg-[#1a1a1a] border border-[rgba(255,255,255,0.08)] rounded-lg p-4'"),
  })).max(6),
  rules: z.array(z.string().describe("Imperative rule, e.g. 'Never use pure black — use #1a1a1a as base', 'Always pair the accent with a muted background'")).max(8),
});

const SYSTEM_PROMPT = `You are a design systems expert synthesizing a specific UI element spec from a set of reference materials.

Your job: given N reference assets and their user annotations, identify the specific UI element the user is trying to define, then produce a precise, machine-readable spec fragment for that element.

Output rules:
- elementName: be specific ("Hero Section" not "Hero", "Primary Button" not "Button")
- inferredIntent: one sentence — what is the user actually deciding here?
- tokens: only include tokens with clear signal backing — use actual hex/rgba/px values wherever possible
- classPatterns: full Tailwind class strings, not descriptions — these go directly into code
- rules: imperative, specific, grounded in the signals — no generic design advice

If annotations exist, they are the primary signal. Signals and perceptual cues are supporting evidence.
Do not invent values not supported by the references. If a value is uncertain, omit it rather than guess.`;

export async function generateMergeOutput(
  assets: ConnectedAsset[],
  sessionContext?: string
): Promise<MergeOutput> {
  const assetDescriptions = assets.map((a, i) => {
    const lines = [`Reference ${i + 1}: [${a.type}] ${a.label}`];
    if (a.annotation) lines.push(`  User annotation: "${a.annotation}"`);
    if (a.perceptualSignals.length > 0) lines.push(`  Perceptual signals: ${a.perceptualSignals.join("; ")}`);
    if (a.craftSignals.length > 0) lines.push(`  Craft signals: ${a.craftSignals.join("; ")}`);
    return lines.join("\n");
  }).join("\n\n");

  const userMessage = [
    sessionContext ? `Project context: ${sessionContext}` : null,
    `Connected references (${assets.length}):`,
    assetDescriptions,
    "\nSynthesize a spec fragment for the UI element these references are pointing toward.",
  ].filter(Boolean).join("\n");

  const result = await generateObject({
    model: defaultModel,
    mode: "json",
    schema: MergeOutputZodSchema,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  return result.object as MergeOutput;
}
