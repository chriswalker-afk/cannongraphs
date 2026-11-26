# PR4: First Pip and animation groundwork

Pips are original reusable SVG characters with a rounded fluffy body, aviator cap, goggles, blush, waving arms and smiling expressions. The body centre is the local origin for future flight/collision alignment. Five waiting Pips are visible in the compact header queue, with staggered idle hops and a reduced-motion fallback. One Pip leaves the queue during a rehearsal and rejoins after it finishes.

The **Preview firing** control is explicitly a non-scored animation rehearsal. It does not read the equation, expose its route, simulate a valid flight, decide success, or consume a creature. The actual Launch button remains disabled until PR5. The rehearsal includes a hop into the breech, charge, recoil, muzzle flash, smoke, delighted ejection, fade and automatic queue reset. Animation data is sampled in world units; camera resize/zoom/pan redraws the same current frame. Only an active rehearsal requests animation frames. SVG effects are non-interactive, behind coordinate tooltips. Reduced motion disables queue bouncing, smoke, recoil, stretch and travel, showing brief discrete poses instead.

The pure launch cue is deliberately separated from the illustrative demo path. PR5 should reuse cue timing and character rendering but replace the demo path with the actual equation/collision result, without snapping the mathematical position to artwork. The source marker never moves during recoil. Later modes should use actual attempt state to update the queue rather than the rehearsal flag.

The first exit ledge was narrowed on its approach side: the old rectangle intersected the intended y=x route before the exit. This is a geometry correction; formal creature clearance and capture checks are PR5.

Manual browser QA pending: confirm queue and rehearsal on desktop/mobile/short viewport, test repeated and rapid clicks, zoom/pan/resize during rehearsal, keyboard inspection, and reduced-motion preference. Confirm no equations are edited, no creature is lost, no path is drawn, and standard Launch remains disabled.

Next: PR5 — accurate flight and collision engine, exit capture, harmless splat and route feedback. PR6 will add limited attempts and level state.
