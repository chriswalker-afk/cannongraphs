# PR13 — World 2: The Floating Isles

Twelve new levels extend the existing unlocked catalog to 24. The sequence starts with positive fractional slopes, then negative fractions, fractional intercepts, signed coordinates, all four quadrants, leftward firing, and increasingly complex relays. The finale reverses direction at cannon B before crossing back to the east. The same equation parser, exact capture, swept-disk collision, attempts, feedback and star scoring remain in use.

| Level | Focus |
| --- | --- |
| 1 Gentle ascent | Gradient one half |
| 2 Cloud steps | Gradient two thirds |
| 3 Glide down | Negative fractional gradient |
| 4 Halfway up | Fractional intercept |
| 5 Across the axis | Negative x |
| 6 Through the origin | Quadrants III and I |
| 7 Crosswind | Quadrants II and IV, negative fractional gradient |
| 8 Westward | Leftward travel with negative gradient |
| 9 Return descent | Leftward travel with positive gradient |
| 10 Island hopping | Two fractional equations |
| 11 Three winds | Three mixed equations |
| 12 Skyway switchback | Four cannons and direction reversal |

The sky theme uses distant translucent floating islands, waterfalls, clouds and a cooler terrain palette. Decorative scenery does not collide. Solid platforms/ceilings/walls retain their exact clipped rectangular bounds. Direction indicators are displayed independently of the equation's slope. The grouped level selector supports both worlds; completing the Meadow finale offers the first Floating Isles level. All levels remain selectable from the start. 

Reference solutions are test-only, audited for clearance and required cannon order. Tests cover shortcuts, camera round trips with negative axes, leftward flight and multi-leg celebration. Existing Meadow tests are scoped to their world rather than assuming the catalog has only one world.

Manual browser QA pending: all 12 new levels, signed axis labels, theme readability, clipped terrain, leftward cannon orientation and cue alignment, four-cannon switchback, level picker and cross-world progression, small screens and reduced motion. The local misfire gag can still have a short constrained walk on small elevated platforms; further authored staging may be needed. No persistent progress yet. Phase 2 is complete when this PR merges. Next PR14: quadratic cannon, safe polynomial parsing, exact trajectory/capture and continuous collision support for curves.
