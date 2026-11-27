# Roadmap

| PR | Scope |
|---|---|
| 1 | Foundations, schema, coordinate transform, static preview, CI and Pages workflow |
| 2 | Coordinate playground: polished responsive grid, terrain, hover/tap/focus tooltips, zoom |
| 3 | Linear cannon: safe parser, equation editor, line evaluation |
| 4 | First creature: character design, idle/loading/firing animation |
| 5 | Flight and collisions, exact destination detection and splat |
| 6 | Limited creatures, retries, state machine and completion |
| 7 | Rapid-fire celebration, scoring |
| 8 | Multi-cannon routing |
| 9 | All-cannon planning interface |
| 10 | Walls, ceilings and platforms |
| 11 | Mathematical feedback |
| 12 | World 1: twelve levels |
| 13 | World 2: fractional gradients and negative coordinates |
| 14 | Quadratic cannon |
| 15 | World 3 |
| 16 | World 4 |
| 17 | Collectibles |
| 18 | Advanced function framework |
| 19 | World 5 |
| 20 | World 6 |
| 21 | Animated home |
| 22 | World and level selection |
| 23 | Learning modes |
| 24 | Progress and achievements |
| 25 | Creature workshop |
| 26 | Cannon customisation |
| 27 | Sound |
| 28 | Classroom QA and accessibility |

Phases 1–3 complete: all seven cannon families and 72 levels across six worlds, with optional gems. Phase 4 begins with PR21 animated home screen. PR22 adds illustrated world and numbered level selection. PR23 adds Cadet, Pilot and Ace learning modes. PR24 adds local mode-specific progress, Flight log and achievements. PR25 adds achievement-gated Pip cosmetics and the Creature Workshop. PR26 adds achievement-gated cannon styles and firing effects. PR27 adds optional original sound and world music. PR28 adds classroom layout, keyboard and browser regression QA. All 28 planned implementation stages are now covered; release acceptance remains subject to CI and real-device checks.

## Difficulty progression revision

| PR | Scope |
|---|---|
| 34 | Worlds 1–2: three one-cannon, three two-cannon, three three-cannon and three four-cannon puzzles per world; preserve unchanged puzzle IDs and archived rewards |
| 35 | Worlds 3–4: equivalent progression for quadratics and mixed routes |
| 36 | Worlds 5–6: equivalent progression for advanced families; plan optional former finales separately |
| 37 | Level-selection tiers and whole-catalogue progression audit |

PR37 concludes the catalogue revision with four labelled cannon-count bands in every world. The regular catalogue is guarded at runtime and audited in CI. Optional bonus finales and further classroom-calibrated difficulty adjustments remain separate future work.
