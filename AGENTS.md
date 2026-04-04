# AGENTS.md

## Cursor Cloud specific instructions

### Overview

Tokyo Mavericks is a single-package **Next.js 16** (App Router) web app for team attendance and carpool planning. It uses **Prisma 6 + PostgreSQL**, JWT auth (jose + bcryptjs), Tailwind CSS v4, and Google Maps APIs (optional).

### Required environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (injected as a secret) |
| `JWT_SECRET` | Any random string for signing session JWTs |

Optional: `GOOGLE_MAPS_API_KEY` (server-side Distance Matrix) and `NEXT_PUBLIC_GOOGLE_MAPS_KEY` (client-side maps). The app runs without these but maps/carpool optimisation won't work.

### Quick reference commands

See `STACK.md` and `package.json` scripts for full details. Key commands:

- **Install**: `pnpm install`
- **Migrate**: `pnpm prisma migrate dev`
- **Seed**: `pnpm prisma db seed` (creates 20 users + 6 sessions; admin login: `admin@mavericks.com` / `mavericks123`)
- **Dev server**: `pnpm dev` (Turbopack, port 3000)
- **Lint**: `pnpm lint`
- **Build**: `pnpm build`

### Non-obvious caveats

- **No local PostgreSQL needed.** The `DATABASE_URL` secret points to a Neon-hosted (remote) PostgreSQL instance, so there is no need to start a local PostgreSQL server.
- **pnpm build scripts**: The `pnpm.onlyBuiltDependencies` field in `package.json` allowlists native build scripts for `@prisma/client`, `@prisma/engines`, `esbuild`, `prisma`, `sharp`, and `unrs-resolver`. Without this, `pnpm install` will skip postinstall hooks and Prisma Client won't be generated.
- **Prisma deprecation warning**: The `package.json#prisma` config style is deprecated in Prisma 7; ignore the warning for now.
- The `DATABASE_URL` secret points to a Neon-hosted PostgreSQL instance. Migrations are already applied; just run `pnpm prisma db seed` to populate data if the DB is empty.
- The `.env` file is gitignored. A local `.env` is created during setup with `DATABASE_URL` and `JWT_SECRET`. The `DATABASE_URL` secret from the environment takes precedence when set.
