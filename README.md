# Tri-Cities Vote

## Feature flags

The Next.js frontend reads a handful of optional toggles from the environment. Current flags:

- `NEXT_PUBLIC_SHOW_UNCONTESTED` (default: unset/`false`) – when set to `true`, uncontested races remain visible in list views. By default only contested races are listed, though the underlying candidate pages stay live either way.
- `NEXT_PUBLIC_HIDE_PARTIAL_TCV_RESPONSES` (default: unset/`true`) – hides Tri-Cities Vote Q&A answers in contested races until every visible candidate has responded. Set to `false` to always surface those answers.
- `NEXT_PUBLIC_TCV_PARTIAL_HIDE_EXCEPTIONS` (default: empty; seeded with `richland-city-council-position-3`) – comma-separated list of race identifiers (slug, ID, or title) that should always surface Q&A answers even if some candidates have not responded.

## Social previews

Run `npm run generate:og` after updating race rosters or candidate content to rebuild the share-card images. The command runs `next build`, spins up the production server on port `3110`, captures the `/og/...` templates with Playwright, and writes PNGs to `public/og/…`. Commit the refreshed assets alongside the data changes they represent.
If this is your first time using Playwright locally, install the browser binaries once via `npx playwright install chromium` before running the command.
