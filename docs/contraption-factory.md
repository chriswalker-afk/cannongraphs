# PR19 — World 5: Contraption Factory

Twelve authored levels replace the provisional World 5 engine preview in the live catalog. There are now five complete worlds (60 levels), plus the provisional World 6 preview. All are accessible from the start, with five Pips each. The old factory preview remains a regression fixture. World completion leads to the next world.

| Level | Focus |
| --- | --- |
| 1 Cube drive | Basic cube function |
| 2 Variable transmission | Fractional cubic scale |
| 3 Reverse torque | Negative leading coefficient |
| 4 Offset piston | Horizontal and vertical cubic translations |
| 5 Triple gear | Three roots, two turning points |
| 6 Double-action press | Translated cubic with two extrema and unequal anchor heights |
| 7 Hydraulic branch | Positive reciprocal branch |
| 8 Vacuum chamber | Negative reciprocal branch |
| 9 Offset pressure | Shifted vertical and horizontal asymptotes |
| 10 Return valve | Reflected, shifted reciprocal, leftward firing |
| 11 Gearshift relay | Cubic with two extrema into a reciprocal |
| 12 Assembly line | Cubic, reciprocal, cubic, linear relay |

Optional gems provide additional precision challenges in every new level, including at roots, translated centers, extrema and selected branch coordinates. All reference equations are test-only; the game accepts alternative supported equations if they genuinely complete the route.

The last two levels deliberately use alternating high/low gate cross-sections. A direct cubic shortcut through successive low, high, low, high and low heights would require at least three distinct derivative zeros by the mean value theorem; a cubic derivative has degree two. The final reciprocal leg cannot bypass the next cubic because the gates require a fall followed by a rise, whereas a reciprocal branch is strictly monotone. Tests use the actual authored openings, ignoring the creature radius to make the impossibility argument conservative. Continuous route clearance is checked with the PR18 bounded graph solver. No symbolic exactness claim is made for advanced collision distances.

The factory's original distant gears, pipework, furnaces and industrial panels are decorative. Solid terrain is still clipped to its world-coordinate rectangles. No moving solid machinery, timers, extra attempt cost or changes to collision mechanics. Browser QA pending: check the factory palette and grid contrast, zoom readability, steep cubic poses, leftward reciprocal, gate inspection and finale, plus gem sparkle and rapid-fire. Next PR20: Beyond the Graphiverse (exponential, logarithmic and trigonometric functions).
