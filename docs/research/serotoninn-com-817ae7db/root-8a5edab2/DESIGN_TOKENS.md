# Design Tokens

## Extracted Source Values

- Page background: `rgb(255, 249, 247)` / `#fff9f7`.
- Foreground: `rgb(0, 0, 0)` / `#000000`.
- Signal red: `rgb(237, 56, 51)` / `#ed3833`.
- Display family: `Thunder, sans-serif` (proprietary source font; do not copy).
- Utility family: `"PP Fraktion Mono", monospace` (proprietary source font; do not copy).
- Desktop hero title: `80px`, `800`, `64px` line-height, uppercase.
- Section heading: `20px`, `500`, `20px` line-height, uppercase, signal red.
- Micro labels/body utilities: approximately `10px`.
- Desktop horizontal inset: `35px`; tablet `32px`; mobile approximately `16px`.
- Source controls use zero border radius and bracket typography rather than pill shapes.
- Source body is an off-white editorial field broken by full-width black bands and high-impact image stages.

## Applied Route-Scoped Tokens

- `--paper: #fff9f7`
- `--surface: #fffdfc`
- `--ink: #090909`
- `--signal: #ed3833`
- `--muted: #77706e`
- `--line: rgba(9, 9, 9, 0.26)`
- `--display`: `Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif`
- `--mono`: `ui-monospace, SFMono-Regular, Consolas, monospace`
- Desktop content inset: `32px`; mobile: `16px`.
- Border radius: `0` for primary panels, controls, cards, dialog, and buttons.
- Display typography is limited to page identity, section titles, and primary command text; operational content remains readable Chinese UI text.

No remote source fonts or brand assets are downloaded.
