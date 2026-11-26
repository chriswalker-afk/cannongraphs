# PR12 — World 1: Meadow Launchers

The five experimental previews are replaced in the live selector by twelve authored levels, ordered by mathematics rather than mechanical difficulty alone. The former preview modules remain regression fixtures, not duplicate playable levels. All twelve are selectable from the start, with five Pips each. The compact selector displays the level number/title, and the header shows its objective. A successful terminal panel offers Next level; the final level shows World complete and retains replay. No persistent progress or locked levels yet (later PRs).

| Level | Focus | Cannons |
| --- | --- | --- |
| 1 First flight | Unit positive gradient through origin | 1 |
| 2 Double climb | Gradient 2 | 1 |
| 3 Skyward | Gradient 3 | 1 |
| 4 Lift off | Nonzero intercept | 1 |
| 5 High rise | Positive integer gradient and intercept | 1 |
| 6 Under the arch | Horizontal line | 1 |
| 7 Downhill dash | Negative gradient | 1 |
| 8 Below the origin | Negative intercept; limited negative y-axis exposure | 1 |
| 9 Two-point plunge | Two-point equation; steeper descent | 1 |
| 10 Meadow relay | Two independent equations | 2 |
| 11 Three-way trail | Mixed rising, falling and horizontal sections | 3 |
| 12 Meadow gauntlet | Four-cannon route, walls, ceiling and precise gate | 4 |

All reference gradients/intercepts and marked coordinates are integers. Terrain has progressively more constraints. Each authored solution is audited against actual swept-disk geometry, with positive clearance and exact destination order. Tests also try every straight-line shortcut between nonadjacent anchors in relay levels, including fractional slopes, and ensure it cannot reach the skipped destination. Reference equations remain in tests, never in the browser catalog. Level 8 shows a small negative y-axis range to make the negative intercept visible; negative launch/capture coordinates and fractional slopes remain for World 2.

Manual browser QA pending: play all twelve, confirm level objectives and selection, inspect 1–3 steep cannon art and 8 negative y-axis, check 10–12 transitions and rapid-fire, next/replay and completion on desktop and narrow/short screens. Browser-only star persistence is deliberately not included yet. World 2 can extend the catalog without replacing the game loop.

Next PR13: The Floating Isles — fractional gradients, negative marked coordinates and longer/more varied linear routes, with world-specific environment and curriculum data.
