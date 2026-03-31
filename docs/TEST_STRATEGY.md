# TEST_STRATEGY.md

## Test layers
- Unit tests for pure logic, ranking, scoring, schemas, transforms
- Integration tests for service orchestration and persistence
- Contract tests for API and LLM JSON schemas
- LLM harness regression tests using stable fixtures
- Playwright E2E for core user journeys
- Performance/smoke tests for key flows

## Critical flows
- Create session
- Add image/text/URL asset
- Persist/reload session
- Analyse input
- Generate clarification questions
- Submit answers
- Generate output
- Regenerate output
- Export markdown

## Edge cases
- empty input
- conflicting input
- malformed provider JSON
- failed provider request
- unsupported file upload
- large input sets
- repeated regenerate
- partial pipeline failure

