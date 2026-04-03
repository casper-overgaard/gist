// Fixture: valid UI/Product Style Direction output
export const uiOutputValid = {
  directionSummary: "A precise, dark-mode-first interface system grounded in Swiss grid principles and Dieter Rams' restraint doctrine.",
  coreAttributes: ["Minimal", "Precise", "Typography-led", "Dark-mode-native"],
  visualPrinciples: [
    "Grid discipline over expressive layout",
    "Typography carries visual hierarchy — no decorative icons",
    "Contrast achieved through weight and spacing, not color",
  ],
  colorDirection: "Near-black backgrounds (#0A0A0A) with neutral-200 body text. Single accent only when functional.",
  typographyDirection: "Geometric sans-serif (Inter or Helvetica Neue). Strict scale. No more than 3 type sizes per screen.",
  layoutCompositionDirection: "12-column grid. Generous margins. Content never bleeds. Whitespace is structural.",
  interactionMotionCues: "No decorative animation. State transitions under 150ms. Focus indicators visible.",
  isAndIsNot: {
    is: ["Precise", "Restrained", "Functional", "Confident"],
    isNot: ["Playful", "Colorful", "Decorative", "Expressive"],
  },
  implementationGuardrails: [
    "Never use more than one accent color per view",
    "Typography scale must follow an 8pt baseline grid",
    "Avoid gradients except for elevation shadows",
  ],
  suggestedNextSteps: [
    "Define the typographic scale document",
    "Create a dark-mode color token set",
    "Build a grid template for primary layouts",
  ],
  confidenceNotes: "High confidence. Signals are internally consistent with no conflicting directions.",
};

// Fixture: valid Brand/Visual Direction Brief output
export const brandOutputValid = {
  directionSummary: "A restrained, editorial identity with precision as its core value. Communicates authority without loudness.",
  brandPersonality: ["Precise", "Considered", "Authoritative", "Quiet confidence"],
  visualTerritory: "Swiss editorial meets modern digital product. Think Kinfolk meets Linear.",
  colorDirection: "Monochromatic near-black and off-white palette. No brand color unless absolutely necessary.",
  typographyDirection: "Single typeface family (geometric sans). Weight variation drives personality, not multiple faces.",
  compositionArtDirection: "Tight grid. Photography if used must be desaturated or black-and-white. Generous white space.",
  toneDescriptors: ["Precise", "Understated", "Direct", "Non-hype"],
  whatToAvoid: ["Gradient brand marks", "Playful illustration", "Overcrowded layouts", "Generic stock photography"],
  referenceRationale: "Dieter Rams principles inform the restraint philosophy. Swiss typography school provides grid and typographic rigor.",
  suggestedNextSteps: [
    "Commission a wordmark in a geometric sans",
    "Define brand photography direction",
    "Create a motion language guide",
  ],
  confidenceNotes: "High confidence. Input signals strongly aligned.",
};
