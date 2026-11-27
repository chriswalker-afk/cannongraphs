# PR34 — Linear worlds rebalanced

Each world has exactly twelve selectable levels, ordered in four bands of three puzzles. Numbering in the menu follows the catalogue position, not the internal puzzle ID. Six unchanged puzzles in each world preserve their original geometry, gems, IDs and records. Twelve newly authored puzzles have distinct r-prefixed IDs; retired single-cannon records must not count as newly authored relay completions.

| Position | Meadow Launchers | Floating Isles | Cannons |
|---:|---|---|---:|
| 1 | First flight | Gentle ascent | 1 |
| 2 | Double climb | Cloud steps | 1 |
| 3 | Skyward | Glide down | 1 |
| 4 | Meadow relay | Island hopping | 2 |
| 5 | Under and over | Across the axes | 2 |
| 6 | Twin slopes | Westward return | 2 |
| 7 | Three-way trail | Three winds | 3 |
| 8 | Below the origin | Crosswind chain | 3 |
| 9 | Three ridge run | Cloud turnabout | 3 |
| 10 | Meadow circuit | Four wind crossing | 4 |
| 11 | Rolling ramparts | Westward gauntlet | 4 |
| 12 | Meadow gauntlet | Skyway switchback | 4 |

World 1 retains the original three positive-gradient introductions (including the visually reviewed Skyward puzzle); negative gradients start in the first relay. World 1 remains integer-coordinate, integer-gradient and integer-intercept. World 2 begins with fractions, then introduces fractional intercepts, signed quadrants, leftward travel, reversing direction and several independently calculated equations. Each new level has explicit authored terrain, platforms and optional gems. Reference equations are test-only. Every reference must visit all cannons; exact lines to any later nonadjacent anchor must fail (solid obstruction or earlier capture). The existing physics, five-Pip budget, learning modes and scoring are unchanged.

New levels are verified using the same mathematical clearance audit, full-route/gem tests, waiting crew/support tests and three-mode regression tests as the old levels. Final menu band styling is scheduled for PR37. Real classroom difficulty and visual review remain necessary.

## Progress migration

On first access, the new v2 storage key imports the still-current puzzle IDs from the original v1 records. The original v1 key remains intact. Frozen metadata of the original 72 puzzles (IDs, cannon counts, gem IDs and budgets) allows all genuinely earned historical achievements to be retained independently of the revised level totals. Current completion/star/gem totals reflect only active puzzles. Retired single-cannon puzzle records never count as new relay completions. Future curriculum passes must keep unchanged puzzle IDs, use distinct IDs for new puzzles and continue retaining earned achievements. Previous tabs using the old build should be reloaded before playing the new curriculum.
