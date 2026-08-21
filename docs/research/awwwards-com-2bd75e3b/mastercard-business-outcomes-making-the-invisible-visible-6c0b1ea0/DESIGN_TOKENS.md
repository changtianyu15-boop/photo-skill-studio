# Design Tokens

## Source evidence

- Background: `rgb(248, 248, 248)`.
- Primary foreground: `rgb(34, 34, 34)`; black utility surfaces use `rgb(0, 0, 0)`.
- Secondary gray surfaces: `rgb(237, 237, 237)` and `rgb(44, 44, 44)`.
- Body: `Inter Tight`, 14px, weight 300, line-height 28px.
- Hero title: `Inter Tight`, weight 600, uppercase, desktop fluid size approximately 74px, line-height equal to size; mobile 36px/36px.
- Desktop content inset: 52px; main narrative column is approximately 930px centered in a 1425px viewport.
- Header: 54px height, transparent over `#f8f8f8`; mobile position becomes sticky.
- Hero figure image uses a 10px radius; page containers otherwise use square corners.
- Quote: desktop approximately 38.5px/50px, weight 600; mobile 20px/26px with a 20px left rule.
- Source footer height: approximately 407px desktop and 459px mobile.

## Adapted tokens

```css
--editorial-paper: #f8f8f8;
--editorial-ink: #222222;
--editorial-black: #000000;
--editorial-gray: #ededed;
--editorial-muted: #a7a7a7;
--editorial-accent: #ed3833;
--editorial-radius: 10px;
--editorial-inset: clamp(16px, 3.6vw, 52px);
--editorial-column: min(930px, calc(100vw - 2 * var(--editorial-inset)));
```

The existing app's action states use signal red and black for clarity, while the surrounding page follows the source's quiet grayscale. No source logo, font file, product imagery, or branded phrase is reused.
