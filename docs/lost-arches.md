# PR16 — World 4: Lost Arches

Twelve authored levels extend the catalog to four complete unlocked worlds and 48 levels. The fourth world uses a warm, ancient-temple palette with original distant stone arches, climbing vegetation and ruined columns. Decorative arches are not collision shapes: solid terrain remains clipped to its exact rectangular bounds. A multi-opening vertical gate is a composition of existing rectangle primitives, not a new collision model.

| Level | Mathematical focus |
| --- | --- |
| 1 Sunken crown | Fractional negative scale, quadrant II maximum |
| 2 Buried basin | Quadrant III minimum |
| 3 Fallen keystone | Quadrant IV minimum |
| 4 Eastern vault | Quadrant I maximum, fractional negative scale |
| 5 Split roots | Fractional roots and scale in factorised form |
| 6 Offset well | Unequal-height points and two gates |
| 7 Reverse arch | Leftward travel over a maximum |
| 8 Reverse well | Leftward travel through a minimum |
| 9 Broken symmetry | Unequal endpoint heights and an offset turning point |
| 10 Temple relay | Linear, quadratic, linear |
| 11 Labyrinth switchback | Two quadratics, reverse flight, multi-height gate, straight line |
| 12 Vault of five | Five cannons, alternating arches/valleys and central line |

The first nine levels are increasingly constrained single-cannon curves. The final three introduce multi-cannon routes, culminating in a five-cannon puzzle. Level 11 changes direction at B; three distinct flight elevations share a vertical gate. All marked points and obstacle bounds remain inspectable. Objectives suggest reasoning strategies; the engine accepts other valid curves.

Each reference route is test-only and audited by the actual continuous collision engine. Shortcut tests for levels 10–12 use an additional geometric necessity: a quadratic through two anchors differs from their straight chord by a(x-sourceX)(x-targetX). At representative gate cross-sections, the empty vertical intervals imply intervals for a. Their intersection is empty for nonadjacent forward quadratic shortcuts, even ignoring the Pip radius and allowing contact. Linear shortcuts are checked by the existing simulator. These checks cover exact-anchor trajectories; the runtime retains its documented numerical capture tolerance. Regression tests also check fractional coefficients, all turning point quadrants, reverse-flight tangent/position, alternative solutions and the full five-leg rapid-fire pipeline.

Manual browser QA pending: inspect all twelve levels, particularly tight gates and reverse cannon art; verify five-cannon dock scrolling, zoom/axis readability on wide finales and small screens, rapid-fire and reduced motion. No new collectibles or progress persistence yet. Next PR17: optional route collectibles that reward mathematical precision without replacing the exit or consuming extra Pips.
