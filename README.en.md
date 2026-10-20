# Typography Playground

[한국어](README.md) · **English**

Two small type tools in one static site: a Unicode text styler you can paste anywhere, and a kinetic typography canvas that renders animated lettering and exports it as PNG or GIF.

**Live:** https://typography-playground.seungwoo7050.workers.dev

## What it does

| Page                                | What you do                                                                                                                                                                                                                                                                         |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Unicode generator** (`/`)         | Type Latin text and get it in 19 Unicode styles (Bold, Italic, Script, Gothic, Double-Struck, Bubble, Square, Fullwidth, Small Caps, Superscript/Subscript, Strikethrough, Underline, Zalgo). Copy any card with one click — it is plain text, so it works in social bios and chats |
| **Kinetic typography** (`/kinetic`) | Type a word, pick one of 41 fonts (Latin and Korean), choose an effect (Gradient Fill, Outline Stroke, Glitch, Liquid Wave), tune its parameters, and export a PNG still or an animated GIF                                                                                         |

- **No backend, no account, no tracking.** Everything runs in the browser.
- **Fonts are self-hosted** from the Google Fonts catalog (SIL OFL). Each font ships with its license in `public/fonts/`.
- Glyphs are drawn from the font outlines (opentype.js); Liquid Wave renders through WebGL, and GIF encoding runs in a Web Worker so the page stays responsive.
- Reduce Motion is respected (magnetic and parallax effects follow the system setting).

## Run it

Requires Node `24.21.0` and npm `11.19.0` (`.nvmrc`, `package.json` `engines`).

```bash
npm ci
npm run dev        # http://localhost:3100
```

| Command                       | What it does                                                              |
| ----------------------------- | ------------------------------------------------------------------------- |
| `npm run lint`                | ESLint                                                                    |
| `npm run typecheck`           | TypeScript, no emit                                                       |
| `npm run test`                | Unit tests (Vitest)                                                       |
| `npm run build`               | Static export to `out/`                                                   |
| `npm run preview`             | Build, then serve `out/` on port 3100                                     |
| `npm run test:e2e:production` | Build, then run Playwright against the served `out/` (desktop and mobile) |

CI runs lint → typecheck → unit tests → build → e2e on every pull request and `main` push, and deploys `main` to Cloudflare when everything passes.

## Deploy

Hosting is Cloudflare Workers static assets (`wrangler.toml`, `[assets] directory = "./out"`). No Worker script — only the built files are uploaded.

```bash
npm run build
npx --yes wrangler@4.146.0 deploy
```

In CI the same command runs with the `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repository secrets.

## How it's built

- **Next.js 16** static export (`output: "export"`, `images.unoptimized`), **React 19**, **Tailwind CSS 4**.
- **Unicode styles are data**: each style in `src/features/unicode-generator/data/styles/` maps characters to Unicode code points; the registry renders every style from the same input.
- **Kinetic engine**: effects register themselves with a typed parameter schema (`src/features/kinetic-engine/effects/`), and the control panel is generated from that schema.

```
src/app/                         pages (/, /kinetic) and layout
src/features/unicode-generator/  style data, transform, cards
src/features/kinetic-engine/     font loading, glyph outlines, effects, PNG/GIF export
public/fonts/                    self-hosted fonts and their licenses
scripts/                         font download scripts (fetch-fonts, fetch-kinetic-fonts)
tests/e2e/                       Playwright tests
```
