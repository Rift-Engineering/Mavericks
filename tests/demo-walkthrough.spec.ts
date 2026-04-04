import { test, expect } from "@playwright/test";

test("app walkthrough (recorded)", async ({ page }) => {
  const pause = async (ms: number) => page.waitForTimeout(ms);

  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Tokyo Mavericks" })).toBeVisible();
  await pause(800);

  await page.getByLabel("Email").fill("admin@mavericks.com");
  await pause(300);
  await page.getByLabel("Password").fill("mavericks123");
  await pause(300);
  await page.getByRole("button", { name: "Sign in" }).click();

  await page.waitForURL("**/");
  await expect(page.getByRole("heading", { name: /Hello,/ })).toBeVisible();
  await pause(1200);

  // Sessions list
  await page.goto("/sessions");
  await expect(page.getByRole("heading", { name: "Sessions" })).toBeVisible();
  await pause(1200);

  // Open first session details (if any sessions are rendered as links)
  const firstSessionLink = page.locator('a[href^="/sessions/"]').first();
  if (await firstSessionLink.count()) {
    await firstSessionLink.click();
    await expect(page).toHaveURL(/\/sessions\/[^/]+$/);
    await pause(1200);

    // Try to RSVP if there is an RSVP section/button
    const rsvpButton = page.getByRole("button", { name: /RSVP|Update RSVP|Save RSVP/i });
    if (await rsvpButton.count()) {
      // best-effort: just scroll through the page and save if possible
      await page.mouse.wheel(0, 900);
      await pause(800);
      await page.mouse.wheel(0, 900);
      await pause(800);
      await page.mouse.wheel(0, -1200);
      await pause(800);
      await rsvpButton.first().click().catch(() => {});
      await pause(1200);
    }

    // Carpool assignments page (admin feature)
    const assignmentsLink = page.getByRole("link", { name: /Assignments|Carpool/i });
    if (await assignmentsLink.count()) {
      await assignmentsLink.first().click();
    } else {
      // fallback direct navigation if route exists
      const url = page.url();
      await page.goto(`${url}/assignments`);
    }
    await pause(1200);
  }

  // Attendance page
  await page.goto("/attendance");
  await expect(page.getByRole("heading", { name: /Attendance/i })).toBeVisible();
  await pause(1200);

  // Stats page
  await page.goto("/stats");
  await expect(page.getByRole("heading", { name: /Stats|Statistics/i })).toBeVisible();
  await pause(1200);

  // Admin users page
  await page.goto("/admin/users");
  await expect(page.getByRole("heading", { name: /Users/i })).toBeVisible();
  await pause(1200);

  // Help
  await page.goto("/help");
  await expect(page.getByRole("heading", { name: /Help|FAQ/i })).toBeVisible();
  await pause(1200);
});

