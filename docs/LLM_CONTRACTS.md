# LLM_CONTRACTS.md

All LLM interactions must be contract-based.

For each LLM operation, document:
- contract name
- prompt version
- purpose
- model routing recommendation
- input schema
- output schema
- retry/repair policy
- fallback behavior
- fixture coverage
- known failure modes

Initial contracts required:
1. asset-analysis.v1
2. session-synthesis.v1
3. ambiguity-plan.v1
4. clarification-questions.v1
5. output-ui-direction.v1
6. output-brand-direction.v1

