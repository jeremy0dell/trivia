import { test, expect } from "@playwright/test";

// On localhost (where tests run), dev mode bypasses authentication
// so we test the authenticated state directly

test.describe("Admin Dev Mode", () => {
  test("bypasses auth on localhost and shows DEV MODE badge", async ({ page }) => {
    await page.goto("/admin");

    // Should go directly to admin dashboard (dev mode bypasses auth)
    await expect(page.getByRole("heading", { name: /games/i })).toBeVisible({
      timeout: 10000,
    });

    // Should show DEV MODE badge
    await expect(page.getByText("DEV MODE")).toBeVisible();
  });

  test("does not show logout button in dev mode", async ({ page }) => {
    await page.goto("/admin");

    await expect(page.getByRole("heading", { name: /games/i })).toBeVisible({
      timeout: 10000,
    });

    // Logout button should NOT be visible in dev mode
    await expect(page.getByRole("button", { name: /logout/i })).not.toBeVisible();
  });
});

test.describe("Admin Game Management", () => {
  test.beforeEach(async ({ page }) => {
    // In dev mode, no login needed
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: /games/i })).toBeVisible({
      timeout: 10000,
    });
  });

  test("can create a new game", async ({ page }) => {
    await page.click('button:has-text("Create Game")');

    // Should redirect to game editor
    await expect(page).toHaveURL(/\/admin\/games\//, { timeout: 10000 });
    await expect(page.getByText("New Game")).toBeVisible();
  });

  test("can navigate back to games list", async ({ page }) => {
    await page.click('button:has-text("Create Game")');
    await expect(page).toHaveURL(/\/admin\/games\//, { timeout: 10000 });

    await page.click('button:has-text("Back to Games")');

    await expect(page).toHaveURL("/admin");
  });

  test("can view active and archived tabs", async ({ page }) => {
    await expect(page.getByRole("tab", { name: /active/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /archived/i })).toBeVisible();

    // Switch to archived
    await page.click('button[role="tab"]:has-text("Archived")');

    // Active tab should still work
    await page.click('button[role="tab"]:has-text("Active")');
  });
});

test.describe("Admin Game Editor", () => {
  test.beforeEach(async ({ page }) => {
    // In dev mode, no login needed
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: /games/i })).toBeVisible({
      timeout: 10000,
    });

    // Create a new game
    await page.click('button:has-text("Create Game")');
    await expect(page).toHaveURL(/\/admin\/games\//, { timeout: 10000 });
  });

  test("can edit game title", async ({ page }) => {
    // Click on title to edit
    const title = page.getByText("New Game");
    await title.click();

    // Type new title
    const titleInput = page.getByRole("textbox");
    await titleInput.clear();
    await titleInput.fill("E2E Test Game");

    // Save
    await page.click('button:has(svg.lucide-check)');

    // Title should be updated
    await expect(page.getByText("E2E Test Game")).toBeVisible();
  });

  test("can add a round", async ({ page }) => {
    // Click add round button
    await page.click('button:has-text("Add Round")');

    // A form appears to enter the round title
    const roundTitleInput = page.getByPlaceholder("Round title...");
    await expect(roundTitleInput).toBeVisible();

    // Enter a title and create
    await roundTitleInput.fill("Test Round");
    await page.click('button:has-text("Create")');

    // Should see new round with the title
    await expect(page.getByText(/Round 1: Test Round/i)).toBeVisible();
  });

  test("can add a question to a round", async ({ page }) => {
    // Add a round first
    await page.click('button:has-text("Add Round")');
    const roundTitleInput = page.getByPlaceholder("Round title...");
    await roundTitleInput.fill("Test Round");
    await page.click('button:has-text("Create")');

    // Wait for round to appear
    await expect(page.getByText(/Round 1: Test Round/i)).toBeVisible();

    // Round should be auto-expanded, look for Add Question button
    await expect(page.getByText(/Add Question/i)).toBeVisible();

    // Click Add Question (inside the expanded round)
    await page.click('button:has-text("Add Question")');

    // Question editor panel should open - title is "New Question"
    await expect(page.getByText("New Question")).toBeVisible();
  });

  test("shows Open Host View button in lobby state", async ({ page }) => {
    // In lobby state, should show "Open Host View" button
    await expect(page.getByRole("button", { name: /open host view/i })).toBeVisible();
  });
});

test.describe("Game Reset Feature", () => {
  test("reset dialog shows two options", async ({ page }) => {
    // First we need a started game - create game, add round, add question, start
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: /games/i })).toBeVisible({
      timeout: 10000,
    });

    await page.click('button:has-text("Create Game")');
    await expect(page).toHaveURL(/\/admin\/games\//, { timeout: 10000 });

    // Add a round
    await page.click('button:has-text("Add Round")');
    await page.fill('input[placeholder="Round title..."]', "Test Round");
    await page.click('button:has-text("Create")');
    await expect(page.getByText(/Round 1: Test Round/i)).toBeVisible();

    // Add a question with required fields
    await page.click('button:has-text("Add Question")');
    await expect(page.getByText("New Question")).toBeVisible();
    await page.fill('textarea[placeholder="Enter the question..."]', "Test question");
    await page.fill('input[placeholder="Enter the correct answer..."]', "Test answer");
    await page.click('button:has-text("Create Question")');

    // Wait for panel to close
    await expect(page.getByText("New Question")).not.toBeVisible({ timeout: 10000 });

    // Start the game
    await page.click('button:has-text("Start Game")');

    // Now game should be in progress - Reset Game button should appear
    await expect(page.getByRole("button", { name: /reset game/i })).toBeVisible({
      timeout: 10000,
    });

    // Click reset
    await page.click('button:has-text("Reset Game")');

    // Dialog should show two options
    await expect(page.getByText("Keep Teams")).toBeVisible();
    await expect(page.getByText("Full Reset")).toBeVisible();
  });

  test("can reset game with full reset option", async ({ page }) => {
    // Create and start a game
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: /games/i })).toBeVisible({
      timeout: 10000,
    });

    await page.click('button:has-text("Create Game")');
    await expect(page).toHaveURL(/\/admin\/games\//, { timeout: 10000 });

    // Add a round and question with required fields
    await page.click('button:has-text("Add Round")');
    await page.fill('input[placeholder="Round title..."]', "Test Round");
    await page.click('button:has-text("Create")');
    await page.click('button:has-text("Add Question")');
    await page.fill('textarea[placeholder="Enter the question..."]', "Test question");
    await page.fill('input[placeholder="Enter the correct answer..."]', "Test answer");
    await page.click('button:has-text("Create Question")');
    await expect(page.getByText("New Question")).not.toBeVisible({ timeout: 10000 });

    // Start the game
    await page.click('button:has-text("Start Game")');
    await expect(page.getByRole("button", { name: /reset game/i })).toBeVisible({
      timeout: 10000,
    });

    // Click reset and choose Full Reset
    await page.click('button:has-text("Reset Game")');
    await page.click('text=Full Reset');

    // Game should return to editable state (Start Game button visible again)
    await expect(page.getByRole("button", { name: /start game/i })).toBeVisible({
      timeout: 10000,
    });
  });
});

test.describe("Live Status Host Button", () => {
  test("shows LIVE indicator when game is in progress", async ({ page }) => {
    // Create and start a game
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: /games/i })).toBeVisible({
      timeout: 10000,
    });

    await page.click('button:has-text("Create Game")');
    await expect(page).toHaveURL(/\/admin\/games\//, { timeout: 10000 });

    // Add a round and question with required fields
    await page.click('button:has-text("Add Round")');
    await page.fill('input[placeholder="Round title..."]', "Test Round");
    await page.click('button:has-text("Create")');
    await page.click('button:has-text("Add Question")');
    await page.fill('textarea[placeholder="Enter the question..."]', "Test question");
    await page.fill('input[placeholder="Enter the correct answer..."]', "Test answer");
    await page.click('button:has-text("Create Question")');
    await expect(page.getByText("New Question")).not.toBeVisible({ timeout: 10000 });

    // Start the game
    await page.click('button:has-text("Start Game")');

    // Should show LIVE button with team count
    await expect(page.getByRole("button", { name: /live.*teams/i })).toBeVisible({
      timeout: 10000,
    });
  });
});

test.describe("Reset Button in Games List", () => {
  test("reset button appears on in-progress game in list view", async ({ page }) => {
    // Create and start a game
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: /games/i })).toBeVisible({
      timeout: 10000,
    });

    await page.click('button:has-text("Create Game")');
    await expect(page).toHaveURL(/\/admin\/games\//, { timeout: 10000 });

    // Add a round and question with required fields
    await page.click('button:has-text("Add Round")');
    await page.fill('input[placeholder="Round title..."]', "Test Round");
    await page.click('button:has-text("Create")');
    await page.click('button:has-text("Add Question")');
    await page.fill('textarea[placeholder="Enter the question..."]', "Test question");
    await page.fill('input[placeholder="Enter the correct answer..."]', "Test answer");
    await page.click('button:has-text("Create Question")');
    await expect(page.getByText("New Question")).not.toBeVisible({ timeout: 10000 });

    // Start the game
    await page.click('button:has-text("Start Game")');
    await expect(page.getByRole("button", { name: /reset game/i })).toBeVisible({
      timeout: 10000,
    });

    // Go back to games list
    await page.click('button:has-text("Back to Games")');
    await expect(page).toHaveURL("/admin");

    // The game card should show at least one "In Progress" badge
    await expect(page.getByText("In Progress").first()).toBeVisible({ timeout: 10000 });
    
    // Reset button (RotateCcw icon) should be visible on at least one card
    await expect(page.locator('button[title="Reset Game"]').first()).toBeVisible();
  });
});
