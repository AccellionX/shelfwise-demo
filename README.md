# Shelfwise

Inventory and book management for independent Australian bookshops. This is a **sales demo** built for a prospective client: polished, end-to-end, and fully client-side (no backend).

Demo shop: **Harbour Lane Books** · Currency: **AUD** · Dates: **en-AU**

Built by Musharaf.

## Features

- **Dashboard**: KPIs, 30-day sales chart, top sellers, slow movers, low/out-of-stock alerts
- **Catalogue**: search/filter, add/edit drawer, ISBN lookup via Open Library, CSV import/export
- **Stock Movements**: stock in/out/adjustments with full audit trail
- **Quick Sale**: POS-style cart that decrements stock and records sales
- **Reorder List**: supplier-grouped suggestions, printable purchase orders, mark as received
- **Stocktake**: guided shelf count with variance highlighting
- **Settings**: shop name, genres, locations, reset demo data

All data lives in `localStorage` via `src/lib/store.ts`, seeded on first load. The data layer is isolated so it can later swap to Supabase without touching UI code.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS + shadcn/ui-style components
- lucide-react icons, Recharts, Sonner toasts

## Run locally

```bash
# Node 20+ recommended
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

Zero config. Connect the repo or run:

```bash
npx vercel
```

Or push to GitHub and import the project in the Vercel dashboard. No environment variables required.

## Resetting the demo

Use **Settings → Reset demo data**, or clear `localStorage` key `shelfwise_demo_v1` in the browser.

## Project layout

```
src/
  app/           # Pages (dashboard, catalogue, movements, sale, reorder, stocktake, settings)
  components/    # UI + layout
  hooks/         # useStore (localStorage sync)
  lib/
    types.ts     # Domain types
    seed.ts      # 60 books, suppliers, 90 days of sales
    store.ts     # Data layer API
    isbn.ts      # Open Library lookup
    csv.ts       # Import/export helpers
```
