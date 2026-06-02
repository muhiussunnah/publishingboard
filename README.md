# Famies · Publiceringsbord 🌍

> **Plan, approve and publish — all in one place.**
> A fully dynamic, bilingual (🇸🇪 Svenska / 🇬🇧 English) publishing & sales board for the
> Famies family-events platform. Built with **Next.js 16** + **Supabase**.

This is a 100× redesign of the static `famies-publiceringsbord` demo — same features, real
persistence, real-time-ready, and a premium brand UI in the Famies palette
(**white · pink `#ff3d7f` · green `#12b886`**, no black) with **Fraunces / Sora / JetBrains Mono** type.

---

## ✨ Features

All eight workspaces from the original board, now dynamic:

| View | Swedish | What it does |
|------|---------|--------------|
| **Today** | Idag | Overdue items, today's to-dos, next 7 days |
| **Week calendar** | Veckokalender | 7-day planner with week navigation, click-to-create |
| **Customers** | Kunder | B2B customers (CRM): package, value, mailbox/video quota |
| **Events** | Event | Family events with organizer, address, image |
| **City view** | Stadsvy | Publications grouped by Stockholm-area kommun |
| **Video library** | Videobibliotek | Reusable video assets, categorized & searchable |
| **Pipeline** | Pipeline | Drag-and-drop sales Kanban with dialogue log |
| **All publications** | Alla publiceringar | Filter by type / status, full-text search |

Plus:

- 🔁 **Full CRUD** on publications, customers, videos and leads — via React Server Actions.
- 🗓️ **Auto-distribute year plan** — generate a year of draft slots in one click.
- 🎯 **Age targeting** (0–12), workflow status (draft → pending → approved → published) with **overdue detection**.
- 🌐 **Instant bilingual toggle** — every label, status and stage translates live; choice is remembered.
- 💸 Live KPI stats (overdue, pending, approved, live, customers, pipeline value).
- 🎨 Premium, animated UI (Framer Motion), responsive, accessible.

---

## 🧱 Tech stack

- **Next.js 16** (App Router, Server Actions, Turbopack)
- **React 19**
- **Supabase** (Postgres) — with a zero-config **local JSON fallback** for instant dev
- **Tailwind CSS v4**
- **Framer Motion**, **lucide-react**

---

## 🚀 Getting started

```bash
npm install
npm run dev
# → http://localhost:3000
```

That's it. With no environment variables, the board runs **fully dynamic on a local JSON
store** (`.data/db.json`), seeded with demo data. Create, edit, drag and delete — it all persists.

The header badge shows the active backend: **Demo mode (local storage)** or **Live (Supabase)**.

---

## 🔌 Switching to Supabase (production)

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run [`supabase/schema.sql`](supabase/schema.sql).
3. Copy `.env.example` → `.env.local` and fill in:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=ey...
   SUPABASE_SERVICE_ROLE_KEY=ey...     # server-only, never exposed
   ```

4. Restart `npm run dev`. The app **auto-detects** the keys and switches from JSON to Supabase —
   no code changes. The data layer is a single interface (`src/lib/data/store.js`) with two
   interchangeable backends.

> The schema uses a pragmatic document model (`id + jsonb data` per table) so the flexible
> publication shapes round-trip cleanly. All writes happen server-side with the service-role
> key, so RLS stays locked by default.

---

## 📁 Project structure

```
src/
  app/
    layout.js          # fonts, language cookie, i18n provider
    page.js            # server component → loads data → <Board/>
    actions.js         # 'use server' — all CRUD + distribute
    globals.css        # design tokens (brand palette, type, components)
  components/
    Board.jsx          # client orchestrator + context (data, helpers, mutators)
    Header / Stats / Tabs
    views/             # 8 workspaces
    cards/  modals/  ui/
  lib/
    domain.js          # enums, brand colors, kommuner
    format.js          # dates, money, lifecycle predicates
    i18n/              # sv + en dictionaries, provider, hook
    data/              # store selector, jsonStore, supabaseStore, seed
supabase/schema.sql    # one-paste Postgres schema
```

---

## ☁️ Deploy

Deploy to **Vercel** in minutes: import the repo, add the three Supabase env vars, ship.
The board is server-rendered on demand and ready for production.

---

Built with ❤️ for **Famies** — *aktiviteter för hela familjen.*
