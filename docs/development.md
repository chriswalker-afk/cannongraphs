# Development

Node 22. Run `npm install`, `npm test`, `npm run dev`, `npm run build`. Test-only reference equations are in tests/fixtures/referenceSolutions.ts and are not imported by the game. Direct dependencies are pinned; a generated lockfile and npm ci are a future reproducibility improvement.

Browser tests: run `npx playwright install chromium`, `npm run build`, `npm run test:browser`. The suite exercises the production preview server, captures screenshots for classroom viewports and retains traces on failures. GitHub Actions runs unit/build and browser checks separately; the browser report artifact contains screenshots and traces. Pages deploys from main using GitHub Actions as its source. See [classroom QA](classroom-qa.md) for the coverage and remaining real-device checks.
