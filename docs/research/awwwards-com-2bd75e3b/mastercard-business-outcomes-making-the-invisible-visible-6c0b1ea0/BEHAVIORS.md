# Behaviors

## Source page observations

- Header is 54px, transparent, and not visually changing at desktop scroll positions. On the mobile extraction it is `position: sticky` at the top.
- The article is a long native scroll (`document.scrollHeight` approximately 14,038px desktop and 11,567px mobile); no mandatory snap points were observed.
- The page rhythm is scroll-driven editorial reading: wide visual blocks alternate with centered narrative columns and numbered headings.
- The source contains embedded Vimeo iframes, a cookie notice, a floating back-to-top control, and a centered brand mark. These are excluded from the adapted tool because they are unrelated to photo generation or branded third-party behavior.
- Source hero and article images are rounded, while narrative text and section blocks remain square and spacious.
- Hover states are limited to utility links/buttons; there is no source tab or accordion state to reproduce.

## Adapted behaviors

- Upload zone opens the existing file picker and accepts drag/drop. A local preview replaces the empty stage without sending data until Generate is clicked.
- The source photo stays the largest visual object in chapter 1; controls sit in a narrow side column on desktop and stack under it below 900px.
- Skill cards are editorial outcome tiles. Selected state uses a black surface, accent top rule, and checked mark; unselected state uses the paper surface.
- Generate remains explicit and disabled until a valid photo and at least one Skill are selected. Selected count updates in the chapter/action band.
- Parallel generation keeps PROCESSING, READY, and FAILED states per result; retry/download behavior is unchanged.
- Install dialog remains a square, black-headed editorial overlay. It accepts only declarative ZIP Skill packages.
- Responsive breakpoints: desktop 4-column Skill matrix, tablet 2-column, mobile 1-column; all page widths use `min(100%, ...)` and are checked for zero horizontal overflow.
