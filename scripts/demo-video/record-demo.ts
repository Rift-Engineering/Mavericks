/**
 * Headless screen recording of Tokyo Mavericks for a narrated walkthrough video.
 * Run from repo root with the dev server started separately, or use ./build-demo-video.sh
 */
import { chromium } from "playwright";
import { mkdir, readdir } from "fs/promises";
import { join } from "path";

const BASE = process.env.DEMO_BASE_URL ?? "http://127.0.0.1:3000";
const ADMIN_EMAIL = process.env.DEMO_ADMIN_EMAIL ?? "admin@mavericks.com";
const ADMIN_PASSWORD = process.env.DEMO_ADMIN_PASSWORD ?? "mavericks123";

const SESSION_PUBLISHED = process.env.DEMO_SESSION_PUBLISHED_ID ?? "seed-session-4";
const SESSION_OPTIMISED = process.env.DEMO_SESSION_OPTIMISED_ID ?? "seed-session-5";

const OUT_DIR = join(process.cwd(), "scripts/demo-video/output");

async function wait(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

async function login(page: import("playwright").Page) {
  const res = await page.context().request.post(`${BASE}/api/auth/login`, {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  if (!res.ok()) {
    throw new Error(`Login API failed: ${res.status()} ${await res.text()}`);
  }
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
}

export async function recordDemo(): Promise<string> {
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    args: ["--window-size=1280,720"],
  });

  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: OUT_DIR, size: { width: 1280, height: 720 } },
  });

  const page = await ctx.newPage();

  try {
    await login(page);
    await wait(2500);

    // Home — upcoming sessions & RSVP
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
    await wait(4500);

    // All sessions — tabs and status badges
    await page.goto(`${BASE}/sessions`, { waitUntil: "networkidle" });
    await wait(5000);

    // Published session — map, attendees, carpool when applicable
    await page.goto(`${BASE}/sessions/${SESSION_PUBLISHED}`, { waitUntil: "networkidle" });
    await wait(6500);

    // Stats — travel charts
    await page.goto(`${BASE}/stats`, { waitUntil: "networkidle" });
    await wait(5500);

    // Attendance roster
    await page.goto(`${BASE}/attendance`, { waitUntil: "networkidle" });
    await wait(5500);

    // Help guide
    await page.goto(`${BASE}/help`, { waitUntil: "networkidle" });
    await wait(6000);

    // New session (admin)
    await page.goto(`${BASE}/sessions/new`, { waitUntil: "networkidle" });
    await wait(4500);

    // Carpool optimisation (optimised session shows admin tools)
    await page.goto(`${BASE}/sessions/${SESSION_OPTIMISED}/assignments`, {
      waitUntil: "networkidle",
    });
    await wait(7000);

    // User management
    await page.goto(`${BASE}/admin/users`, { waitUntil: "networkidle" });
    await wait(5000);

    // Return home, log out
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
    await wait(2000);
    const logout = await page.context().request.post(`${BASE}/api/auth/logout`);
    if (!logout.ok()) {
      throw new Error(`Logout failed: ${logout.status()}`);
    }
    await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
    await wait(2500);
  } finally {
    await ctx.close();
    await browser.close();
  }

  const files = await readdir(OUT_DIR);
  const webm = files.find((f) => f.endsWith(".webm"));
  if (!webm) {
    throw new Error(`No WebM found in ${OUT_DIR}`);
  }
  return join(OUT_DIR, webm);
}

async function main() {
  const path = await recordDemo();
  console.log(path);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
