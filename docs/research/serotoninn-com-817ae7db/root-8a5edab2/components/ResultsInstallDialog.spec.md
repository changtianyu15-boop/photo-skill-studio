# ResultsInstallDialog Specification

## Overview

- Target: results and install dialog in all public files.
- Interaction model: per-result retry/download; modal Skill installation.

## Source Evidence

- Source alternates dense image rails with large quiet off-white fields.
- Editorial media uses hard edges, minimal metadata, and black/red micro labels.
- Modal language uses white surfaces, black borders, small utility text, and bracketed commands.

## Adapted Structure

- Results heading: red `03. OUTPUT ARCHIVE` eyebrow plus large `GENERATED / EDITIONS` display title.
- Empty state: large outlined black field with oversized `NO OUTPUT YET` copy and one micro note.
- Results: two-column image grid, zero-radius cards, black footer, white metadata, square icon controls.
- Loading state uses a red top border and square status indicator rather than a rounded spinner.
- Install dialog: off-white square panel, `2px` black border, black title rail, square package drop zone, bracketed install command.

## Responsive Behavior

- Results collapse to one column below `720px`.
- Dialog remains within `calc(100vw - 24px)` and actions stack below `460px`.
