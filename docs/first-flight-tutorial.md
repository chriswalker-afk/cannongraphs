# PR38 — Flight School

The first visit to Meadow Launchers level 1 automatically offers an interactive, unscored two-cannon practice run before the existing one-cannon level. A separate practice scene is necessary to teach Previous/Next Cannon without changing the 3–3–3–3 catalogue or spoiling a scored relay. Existing players who already completed level 1 bypass automatic onboarding. Everyone can reopen Flight School using the level 1 toolbar button. Skip or successful practice records a small independent local tutorial preference; it does not create completion, star, gem or achievement records. A blocked localStorage falls back to the page session.

The practice sequence uses real scene controls and actual engine outcomes:
1. Rescue the Pips; one Pip verifies the route and the others follow.
2. Read the marked coordinate dots, with colour-coded projections to both axes and hover/tap/focus inspection.
3. Work out the line from A (1,3) to B (4,6): m=(6−3)/(4−1)=1, 3=1×1+c, c=2, y=x+2. Enter the gradient and intercept using the real boxes or arrow controls.
4. Next Cannon opens B and retains A. All cannons require an equation before Launch.
5. Deliberately try B with y=−2x+14 to experience an actual splat (or calculate the right equation independently). This passes through B but hits the floor. Explain the difference between a valid equation, a misfire and a collision. No scored Pips are lost.
6. Read B (4,6) and the exit (8,2). Work out m=(2−6)/(8−4)=−1, 6=−1×4+c, c=10, y=−x+10; substitute the exit to check. Revise B, keep A, launch again. Green/red states are real flight evidence.
7. Observe rapid fire; explain scored stars, then enter the original level 1 in the originally selected mode with a fresh, blank plan and full budget.

The coach uses brief context-dependent instructions, actual coordinate guides and real editor/launch highlights. It never locks the student into a particular correct spelling or requires a deliberate mistake; a correctly calculated independent practice route can finish directly. There is no new scoring, physics or reference answer in any scored puzzle. The tutorial is always unlimited practice, including for Ace players, but the selected mode's original policy returns upon leaving. Tutorial previews are disabled to focus on coordinate reasoning. The first and second worked calculations are for the separate tutorial anchors only.

Unit tests cover geometry, exact equations, genuine splat, unlimited practice, actual halo evidence, alternate correct input, storage and progress isolation. Browser tests cover the entire journey, skips/replay and phone/short-landscape popup sizing. Real classroom review remains necessary.
