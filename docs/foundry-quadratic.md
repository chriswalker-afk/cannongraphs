# PR46 — Broken Foundry: quadratic and mixed progression

The separate Foundry practice area now has all twelve puzzles plus the two flight tests. Success advances from linear level 6 to quadratic level 7 and through level 12, preserving the learning mode. The existing 72-level curriculum and saved records remain unchanged until integration.

| Level | Focus | Ordinary cannons |
| --- | --- | --- |
| 7 Broken arch | Downward-opening arc translated above a furnace | A prefilled |
| 8 Under the press | Upward-opening arc translated below a ceiling | A prefilled |
| 9 Mixed machinery | Locked quadratic feeding a negative-gradient lift | A prefilled |
| 10 Reverse engineering | Derive a quadratic constant from the exit, then program the incoming line | A blank |
| 11 Assembly line | Three dependent lifts with linear/quadratic/linear shapes | A blank |
| 12 Foundry gauntlet | Two locked arcs and two independent programmable linear cannons | A and C blank |

All movable cannons keep their locked nonconstant coefficients. Rail heights are integers; both positive and negative curvature and fractional coefficients are used. Ordinary programmable cannons in this set remain linear, allowing a comprehensive route audit: enumerate every legal rail layout and every possible forward line from each ordinary cannon to a marked destination. The actual engine must reach the exit through every cannon in authored order, with exactly one winning lift layout. Reference solutions are test-only. Browser tests cover arc movement, live equation text, progression and the blank finale.

PR47: preserve lift metadata through custom-level creation, editing, export/import, validation and the exact-design playtest/confirmation workflow. PR48: integrate the complete world into curriculum progression, records and audits, then review small-screen/touch behaviour.
