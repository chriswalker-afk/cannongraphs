# PR53 — Salvage Yard linear progression

Six authored puzzles, separate from curriculum records until official integration (PR56). The Broken cannons → Salvage Yard flight tests page now has an ordered six-level practice sequence and the two original experimental flight tests. All modes share the same mathematical geometry. Levels 1–2 provide an editable incoming line; 3–6 do not. Next puzzle preserves the chosen mode. Restart restores the authored unmounted inventory.

| Level | Mounts | Movable parts | Mathematical demand |
|---|---:|---:|---|
| First mounting | 3 | 1 locked | Positive gradient; one receiving-only and one outgoing-only decoy |
| Wrong turn | 4 | 1 locked | Negative gradient; a plausible outgoing mount is blocked |
| Spare parts | 5 | 1 locked | Fractional gradient and independently programmed incoming line |
| Double connection | 5 | 2 locked | Work backwards through two locked lines |
| Reassembled | 6 | 1 ordinary, 1 locked | Program two lines and use narrow openings |
| Scrap maze | 7 | 1 locked, 1 ordinary | Several candidate points on a descent, terrain eliminates wrong turns |

Decoys are physically legal mounts, with neutral visual affordances. All supplied parts must be used. The authored obstacles, not hidden hints, eliminate incorrect placements. The first three levels use Salvage Depot scenery; the next three add Dismantling Yard cranes and presses.

Tests enumerate injective assignments to mounts and all mathematically possible programmable straight lines joining a muzzle to any forward occupied muzzle or exit. Every route is checked by the real simulator (including collision and complete-relay rules); expected unique assignments and reference programs exist only in tests. Because all programmable parts are linear and the simulator captures exact marked coordinates, this enumerates every possible successful program without sampling arbitrary slopes. All legal layouts must have valid support art. Browser tests exercise scaffold removal, progression, two inventory parts, occupied mounts, and programmable cannons.

PR54 will add six quadratic and advanced mixed puzzles. PR55 handles workshop integration and file format; PR56 integrates the full world and official records.
