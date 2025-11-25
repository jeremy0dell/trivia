import { test, expect } from "@playwright/test";

test.describe("Player Flow", () => {
  test("can view home page", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText("Join a Game")).toBeVisible();
    await expect(page.getByText("Admin")).toBeVisible();
  });

  test("can navigate to join page", async ({ page }) => {
    await page.goto("/");

    await page.click("text=Join a Game");

    await expect(page).toHaveURL("/join");
    // Use actual placeholders from the join page
    await expect(page.getByPlaceholder("ABC123")).toBeVisible();
  });

  test("can navigate to admin page", async ({ page }) => {
    await page.goto("/");

    await page.click("text=Admin");

    // On localhost, dev mode bypasses auth so we go directly to admin dashboard
    await expect(page).toHaveURL("/admin");
  });

  test("shows error for invalid game code", async ({ page }) => {
    await page.goto("/join");

    // Fill the game code first - team name only appears after valid game is found
    const codeInput = page.getByPlaceholder("ABC123");
    await codeInput.fill("XXXXXX");

    // Should show "No game found with this code."
    await expect(page.getByText(/no game found/i)).toBeVisible({
      timeout: 10000,
    });
  });

  test("join form validates required fields", async ({ page }) => {
    await page.goto("/join");

    // Try to submit without valid game code
    const joinButton = page.getByRole("button", { name: /join game/i });

    // Button should be disabled (game must be found first)
    await expect(joinButton).toBeDisabled();
  });

  test("game code input accepts uppercase", async ({ page }) => {
    await page.goto("/join");

    const codeInput = page.getByPlaceholder("ABC123");
    await codeInput.fill("music1");

    // Should convert to uppercase
    await expect(codeInput).toHaveValue("MUSIC1");
  });
});

test.describe("Player in Lobby", () => {
  // NOTE: These tests require seeded database with MUSIC1 game
  // Run `npm run seed` before running these tests

  test("can join existing game with valid code", async ({ page }) => {
    await page.goto("/join");

    // Enter valid game code
    const codeInput = page.getByPlaceholder("ABC123");
    await codeInput.fill("MUSIC1");

    // Wait for game to be found - team name input appears
    await expect(page.getByPlaceholder("The Mozartians")).toBeVisible({
      timeout: 10000,
    });

    // Enter unique team name to avoid conflicts
    const uniqueTeamName = `E2E Team ${Date.now()}`;
    await page.fill('input[placeholder="The Mozartians"]', uniqueTeamName);
    await page.click('button:has-text("Join Game")');

    // Should redirect to play page
    await expect(page).toHaveURL(/\/play\/MUSIC1/i, { timeout: 10000 });
  });
});
