# Nantian Gateway — Website & Documentation

[![CI](https://github.com/nantian-gw/website/actions/workflows/ci.yml/badge.svg)](https://github.com/nantian-gw/website/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)

Project website and documentation for [Nantian Gateway](https://github.com/nantian-gw/gateway), built with [Astro](https://astro.build) + [Starlight](https://starlight.astro.build).

## Tech Stack

| Component    | Technology                               |
|-------------|------------------------------------------|
| Framework    | Astro 6                                  |
| Docs UI     | Starlight                                |
| Styling     | Tailwind CSS v4                          |
| Language    | TypeScript                               |
| Deployment  | Cloudflare Pages                         |

## Development

```bash
npm install
npm run dev
```

The dev server runs at `http://localhost:4321`.

## Lint & Build

```bash
npm run check            # Type check
npm run lint             # ESLint + markdownlint + type check
npm test                 # Repository hardening checks
npm run setup:browser    # Install Chromium for Mermaid rendering in clean environments
npm run build            # Production build
```

`npm run build` installs the Playwright Chromium browser before running `astro build`
because Mermaid rendering in MDX uses Playwright during static generation. CI can
run `npm run build:ci` to install browser system dependencies separately and avoid
duplicate browser setup.

## Translation

Documentation is available in:

- **English** (`src/content/docs/`)
- **中文（简体）** (`src/content/docs/zh/`)

## License

Apache 2.0 — see [LICENSE](LICENSE).
