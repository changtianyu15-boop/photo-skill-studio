# AppHeader Specification

## Overview

- Target: header structure in `public/index.html` and header rules in `public/styles.css`.
- Screenshot: `docs/design-references/serotoninn-com-817ae7db/root-8a5edab2/desktop-1440.png`.
- Interaction model: static utility commands; sticky only in the adapted operational workspace.

## Source Computed Styles

- Header wrapper: width `1440px`, transparent background, `10px` Thunder, black text.
- Source page horizontal inset: `35px` desktop, `32px` tablet, approximately `16px` mobile.
- Primary identity uses uppercase, compressed black display type.
- Commands are flat, unrounded, micro-sized, and often enclosed by square brackets.

## Adapted Structure

- Left: `[ PSS ]` mark and `PHOTO SKILL STUDIO` identity.
- Center: compact route label `IMAGE EDITORIAL SYSTEM / 01` on desktop only.
- Right: existing API status and `[ INSTALL SKILL ]` command.
- Height: `64px` desktop, `56px` mobile; `1px` bottom border; zero radius.

## Responsive Behavior

- At `620px`, hide center route label and API status; keep identity and icon-only install command.
- No horizontal overflow at `390px`.
