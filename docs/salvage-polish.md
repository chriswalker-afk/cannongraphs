# PR57 — Salvage Yard final polish

Presentation and usability only. Official 96-level catalogue, every candidate anchor, inventory definition, locked coefficient, collision boundary, equation parser, mode policy and progression rule remain unchanged.

- The narrow/short screen objective and programming-status key are native keyboard-accessible disclosures. In Ace, the objective label explicitly advertises the exact coordinate information. No text is removed. Desktop starts expanded; small screens start collapsed.
- Compact header, queue, toolbar and tray, with one-line single-part cards, two-part rows, a three-column finale and two-by-two custom four-part trays. Full equations and mount labels remain readable and accessible. Keep a minimum stage size and allow scrolling if a very short viewport cannot fit everything.
- Pan controls are hidden at 100% zoom and return when zoomed. Zoom and reset stay available. The camera keeps equal units and authored bounds; no axis stretching or hidden terrain.
- Inspection text is in the existing toolbar for anchor puzzles, not floating over nearby cannons. Empty mounts have stronger contrast, compact radius limits and readable IDs; all free mounts share the same teal readiness colour, with blue for the currently hovered destination. No correctness feedback before launch.
- Depot retains reclaimed parts, Dismantling Yard has steel offcuts, Sorting Station bins, Reconstruction Plant finished assemblies. Decoration is noncollidable.
- Public Broken cannons menu contains only the two official worlds. The old flight tests remain reachable through explicit `?flight-tests=1` QA access; existing test journeys use that opt-in. No changes to saved records.

Browser regressions cover all twelve authored layouts and all four scenery variants, portrait 390x844 and 320x568, landscape 844x390, objective/coordinate and legend disclosures, zoom/pan, neutral mount highlights and outside-graph inspection, as well as all existing gameplay and custom-workshop tests. A 390x844 finale target is at least 380 CSS pixels of stage height when secondary details are collapsed, with a tray under 195 CSS pixels. A stage is not the same as the equal-scale coordinate plane; phones may still need zoom for precision. Physical-device and final rendered visual QA are required.
