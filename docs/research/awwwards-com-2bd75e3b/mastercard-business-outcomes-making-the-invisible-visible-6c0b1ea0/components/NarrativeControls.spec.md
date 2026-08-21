# NarrativeControls Specification

## Overview
- Target file: `photo-skill-studio/public/index.html` and `photo-skill-studio/public/app.js`
- Interaction model: click/drag-driven input, click-driven Skill selection and generation.
- Source pattern: numbered chapters, narrow readable text column, oversized quote/action interruption.

## Adapted structure

- `02. STYLE MATRIX` and `SELECT / EDITION` act as chapter 2.
- Four existing Skill cards remain in the matrix, with two-digit indices and accent rules.
- Existing `system-band` becomes a chapter metadata strip: MODEL, EXECUTION, SELECTED.
- Existing `run-section` is the quote/action band: black surface, selected count, and bracketed Generate command.

## Exact visual contract

- Narrative text uses 14-16px/28px, weight 300-400, max width approximately 930px.
- Chapter headings use `1.`, `2.`, `3.` numbering with 32-48px display treatment.
- Action interruption may use black `#000` and signal red `#ed3833`; no card-within-card stacking.
- Skill card radii are 0; only the source photo/media stage uses the source-like 10px radius.
- `systemCount` remains dynamic and formatted as `04 / 04`.

## Responsive behavior

- Desktop matrix: 4 columns; tablet: 2; mobile: 1.
- Quote/action band changes from horizontal to stacked below 620px.
- Controls remain keyboard and screen-reader addressable through existing IDs and aria attributes.
