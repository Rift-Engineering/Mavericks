# Tokyo Mavericks — tech stack

Single-package Next.js app for team attendance and carpool planning.

## Core

| Layer | Choice |
|--------|--------|
| **Runtime** | Node.js (LTS recommended) |
| **Framework** | [Next.js](https://nextjs.org/) 15 (App Router, React Server Components by default) |
| **UI library** | React 19 |
| **Language** | TypeScript 5 |
| **Bundler / dev** | Turbopack (`pnpm dev`) |

## Data

| Layer | Choice |
|--------|--------|
| **Database** | PostgreSQL (e.g. [Neon](https://neon.tech/) or any managed Postgres) |
| **ORM** | [Prisma](https://www.prisma.io/) 6 — schema in `prisma/schema.prisma`, migrations in `prisma/migrations/` |
| **Seed** | `prisma/seed.ts` via `pnpm prisma db seed` (uses `tsx`) |

## Auth & security

| Layer | Choice |
|--------|--------|
| **Passwords** | [bcryptjs](https://github.com/dcodeIO/bcrypt.js) (hashed, never plaintext) |
| **Sessions** | [jose](https://github.com/panva/jose) — signed JWT in HTTP-only cookie (`tm_session`) |
| **Route protection** | `src/proxy.ts` (Edge); admin-only UI/API enforced in handlers where needed |

## Styling & UI

| Layer | Choice |
|--------|--------|
| **CSS** | [Tailwind CSS](https://tailwindcss.com/) v4 with `@tailwindcss/postcss` |
| **Theme** | Dark-first (`html` uses `class="dark"`), brand tokens in `src/app/globals.css` |
| **Fonts** | [Inter](https://fonts.google.com/specimen/Inter) via `next/font/google` |

## Maps & location

| Layer | Choice |
|--------|--------|
| **Client maps** | [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript) via `@googlemaps/js-api-loader` |
| **Autocomplete** | Places (train stations / addresses) in `src/components/StationSearch.tsx` |
| **Server travel times** | [Distance Matrix API](https://developers.google.com/maps/documentation/distance-matrix) — `src/lib/maps.ts` uses `GOOGLE_MAPS_API_KEY` (server-only) |

Two keys are expected: a **restricted browser key** (`NEXT_PUBLIC_GOOGLE_MAPS_KEY`) and a **server key** for Distance Matrix (`GOOGLE_MAPS_API_KEY`).

## Charts

| Layer | Choice |
|--------|--------|
| **Dashboard charts** | [Recharts](https://recharts.org/) — `src/components/TravelChart.tsx`, stats under `/stats` |

## Tooling

| Tool | Role |
|------|------|
| **pnpm** | Package manager |
| **ESLint** | `eslint` + `eslint-config-next` |
| **Prisma CLI** | Migrations, `db seed`, `generate` |

## Environment variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing session JWTs |
| `GOOGLE_MAPS_API_KEY` | Server-only: Distance Matrix (and any server Places/Geocoding calls) |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | Browser: Maps JS embed + Places autocomplete |

Do not commit real secrets; use `.env.local` locally and your host’s env UI in production.

## Common commands

```bash
pnpm install
pnpm prisma migrate dev
pnpm prisma db seed
pnpm dev
pnpm build && pnpm start
```

## Deployment

- **Target**: Vercel, Fly.io, or any Node host that supports Next.js 15 + Postgres.
- Run `pnpm prisma migrate deploy` against production `DATABASE_URL` before or with the release.
