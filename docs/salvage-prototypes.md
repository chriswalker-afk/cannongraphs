# PR52 — Salvage Yard playable prototypes

Play → Broken cannons → Salvage Yard · flight tests. The separate chooser contains First mounting (linear) and Arc recovery (quadratic plus terrain) in Cadet, Pilot and Ace. These are unranked experiments; the existing seven official worlds and 84 levels and their progress are untouched. The incoming line is prefilled but remains editable. Reference answers are only in tests.

## Interaction

The compact tray displays each supplied part, its fixed shape before mounting, the derived equation after mounting, and its current mount label. Drag from a tray card to a marked muzzle point, or select a card and click/tap an empty mount. Keyboard users can activate the tray card and focus/activate a mount. A mounted cannon can move through its small deck grip or the tray card. Return to tray removes its capture target. Cancel or Escape clears the selected part. Dragging outside any mount/tray leaves the position unchanged; occupied mounts reject another cannon. Only free versus occupied versus currently hovered legal mounts are distinguished. No pre-launch answer check is performed.

The camera-aware hit test measures the actual marked muzzle, not the surrounding bracket. A threshold of six CSS pixels separates clicking from dragging. The pointer-captured drag ghost is independent of the redrawable SVG groups; document listeners are cleaned up when leaving the game. Mouse and touch use the same placement logic. Brackets and supports are noncollidable; unoccupied mounts never enter the simulator.

Click a mounted cannon to inspect its equation. Locked parts have a read-only expression, ordinary parts use the existing editor and retain their draft across relocation/unmounting. Cadet has the existing optional preview; Pilot and Ace do not. All supplied parts must be mounted, programmed, and used in a successful relay. Positions are immutable during a flight. Restart restores the authored empty layout and initial drafts; Play again retains the current layout and drafts. Feedback and flight animation use the real simulator. The new category detection recognises future anchor worlds; prototypes use the existing Foundry music temporarily rather than adding an official world identity.

## QA

Unit tests check every legal mount in both demos, support resolution, exactly one winning mount for each supplied starting equation, exact locked constants and every learning mode. Browser journeys cover tray dragging, remounting by deck grip, keyboard activation, actual touch input, locked inspector, previews, failed decoy, completion, unmount, replay/restart, navigation, zoom, and responsive phone width. A physical touchscreen and rendered visual review remain necessary.

## Next PR53

Author the first six linear/mixed placement puzzles with genuinely useful/partially useful decoys, progressive removal of scaffolding, ordinary programmable inventory parts, multiple mounts and obstacle constraints. Enumerate legal assignments and possible straight-line routes through the actual simulator to detect shortcut or nonunique puzzles. PR54 adds quadratic/mixed advanced levels; PR55 workshop import/export; PR56 official integration.
