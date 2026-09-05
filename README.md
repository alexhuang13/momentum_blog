# Momentum in large-batch training

**Polyak enlarges the critical batch size, Nesterov improves data efficiency.**

Research blog by Jia-Nan Wang, Zixun Huang, Kairui Li, and Lei Wu.

- [English website](https://alexhuang13.github.io/momentum_blog/)
- [中文版](https://alexhuang13.github.io/momentum_blog/zh.html)
- [Paper](https://alexhuang13.github.io/momentum_blog/assets/paper.pdf)
- [Additional public site](https://momentum-scaling-notes.zixunh.chatgpt.site/)

The article follows the manuscript's introduction, risk stability, risk dynamics, data scaling, mechanism, numerical validations, and conclusion. English prose largely retains the manuscript's wording; the Chinese page follows the same text. The layout is adapted from FlowBalance-Blog.

## Local development

Requires Node.js 22.12 or later.

```bash
npm ci
npm run dev
```

Open http://127.0.0.1:4173/ or http://127.0.0.1:4173/zh.html.

```bash
npm run build
```

The self-contained static website is generated in `dist/client/`, including local fonts, prerendered equations, vector figures, and the paper PDF. Relative asset paths support deployment under `/momentum_blog/`.

## Editing

- `articles/en.html` and `articles/zh.html`: article text. Inline math uses `\(...\)` and display math uses `\[...\]`.
- `scripts/generate.mjs`: shared page shell and author metadata. Generates `index.html` and `zh.html`.
- `style.css`: typography, layout, and light/dark themes.
- `script.js`: interactive phase diagram, reading progress, and theme preference.
- `public/assets/`: paper and original figures.
- `public/screenshot.jpeg`: desktop preview.

The interactive diagram implements the manuscript's batch-size-dependent data-scaling theorem. It plots optimized asymptotic exponents, uses solid lines, and preserves a vertical-to-horizontal unit-length ratio of 1.2:1. The default parameters are `s = 0.3`, `beta = 4`, and `b = 0.4`.

## Deployment

Pushes to `main` run `.github/workflows/pages.yml`, build the website, and deploy `dist/client/` to GitHub Pages. The site is public and requires no login.

The `.openai/hosting.json` file identifies the existing public Sites deployment. GitHub Pages does not require any Sites credentials.

## Validation

`npm run build` validates all equations. With a local preview running, `python scripts/visual-check.py` uses Playwright and installed Chrome to check the chart's exponents, fixed axis ratio, solid curves, controls, language switching, paper links, footer, and responsive layouts. Playwright is needed only for this optional browser check.
