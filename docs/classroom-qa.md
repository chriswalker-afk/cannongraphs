# PR28 — Classroom release audit

## Teaching and practical use

Start from Home → world → learning mode → level. All 72 levels are unlocked in every mode. Cadet offers unlimited retries, equation templates, substitution guidance and an optional preview of the student's own graph. Pilot has five Pips and progressive feedback. Ace has three Pips, no mathematical hint panel or graph preview, and asks students to read the axes (essential exact non-integer/irrational anchors and accessible object descriptions remain available). Angles are in radians. Enter the right-hand side or a full y= equation; use ^ or superscript powers, fractions and brackets. Program every cannon before launch. Try again after a failed route; invalid syntax costs no Pip. A valid equation missing the muzzle costs one attempt. Success sends the remaining crew through the verified route.

Full animation is enabled by default on all devices. Students can explicitly select Motion: reduced in the level toolbar; the choice is retained for the current page session. Home has a separate Pause animation control. Audio is muted on a fresh browser. Settings are available on every screen; music and effects can be independently set to zero. No account, remote progress sync, purchases or external audio resources. Completion, gems, achievements, cosmetic choices and audio preferences stay on the current browser/origin. On blocked storage the game remains playable; session-only records can be lost on reload.

## Changes in PR28

- Preserve actual unit grid lines even when labels need thinning. Axes continue to use equal world scale; zoom/pan never change equations or collision geometry. Major tick labels are spaced by scale, with minor integer grid lines retained.
- Keep at least 210–250 CSS pixels of graph space in short or narrow windows. Prefer page scrolling to an invisible graph, clipped launch controls or cropped menu. Normal large screens use viewport space; short-screen Launch scrolls the graph into view. Home also preserves space for its demo and menu actions.
- Maintain keyboard focus on visible scene targets through redraw/resize. Offscreen objects are removed from sequential tab order; pan/reset and the flight-plan rail are available. Equation input announces cannon identity, family and guidance. Reduced-motion and forced-colour focus styling retained.
- Completion now says Level complete rather than implying that finishing the last numbered level completes an entire world. Actual world completion is derived in the Flight Log.
- Shared test-only reference solutions cover all 72 levels. The classroom regression test runs all 216 mode/level combinations, validates captures, actual function values, scoring, gem banking, stored records, achievements and both cosmetic catalogs. No reference answers are imported by the runtime UI.
- Chromium/Playwright tests run against the production build in CI: desktop (1366×768), tablet (768×1024), phone portrait (390×844), phone landscape (844×390) and narrow screen (320×568). The suite tests navigation, keyboard input, invalid syntax, misfire/retry, success/reload, Cadet preview, Ace restrictions, the final seven-family route, focus on resize, both workshops and persisted audio settings. Screenshots and failures/traces are retained in the browser report artifact. The classroom browser tests explicitly select reduced motion for deterministic short runs; separate animation tests verify the full-motion default even with OS reduced motion.

## Acceptance and remaining manual checks

Automated test/build and browser jobs must pass before merging. Screenshot artifacts support visual inspection; passing browser assertions is not a claim of pixel-perfect design, WCAG certification, or compatibility with every device. Check these on the actual classroom computer, projector and student devices:

- Chrome/Edge, Firefox and Safari, including touch and mobile browser keyboard/zoom; check graph legibility with projector contrast and large text/OS scaling.
- Keyboard-only and screen-reader journeys using the school's actual assistive technology; check announcements and reading order. Check forced colours and reduced motion.
- Audio sound balance through speakers/headphones and autoplay behaviour; test explicit mute and hidden-tab transitions. No actual listening test is included in automated CI.
- Real-time animation smoothness on low-powered school hardware, especially seven-cannon routes and rapid-fire. The classroom browser tests select reduced motion; dedicated animation tests cover normal motion. Inspect smoothness on real hardware separately.
- Shared/student browser privacy and local-data clearing; verify HTTPS and Pages deployment in the school's network environment.

Do not claim physical-device, human listening or assistive-technology testing from the automated suite alone. The final planned PR completes the initial roadmap; further polish should be based on classroom feedback.

### PR33: Choosing standard forms

Cannon pop-ups show the available algebraic forms as named formula buttons rather than a dropdown. Students can choose an expanded, factorised, completed-square or root-based quadratic. A selected form owns its own editable draft. Switching to another form with no draft does not infer parameters from the puzzle or the previous form. Free equation input is still available for all supported expressions. The same parser validates every form, and an incomplete/degenerate form cannot be launched. Existing collision, scoring and flight evidence rules still apply.

### PR37: Tiered level selection

All six worlds show four labelled rows of three numbered levels: Introduction (one cannon), Development (two), Challenge (three) and Mastery (four). The rows use the same tier colours across worlds, while the world identity remains in the banner and detail card. Every level remains unlocked; level selection and best results are mode-specific, with the selected number visually pressed. Tab through the twelve levels in order, Enter/Space selects, and the Play button opens the selected puzzle. The selected detail panel shows the actual cannon count, learning mode, objective, families and optional gems. At short landscape sizes the repeated banner description is omitted; at very small screen sizes normal vertical scrolling remains available. Check real classroom displays for readability, touch target usability, and actual student difficulty.

### PR38: Flight School

On a fresh browser, choose Meadow Launchers, any mode, and level 1. Inspect the marked cannon and exit coordinates, follow the worked gradient/intercept calculation, use the real parameter boxes, move to B using Next Cannon, experience a practice splat and revise B using the worked cannon-to-exit calculation. Verify the rapid-fire celebration and fresh scored crew. Skip/reopen via the toolbar; existing progress must be unchanged. Check the coach and equation popup on phones, short landscape and projected desktop displays.

### PR39: Level Workshop

Create a two-cannon design using drag and drop, resize terrain and enter exact coordinates. Test it in the real game, try a splat, then complete the route. Confirm and download only after the completion; verify that any edit revokes confirmation. Upload the downloaded file on a fresh browser and check that its geometry, types and firing directions match without importing answers or proof. Check phone placement, scrolling and keyboard controls. No custom level earns official stars, gems or achievements.
