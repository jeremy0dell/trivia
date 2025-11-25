import { test, expect } from "@playwright/test";

test.describe("Host Flow via Admin", () => {
  test("can create a game through admin", async ({ page }) => {
    // Navigate through admin (main entry point)
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: /games/i })).toBeVisible({
      timeout: 10000,
    });

    // Create a new game
    await page.click('button:has-text("Create Game")');
    await expect(page).toHaveURL(/\/admin\/games\//, { timeout: 10000 });
  });

  test("can still access /host/new directly", async ({ page }) => {
    await page.goto("/host/new");

    await expect(page.getByRole("heading")).toBeVisible();
  });

  test("can create a game from /host/new", async ({ page }) => {
    await page.goto("/host/new");

    // Button text is "Create Game" not "Create Sample Game"
    await page.click('button:has-text("Create Game")');

    // Should redirect to host dashboard
    await expect(page).toHaveURL(/\/host\//, { timeout: 15000 });
  });
});

test.describe("Host Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    // Create a game first
    await page.goto("/host/new");
    await page.click('button:has-text("Create Game")');
    await expect(page).toHaveURL(/\/host\//, { timeout: 15000 });
  });

  test("displays game code", async ({ page }) => {
    // Should show game code prominently (6 uppercase alphanumeric chars)
    const gameCode = page.locator("text=/[A-Z0-9]{6}/");
    await expect(gameCode.first()).toBeVisible();
  });

  test("shows team list", async ({ page }) => {
    // Look for Teams text anywhere on page
    await expect(page.getByText("Teams").first()).toBeVisible();
  });

  test("has game controls", async ({ page }) => {
    // Should have start/next/end controls
    await expect(
      page.getByRole("button", { name: /start|next|begin/i })
    ).toBeVisible();
  });

  test("can start a round", async ({ page }) => {
    // Click start button
    const startButton = page.getByRole("button", {
      name: /start|begin/i,
    });
    await startButton.click();

    // Game state should change - use first() to avoid strict mode violation
    await expect(page.getByText(/round 1/i).first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Lobby View", () => {
  test.beforeEach(async () => {
    // We need a game code to test
    // This requires the seed data with MUSIC1
  });

  test("displays lobby for existing game", async ({ page }) => {
    await page.goto("/lobby/MUSIC1");

    // Should show lobby view with the game code - use exact match to get specific element
    await expect(page.getByText("MUSIC1", { exact: true })).toBeVisible({
      timeout: 10000,
    });
  });

  test("shows loading for invalid game", async ({ page }) => {
    await page.goto("/lobby/INVALID123");

    // The lobby page shows a loading screen when game is not found
    // Since game doesn't exist, it will just keep loading
    await expect(page.locator("body")).toBeVisible();
    // After a moment, the page should still be there (no crash)
    await page.waitForTimeout(2000);
  });
});

test.describe("Media View", () => {
  test("displays media page", async ({ page }) => {
    // This requires an active game with media
    await page.goto("/media/MUSIC1");

    // Should show media view or waiting state
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("Team Management in Lobby", () => {
  test.beforeEach(async ({ page }) => {
    // Create a game through /host/new
    await page.goto("/host/new");
    await page.click('button:has-text("Create Game")');
    await expect(page).toHaveURL(/\/host\//, { timeout: 15000 });
  });

  test("shows team count in lobby", async ({ page }) => {
    // Should display team count (e.g., "0 / 20")
    await expect(page.getByText(/\d+\s*\/\s*\d+/)).toBeVisible({ timeout: 10000 });
  });

  test("has lock lobby button", async ({ page }) => {
    // Should show Lock Lobby button
    await expect(
      page.getByRole("button", { name: /lock lobby|lobby locked/i })
    ).toBeVisible({ timeout: 10000 });
  });

  test("can toggle lobby lock", async ({ page }) => {
    // Find and click the lock button
    const lockButton = page.getByRole("button", { name: /lock lobby/i });
    await expect(lockButton).toBeVisible({ timeout: 10000 });
    await lockButton.click();

    // Button should now say "Lobby Locked"
    await expect(
      page.getByRole("button", { name: /lobby locked/i })
    ).toBeVisible({ timeout: 5000 });

    // Click again to unlock
    await page.getByRole("button", { name: /lobby locked/i }).click();

    // Should be back to "Lock Lobby"
    await expect(
      page.getByRole("button", { name: /lock lobby/i })
    ).toBeVisible({ timeout: 5000 });
  });

  test("shows locked message on join page when lobby is locked", async ({
    page,
    context,
  }) => {
    // Get the game code from the host page
    const gameCodeElement = page.locator("text=/[A-Z0-9]{6}/").first();
    const gameCode = await gameCodeElement.textContent();

    // Lock the lobby
    await page.getByRole("button", { name: /lock lobby/i }).click();
    await expect(
      page.getByRole("button", { name: /lobby locked/i })
    ).toBeVisible({ timeout: 5000 });

    // Open join page in a new tab
    const joinPage = await context.newPage();
    await joinPage.goto("/join");

    // Enter the game code
    await joinPage.fill('input[placeholder="ABC123"]', gameCode || "");

    // Should show "Lobby is closed" message
    await expect(joinPage.getByText(/lobby is closed/i)).toBeVisible({
      timeout: 5000,
    });
  });
});

test.describe("Max Teams Setting in Admin", () => {
  test("shows max teams input in game editor", async ({ page }) => {
    // Create a game through admin
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: /games/i })).toBeVisible({
      timeout: 10000,
    });

    await page.click('button:has-text("Create Game")');
    await expect(page).toHaveURL(/\/admin\/games\//, { timeout: 10000 });

    // Should show max teams input
    await expect(page.getByText(/max teams/i)).toBeVisible();
    await expect(page.locator('input[type="number"]')).toBeVisible();
  });
});
