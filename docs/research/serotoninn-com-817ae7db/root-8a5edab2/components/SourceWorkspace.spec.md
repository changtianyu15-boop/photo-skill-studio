# SourceWorkspace Specification

## Overview

- Target: source section in `public/index.html` and source/upload/settings rules in `public/styles.css`.
- Interaction model: click or drag/drop photo; existing preview and form controls remain unchanged.

## Source Evidence

- Source background: `#fff9f7`.
- Hero title: `80px/64px`, `800`, uppercase, compressed display face.
- Source hero is full width and visually dominated by a central image stage.
- High-impact copy is offset and overlaps imagery; utility controls remain micro-sized.

## Adapted Structure

- Section eyebrow: `01. INPUT PHOTO` in red mono uppercase.
- Section title: `SOURCE / IMAGE` in condensed uppercase display type, clamp `42px–76px` without viewport-based font scaling.
- Two-column desktop stage: image upload occupies roughly `66%`, settings roughly `34%`.
- Upload stage: minimum height `500px`, black border, zero radius, off-white surface; selected image uses `object-fit: contain` against black.
- Empty state copy stays centered but compact.
- Settings form is separated by hard black rules; controls are white, square, and `46px` high.

## Responsive Behavior

- Below `900px`, stack image stage and settings.
- At `390px`, upload height `280px`, title wraps intentionally, all controls remain full width.
