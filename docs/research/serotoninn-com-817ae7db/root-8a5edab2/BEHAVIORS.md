# Behaviors

## Source Findings

- The source uses a custom transition layer and heavy animated media; browser navigation never settles normally.
- Main editorial sections are scroll-driven in presentation, with horizontal draggable/clickable product rails.
- Utility actions use bracket syntax and very small uppercase text.
- Representative hero CTA retained the same computed color and transform on hover in the captured state; the interaction is primarily typographic rather than a raised button treatment.
- The source header wrapper itself reports static positioning; visible navigation children are separately positioned.
- Desktop, tablet, and mobile preserve the same high-contrast grammar while reducing horizontal inset from `35px` to approximately `16px`.

## Applied Behaviors

- Header is sticky because this is an operational tool, not a passive editorial page.
- Upload remains click and drag/drop driven; photo preview replaces the empty stage.
- Skill cards remain click-driven toggle controls with `aria-pressed` state.
- Selected Skill items invert to black and expose their individual accent as a narrow signal strip.
- The system band updates selected count from the existing application state.
- Generation remains parallel and each result independently moves through loading, success, or error.
- Hover transitions are limited to `140ms` color/transform changes; no scroll hijacking or product carousel behavior is imported.
- Responsive breakpoints remain `900px` and `620px`; four columns become two and then one.
