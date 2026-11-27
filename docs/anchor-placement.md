# PR51 — Salvage Yard placement foundations

The new optional `Level.anchorPuzzle` contains distinct named muzzle coordinates (`anchors`) and the supplied `inventory`. Each inventory item has a stable cannon ID, linear or quadratic family, direction and optional zero-constant `lockedShape`. There is a fixed starting cannon. An unmounted inventory cannon has no position, does not appear in `Level.cannons`, and cannot be captured. Runtime geometry is reconstructed in deterministic order from anchor assignments. An author may preplace parts; a new Salvage Yard puzzle can start with all its parts in the tray.

The first-stage limits are four inventory cannons, twelve candidate anchors, bounded finite coordinates, and linear/quadratic movable parts. This supports the planned ten-anchor finale while keeping exhaustive audit tractable. Anchor points have distinct IDs, interior mounting clearance and separation from other anchors, fixed cannons, exit, gems and terrain. Occupied anchors reject another part; no swapping or auto-ejection. Moving or unmounting is an immutable planning edit and consumes no Pip. Vertical rails and anchor puzzles are separate mechanics for now. Automatic static support resolution can be reused for mounted parts.

For a broken part, reuse the exact rational `anchorFlightEquation`: linear c = q − mp; quadratic c = q − ap² − bp. Global coefficients, family and firing direction stay fixed, even as both coordinates change. The quadratic launch slope changes naturally with the x-coordinate. All candidate mounts can be mathematically legal, including decoys. Ordinary parts keep their entered draft when moved or unmounted, but the player must revise it if it no longer passes through the new muzzle.

Level-aware flight plans retain entries for unmounted inventory, prevent locked or unplaced edits, and do not mark an unmounted cannon ready. Placing a locked part automatically supplies its exact equation. Every movement clears stale evidence for all legs and is blocked outside planning/retry. Launch readiness tests only structure and submitted equations; it does not simulate or reveal correct placements. The route engine independently requires all parts to be mounted, rejects overridden locked equations, and uses only real occupied coordinates in collision/capture tests. If an actual flight reaches the exit while bypassing any supplied cannon, it resolves as incomplete-relay rather than success. Existing modes, Pip budgets, feedback and normal-world bypass behaviour remain unchanged.

The saved-layout verifier reconstructs allowed assignments against the authored definition and checks all reached cannon anchors; this is groundwork for later official and custom-level completion. No changes to catalogue IDs, custom file format, or menus yet. Runtime anchor state must not be exported as an authored solution.

Tests cover meaningful decoys, empty-mount pass-through, occupied mount rejection, unmount/replace, normal draft preservation, exact fractional and quadratic translations, leftward flight, missing placement and locked equation rejection, all-cannon relay completion, phase gating, and canonical layout integrity.

## PR52 next

- Add a compact cannon tray and physical docking brackets; show free/occupied mounts only, never solution hints.
- Drag/snap with pointer and touch, tap-select/place and keyboard controls; move between mounts or return to inventory.
- Integrate the level-aware plan into scene, editor, readiness, replay/restart, preview and feedback. Render locked coefficients before placement and the complete equation after placement; handle Ace exact-coordinate requirements.
- Two separate unranked playable prototypes (linear and quadratic) under the Broken cannons chooser, not yet part of the curriculum. Keep normal and Foundry worlds unchanged.
- Browser regression, screenshot review and mathematical audit. Subsequent PRs add the twelve puzzles, workshop, file format, official progress and world integration.
