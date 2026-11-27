# PR54 — Advanced Salvage Yard placement puzzles

The practice world now contains twelve levels, plus the original two experimental demos. Levels 7–12 have no supplied incoming equations; every ordinary cannon must be programmed. All movable quadratic cannons lock their nonconstant global-x polynomial coefficients, so placing one at another x-coordinate may change the launch angle but not the coefficients. Ordinary inventory parts remain linear, permitting an exhaustive exact-route audit.

| Level | Mounts | Inventory | Main challenge |
|---|---:|---|---|
| 7 Arc recovery | 5 | Locked quadratic | Deduce the constant from the exit and clear the furnace |
| 8 Mixed salvage | 6 | Locked quadratic + locked line | Connect an upward-opening arc and rising line |
| 9 False connections | 7 | Locked quadratic + ordinary line | Reject partially useful mounts and obstructed routes |
| 10 Reverse assembly | 8 | Locked line + locked quadratic + locked line | Work backwards through three parts |
| 11 Interchangeable parts | 9 | Two locked lines + locked quadratic | Deduce the cannon order, not alphabetical order |
| 12 Salvage master | 10 | Two locked quadratics + ordinary line | Thread three placements and two editable lines through multiple gates |

All legal mount assignments are enumerated, including all cannon permutations. For each ordinary straight-line cannon, the exact lines to every forward cannon/exit are enumerated. Locked quadratic programs are calculated directly from the current muzzle. The actual flight simulator checks collisions, captures, and use of all supplied cannons. Only one winning placement is expected per puzzle; reference data are test-only. Test every mode, preserve locked coefficients under relocation, and verify progression from level 6 to 7 and finale completion. The 84 official levels and records are unchanged until PR56.

Sorting Station has muted conveyors and hoppers. Reconstruction Plant adds hoists, gantries and reclaimed-machine frames. The three-part phone inventory uses a compact three-column grid. Browser regression checks progression, moved arc equations, nonalphabetical relay, ten-mount finale, and narrow-screen width. The inherited post-drag touch-test failure was reproduced using Chromium with the PR52 deployment artifact. An immediate CDP touch after a drag produced pointer and touch events but no synthesized click. A 250 ms inter-gesture gap and 50 ms tap dwell restored zoom, reset, return-to-tray, placement and restart in three independent local Chromium runs. The browser regression now uses the same native touch gesture timings; no checks were removed and no game logic was changed. Final CI and physical-device testing remain necessary.

PR55: Level Workshop support for candidate anchors, inventory and locked coefficients; backward-compatible versioned import/export and canonical playtest verification. PR56: official eighth world, difficulty/achievement integration and final visual QA.
