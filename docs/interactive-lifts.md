# PR44 — Interactive lifts

The home screen offers Broken Foundry · Demo, a separate unranked chooser with linear and quadratic test puzzles in Cadet, Pilot and Ace. Both seed the ordinary incoming equation as an editable starting point; the lift is ready with its derived equation. No curriculum IDs, progress records, unlocks or custom files change.

Drag the striped handle vertically (mouse/touch) or focus it and use Up/Down, Home/End. The camera inverse transform maps pointer coordinates to world coordinates, retaining the initial grab offset. The SVG itself owns pointer capture, so rebuilding its geometry does not interrupt a drag. The existing camera pan handler ignores lift handles. Click the cannon for a read-only equation with Raise/Lower buttons. Rails, deck, crack and lock are decorative; static supports are skipped for movable cannons. The idle barrel uses the locked derivative at its current x.

The game uses the current immutable level and matching flight plan for both rendering and simulation. A move clears stale traces and feedback, updates any active Cadet preview, and invalidates all tested-leg evidence. Movement is blocked during flight and rapid-fire. Replay retains positions and equations; Restart restores the authored positions and starting drafts. Pilot/Ace do not get graph previews. Ace has no visible position number in the lift popup (accessible slider values remain available).

Unit tests check both authored demos against the real simulator. Browser tests cover keyboard movement, drag movement, live locked equation, reset, launch lock and completion. Manual device review remains necessary.

Next PR45: design and audit the linear Broken Foundry progression; decide how the new world enters the curriculum once the mechanic is reviewed.
