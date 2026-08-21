# EditorialHeaderHero Specification

## Overview
- Target file: `photo-skill-studio/public/index.html` and `public/styles.css`
- Interaction model: static header plus click-driven install action
- Source evidence: 54px utility header, centered 74px uppercase title on desktop, 36px title on mobile.

## Adapted DOM

`header.topbar` contains `[ PSS ]`, product name, route label, API state, and the existing `INSTALL SKILL` button. The first section keeps `01. INPUT PHOTO`, adds `MAKE THE SOURCE VISIBLE` as the primary heading, then places the upload stage and settings.

## Exact visual contract

- Background `#f8f8f8`; ink `#222`; no gradients.
- Header height 54-64px, full width, transparent/light background, no shadow.
- Desktop content inset 52px; mobile inset 16px.
- Display heading uses the available condensed display fallback or `Inter Tight`-like sans, uppercase, weight 600-800, desktop 64-74px, mobile 36-44px.
- Upload media keeps a 10px radius like the source article hero image; the app's controls stay square.
- Hero title is centered or left-balanced at desktop, with a compact metadata line above and route/action labels using 10-12px microtype.

## Responsive behavior

- 1440px: source stage and settings form a wide editorial composition.
- 768px: preserve wide title hierarchy and reduce side inset; controls may stack.
- 390px: one-column stage/settings, title wraps cleanly, install action becomes icon-first.
