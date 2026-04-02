import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import ws from "ws";

/**
 * Base URL tweaks (TCP + Neon WS). Does not add Prisma TCP pool params — see tcpDatabaseUrl.
 */
function baseDatabaseUrl(): string | undefined {
  const raw = process.env.DATABASE_URL;
  if (!raw) return undefined;
  try {
    const u = new URL(raw.replace(/^postgresql:/i, "http:"));
    if (!u.searchParams.has("connect_timeout")) {
      u.searchParams.set("connect_timeout", "30");
    }
    return u.toString().replace(/^http:/i, "postgresql:");
  } catch {
    return raw;
  }
}

/**
 * Prisma’s default TCP pool against a remote DB (non-Neon): cap size and wait time so concurrent
 * serverless isolates don’t exhaust Postgres max connections.
 */
function tcpDatabaseUrl(): string | undefined {
  const base = baseDatabaseUrl();
  if (!base) return undefined;
  try {
    const u = new URL(base.replace(/^postgresql:/i, "http:"));
    if (!u.searchParams.has("pool_timeout")) {
      u.searchParams.set("pool_timeout", "30");
    }
    if (!u.searchParams.has("connection_limit")) {
      const limit = process.env.DATABASE_CONNECTION_LIMIT ?? "5";
      u.searchParams.set("connection_limit", limit);
    }
    return u.toString().replace(/^http:/i, "postgresql:");
  } catch {
    return base;
  }
}

function isNeonHost(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const u = new URL(url.replace(/^postgresql:/i, "http:"));
    return /neon\.tech$/i.test(u.hostname);
  } catch {
    return false;
  }
}

/**
 * Neon + Vercel: Prisma’s TCP pool often exhausts (P2024). Use Neon’s serverless driver + adapter
 * (WebSockets to Neon’s pooler) instead.
 * - Opt out: PRISMA_USE_NEON_DRIVER=0
 * - Force on (non-neon.tech host): PRISMA_USE_NEON_DRIVER=1
 */
function createPrismaClient(): PrismaClient {
  const raw = process.env.DATABASE_URL;
  const flag = process.env.PRISMA_USE_NEON_DRIVER;
  const useNeonDriver =
    flag === "1" || (flag !== "0" && isNeonHost(raw));

  const log =
    process.env.NODE_ENV === "development" ? (["query", "error", "warn"] as const) : (["error"] as const);

  if (useNeonDriver && raw) {
    neonConfig.webSocketConstructor = ws;
    const connectionString = baseDatabaseUrl() ?? raw;
    const adapter = new PrismaNeon({ connectionString });
    return new PrismaClient({ adapter, log: [...log] });
  }

  return new PrismaClient({
    datasources: { db: { url: tcpDatabaseUrl() } },
    log: [...log],
  });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

/** Always attach so Next.js never creates multiple clients per isolate (dev HMR + prod bundling edge cases). */
globalForPrisma.prisma = prisma;
