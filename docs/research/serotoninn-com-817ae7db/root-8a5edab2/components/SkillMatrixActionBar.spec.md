# SkillMatrixActionBar Specification

## Overview

- Target: Skill grid and run controls in all three public files.
- Interaction model: click-driven selection and parallel command execution.

## Source Evidence

- Section title `02. New Arrivals`: `20px/20px`, weight `500`, uppercase, `#ed3833`.
- Source uses horizontal product rails, rigid cards, micro labels, no rounded corners, and large black interludes.
- Main colors are `#fff9f7`, black, and signal red.

## Adapted Structure

- Add a full-width black `SystemBand` between source and Skill matrix.
- Band data: configured model, parallel mode, selected count; all values come from existing state/API data.
- Skill items: four-column rigid rail, `1px` black border, zero radius, minimum height `210px`.
- Each card gets a large two-digit index, name, description, version, and preservation metadata.
- Selected state: black background, off-white text, individual Skill accent as a `5px` top strip.
- Action bar: black frame with oversized bracketed generate command; retain existing button id and disabled logic.

## Responsive Behavior

- Four columns desktop, two below `900px`, one below `620px`.
- System band becomes a stacked three-row index on mobile.
