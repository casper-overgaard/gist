import { test, expect } from "@playwright/test";

test.describe("Signalboard — happy path", () => {
  test("creates a session and navigates to workspace", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Signalboard" })).toBeVisible();

    const input = page.getByPlaceholder("Name your new workspace...");
    await input.click();
    await input.type("E2E Test Session");
    await page.keyboard.press("Enter");

    // Should navigate to /session?id=...
    await page.waitForURL(/\/session\?id=/, { timeout: 15_000 });
    expect(page.url()).toContain("/session?id=");
  });

  test("adds a text note and triggers analysis", async ({ page }) => {
    // Create session
    await page.goto("/");
    await page.getByPlaceholder("Name your new workspace...").click();
    await page.keyboard.type("Analysis Test");
    await page.keyboard.press("Enter");
    await page.waitForURL(/\/session\?id=/, { timeout: 15_000 });

    // Add text note
    await page.getByRole("button", { name: "+ Text Note" }).click();
    await expect(page.getByText("New idea...")).toBeVisible();

    // Click note to edit
    await page.getByText("New idea...").click();
    const textarea = page.locator("textarea");
    await textarea.selectText();
    await textarea.type("Bold editorial design with high contrast typographic hierarchy.");

    // Blur to trigger analysis
    await page.keyboard.press("Tab");

    // Wait for "Analyzing note..." to appear then disappear
    await expect(page.getByText("Analyzing note...")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Analyzing note...")).not.toBeVisible({ timeout: 30_000 });

    // Clarify panel should now say "Signals ready"
    await expect(page.getByText(/Signals ready/i)).toBeVisible({ timeout: 20_000 });
  });

  test("synthesizes signals and enables Generate", async ({ page }) => {
    // Create session and add an analyzed note
    await page.goto("/");
    await page.getByPlaceholder("Name your new workspace...").click();
    await page.keyboard.type("Synthesis Test");
    await page.keyboard.press("Enter");
    await page.waitForURL(/\/session\?id=/, { timeout: 15_000 });

    await page.getByRole("button", { name: "+ Text Note" }).click();
    await page.getByText("New idea...").click();
    const textarea = page.locator("textarea");
    await textarea.selectText();
    await textarea.type("Clean Swiss-inspired UI. Dark backgrounds. Precision typography.");
    await page.keyboard.press("Tab");
    await expect(page.getByText("Analyzing note...")).not.toBeVisible({ timeout: 30_000 });

    // Synthesize
    await page.getByRole("button", { name: "Synthesize Signals" }).click();
    await expect(page.getByRole("button", { name: "Synthesizing..." })).toBeVisible();
    await expect(page.getByText("Signals synthesized. Generate a brief when ready.")).toBeVisible({
      timeout: 30_000,
    });

    // Generate button should now be enabled
    const generateBtn = page.getByRole("button", { name: "Generate" });
    await expect(generateBtn).toBeEnabled();
  });

  test("generates a direction brief", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder("Name your new workspace...").click();
    await page.keyboard.type("Output Test");
    await page.keyboard.press("Enter");
    await page.waitForURL(/\/session\?id=/, { timeout: 15_000 });

    // Add + analyze note
    await page.getByRole("button", { name: "+ Text Note" }).click();
    await page.getByText("New idea...").click();
    const textarea = page.locator("textarea");
    await textarea.selectText();
    await textarea.type("Brutalist web design. Raw grid. Experimental typography. Anti-corporate.");
    await page.keyboard.press("Tab");
    await expect(page.getByText("Analyzing note...")).not.toBeVisible({ timeout: 30_000 });

    // Synthesize
    await page.getByRole("button", { name: "Synthesize Signals" }).click();
    await expect(page.getByText("Signals synthesized. Generate a brief when ready.")).toBeVisible({
      timeout: 30_000,
    });

    // Generate
    await page.getByRole("button", { name: "Generate" }).click();
    await expect(page.getByText(/Generating brief/i)).toBeVisible({ timeout: 5_000 });

    // Wait for brief to appear (DIRECTION SUMMARY section)
    await expect(page.getByText("DIRECTION SUMMARY")).toBeVisible({ timeout: 45_000 });
    await expect(page.getByRole("button", { name: "Export .md" })).toBeVisible();
  });

  test("asset deletion removes card from canvas", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder("Name your new workspace...").click();
    await page.keyboard.type("Deletion Test");
    await page.keyboard.press("Enter");
    await page.waitForURL(/\/session\?id=/, { timeout: 15_000 });

    await page.getByRole("button", { name: "+ Text Note" }).click();
    await expect(page.getByText("New idea...")).toBeVisible();

    // Force-click the delete button (it's opacity-0 until hovered, bypass visibility check)
    await page.locator('button[title="Remove"]').click({ force: true });

    await expect(page.getByText("New idea...")).not.toBeVisible({ timeout: 5_000 });
  });
});
