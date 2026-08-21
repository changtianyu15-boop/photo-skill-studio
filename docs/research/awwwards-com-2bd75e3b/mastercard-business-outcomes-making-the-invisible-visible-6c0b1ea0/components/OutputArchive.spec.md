# OutputArchive Specification

## Overview
- Target file: `photo-skill-studio/public/index.html`, `photo-skill-studio/public/styles.css`, and `photo-skill-studio/public/app.js`
- Interaction model: click-driven retry/download/clear; static empty state.

## Adapted structure

- `03. OUTPUT ARCHIVE` and `GENERATED / EDITIONS` form the closing editorial chapter.
- Empty state is a wide bordered media frame, echoing the source article's large visual placeholders without importing source images.
- Generated cards preserve existing result URLs, status labels, download links, and retry actions.
- Install dialog is the final utility layer and keeps the existing ZIP API.

## Exact visual contract

- Paper background `#f8f8f8`; framed empty stage uses a 1px `#222` border and generous vertical space.
- Result media can use 10px radius; card footers are square and use black/white editorial bands.
- Footer utility type is 10-14px with generous vertical spacing.
- Failed and loading states must remain legible without changing API behavior.

## Responsive behavior

- Desktop results: 2 columns with stable media aspect ratios.
- Tablet: 2 columns if space permits; mobile: 1 column, no horizontal overflow.
- Dialog width is `min(560px, calc(100vw - 24px))` and action controls stack on mobile.
