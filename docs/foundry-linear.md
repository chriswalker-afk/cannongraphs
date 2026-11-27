# PR45 — Broken Foundry: linear progression

Six authored practice levels supplement the two flight-test demos. All are selectable in Cadet, Pilot and Ace. Success advances to the next puzzle with the same mode. The original 72-level catalogue, completion and stars are unchanged; Foundry remains a separate experimental area until the complete world is ready.

| Level | Focus | Ordinary start |
| --- | --- | --- |
| 1 First lift | Positive locked gradient; lower into horizontal incoming flight | Prefilled |
| 2 Downhill lift | Negative locked gradient; raise into rising incoming flight | Prefilled |
| 3 Fractional gears | Negative fractional gradient; low exit | Prefilled |
| 4 Double lift | Propagating vertical constraints through two lifts | Prefilled |
| 5 Working backwards | Derive lift height from exit and program incoming line | Blank |
| 6 Narrow passage | Two dependent lift heights, programmable incoming line and gaps | Blank |

Prefilled equations are editable scaffolding, not hidden solutions. Rail stops are integers. Reference target heights and solved equations live only in tests. The audit enumerates every legal lift layout and every possible first straight-line destination (including the exit), checks full simulator results, requires all cannons to be visited in sequence, and checks uniqueness of the successful height combination. Existing obstacle collision tolerances and actual swept geometry apply. The tests also check static support generation at all legal positions. Browser regression covers selection, seeded and blank plans, solving and advancing.

Feedback for missed movable targets and locked outgoing trajectories now discusses vertical alignment rather than telling learners to change a locked gradient.

PR46: add quadratic and mixed-family puzzles for the remaining six levels, preserving the translation-only constraints and extending the authoring audit. PR47: custom level workshop and library support. PR48: complete curriculum integration, progression records, responsiveness and classroom QA.
