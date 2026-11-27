# PR37 — Level selection and difficulty audit

Each of the six worlds has the same ordered structure: Introduction (levels 1–3, one cannon), Development (4–6, two cannons), Challenge (7–9, three cannons), Mastery (10–12, four cannons). Colours identify the tier, not whether a puzzle is complete or locked. All 72 puzzles remain available in all three learning modes. The level detail panel appears as before when a number is selected; it now also labels the tier. Completion marks and best records are specific to the selected mode. Stable puzzle IDs are unchanged in PR37.

## Verification

Run `npm run audit:progression` to produce a Markdown report for all 72 puzzles. CI publishes it as the `difficulty-audit` artifact. Its rows include the actual level ID and order, graph-family sequence, number of distinct reference equations, fractional polynomial coefficients, leftward legs and direction changes, interior critical points, terrain count, grid spans, route length, continuous minimum clearance beyond the Pip radius, reachable gems and advisory flags. The audit verifies the complete reference route, gem collection, every target's support, waiting crew staging, exact coordinate notes in all modes and next-level navigation. A runtime catalogue guard prevents accidental drift from the 3–3–3–3 structure. Reference answers and report generation are test-only.

The existing independent regressions cover all 216 level/mode combinations and direct forward shortcut prevention. PR37 changes no authored geometry, equations, scoring, or progress format. These quantitative metrics are aids to reviewing progression, not a weighted or empirical difficulty ranking. In particular, a wider grid, more obstacles or more critical points does not automatically mean a harder puzzle. Tight-clearance and large-graph flags are prompts for manual review; not all flagged levels need changes.

## Classroom follow-up

Use the browser report screenshots to review all six tier menus at desktop and phone sizes, plus the five existing classroom viewport scenarios. Check that selected tiles, count labels, progress marks and Play remain readable at actual classroom resolutions. Observe students solving each band's first, middle and final puzzle in Pilot mode. Record time to first valid plan, failure reasons and attempts, especially at 3→4, 6→7 and 9→10 transitions. Review large/zoomed and tight-clearance levels and adjust geometry only in a separate PR with fresh regression checks.

The planned progression revision (PR34–37) is complete when the checks pass and the tier menu has been reviewed. Optional bonus versions of the former five-/seven-cannon finales and empirical classroom difficulty calibration are separate potential follow-ups.
