# Development

Use Node 22. Run npm install, npm test, npm run dev, npm run build. Direct dependency versions are pinned; commit a generated package-lock.json once npm is available and switch CI to npm ci. The CI workflow tests and builds every PR. To deploy, select GitHub Actions as the Pages source in repository Settings > Pages; merging to main then triggers deployment. The connector does not configure that setting. PR1 is a static preview, not a playable game. Browser-level visual QA remains for PR2.
