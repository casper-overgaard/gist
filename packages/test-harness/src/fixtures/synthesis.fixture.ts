// Stable fixture representing a clear minimal design direction (single asset, low ambiguity)
export const synthesisClearMinimal = {
  aggregateSignals: ["minimalism", "swiss design", "dark mode", "precision", "typography", "less is more"],
  conflictingSignals: [],
  ambiguityScore: 0.1,
  recommendedQuestions: [],
};

// Fixture representing mixed expressive/minimal conflict (high ambiguity)
export const synthesisAmbiguousConflict = {
  aggregateSignals: ["bold color", "editorial layout", "minimalism", "sans-serif"],
  conflictingSignals: ["bold expressive color vs restrained minimal palette", "editorial density vs whitespace"],
  ambiguityScore: 0.75,
  recommendedQuestions: [
    "Is the dominant mood expressive or restrained?",
    "Should the layout prioritise density or breathing room?",
    "Is the palette accent-driven or monochromatic?",
  ],
};

// Sparse / low-signal fixture
export const synthesisLowSignal = {
  aggregateSignals: ["modern", "clean"],
  conflictingSignals: [],
  ambiguityScore: 0.9,
  recommendedQuestions: [
    "What industry or context is this for?",
    "Are there any stylistic references you are drawn to?",
  ],
};
