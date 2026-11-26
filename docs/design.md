# Game design

Program every cannon before launching one delighted, goggle-wearing Pip. The creature follows the actual equation, not a precomputed model answer. If it reaches the exit, fire the remaining queue quickly along the same route; otherwise show a harmless cartoon splat, retain equations, and let the player revise. No planning timer. Standard mode hides trajectories until launch. Invalid syntax or wrong function family does not consume an attempt; a valid equation missing its source causes a misfire. Successful equations are retained, but changing any equation invalidates its tested state.

## Mathematical contract
World coordinates have positive y upwards and equal units on both axes. A cannon's marked point is its launch/capture anchor, independent of artwork. Start with left-to-right functions y=f(x). Future reverse, parametric and polar motion must be explicit. Use bounded expression parsing (never eval), reject undefined intervals and discontinuities, and use deterministic collision and capture tests with documented tolerances. Accept all mathematically valid routes, not just reference equations. Reference solutions are for automated level QA only. Preview only in optional learning mode.

## Visual direction
Whimsical illustrated landscape, understated readable grid, distinct cannon silhouettes and family colours, expressive squash-and-stretch creatures. Single-screen desktop layout with touch and keyboard alternatives, reduced motion and no reliance on colour alone. PR1 art is deliberately placeholder.

## Progression
1 Meadow Launchers: 12 levels, integer gradients, intercepts, horizontal/negative slopes, then chains. 2 Floating Isles: fractional slopes and negative coordinates. 3 Parabola Peaks: quadratic shapes and transformations. 4 Lost Arches: advanced quadratics and mixed routes. 5 Contraption Factory: cubic and reciprocal. 6 Graphiverse: exponential, logarithmic, trigonometric. Later: parametric and polar.

Pilot: five creatures, coordinate hover/tap, no preview. Cadet: optional hints and preview, unlimited attempts. Ace: three attempts, read coordinates from axes. All levels accessible; stars unlock cosmetic rewards only. Pilot scores 3 stars for 5 saved, 2 for 3–4, 1 for 1–2. Future modes and names are provisional.

## Architecture
TypeScript/Vite, SVG renderer, pure coordinate and simulation modules, data-driven levels and cannon registry. Browser storage later. No backend. Use a mathematical editor later, not arbitrary JavaScript. Separate render/animation from collision results and test known level solutions.
