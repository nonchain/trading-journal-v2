# TV Trade Journal

Cross-browser trade journaling extension for TradingView (Chrome / Firefox / Edge).

## Stack

- WXT + React + TypeScript
- Tailwind CSS + shadcn/ui
- TanStack Table, ECharts, React Hook Form + Zod
- i18n: English + Persian (RTL)
- Persistence: `browser.storage.local` via `lib/storage.ts` (`journalRepo`)

## Develop

```bash
npm install
npm run dev          # Chrome
npm run dev:firefox  # Firefox
```

Load the unpacked extension from `.output/chrome-mv3` (or the Firefox output).

## Surfaces

| Surface   | Path                         | Purpose                          |
|-----------|------------------------------|----------------------------------|
| Options   | `entrypoints/options`        | Full dashboard                   |
| Popup     | `entrypoints/popup`          | Quick trade entry + recent list  |
| Sidepanel | `entrypoints/sidepanel`      | Persistent journal while trading |
| Content   | `entrypoints/content.tsx`    | Floating “Log Trade” on TV charts|

## Swap persistence later

UI talks only to `journalRepo` in `lib/storage.ts`. Replace that module to point at REST/Supabase without touching components.
