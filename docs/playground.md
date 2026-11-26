# PR 2: Coordinate playground

The scene uses a responsive SVG viewport, equal world-unit scale on both axes, zoom 100–250%, clamped camera movement and labelled ticks at the visible plot edges. The cannon muzzle and exit centre are exact marked coordinates. World terrain rectangles are the future collision geometry; background hills/clouds are decorative. Native SVG focusable objects expose coordinates to keyboard and assistive technology. Hover, touch/click (pin), focus and Escape are supported. Drag the background or use the arrow controls when zoomed. The zoom reset restores the full level. The static preview has no graph or flight path until PR3 onwards.

Manual QA checklist (not yet executed): inspect A at (1,1), exit at (6,6), and wall bounds; hover, tap, keyboard Tab/Enter/Escape; zoom in/out and pan to each edge, reset; test 1366×768, 1024×600 and 390×844; confirm no vertical scroll and equal unit spacing. Verify marked points stay on grid intersections. Confirm no terrain extends outside its defined rectangle and that the launch control is disabled.

Next: PR3 safe linear expression parsing and equation entry. Preserve the world-to-screen transform and existing inspect controls. Do not add a pre-launch path in standard mode.
