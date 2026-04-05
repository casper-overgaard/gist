import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function createSession(page: import("@playwright/test").Page, title: string) {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Signalboard" })).toBeVisible();
  await page.getByPlaceholder("Brand refresh, Q3 product direction...").fill(title);
  await page.getByRole("button", { name: "Create workspace" }).click();
  await page.waitForURL(/\/session\?id=/, { timeout: 15_000 });
}

async function addTextNote(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "+ Text note" }).click();
  await expect(page.getByText("New idea...")).toBeVisible({ timeout: 5_000 });
}

// ---------------------------------------------------------------------------
// Suite 1: Home page
// ---------------------------------------------------------------------------

test.describe("Home page", () => {
  test("renders title and create form", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Signalboard" })).toBeVisible();
    await expect(page.getByPlaceholder("Brand refresh, Q3 product direction...")).toBeVisible();
    await expect(page.getByRole("button", { name: "Create workspace" })).toBeVisible();
  });

  test("create session navigates to canvas", async ({ page }) => {
    await createSession(page, "E2E Home Test");
    expect(page.url()).toContain("/session?id=");
  });

  test("new session appears in recent workspaces list", async ({ page }) => {
    const title = `E2E Recent ${Date.now()}`;
    await createSession(page, title);
    await page.goto("/");
    await expect(page.getByText(title)).toBeVisible({ timeout: 5_000 });
  });
});

// ---------------------------------------------------------------------------
// Suite 2: Canvas — text notes
// ---------------------------------------------------------------------------

test.describe("Canvas — text notes", () => {
  test("add text note appears on canvas", async ({ page }) => {
    await createSession(page, "E2E Text Note Test");
    await addTextNote(page);
    await expect(page.getByText("New idea...")).toBeVisible();
  });

  test("click text note enters edit mode", async ({ page }) => {
    await createSession(page, "E2E Edit Test");
    await addTextNote(page);
    await page.getByText("New idea...").click();
    await expect(page.locator("textarea").first()).toBeVisible();
  });

  test("edited text note auto-triggers analysis after blur", async ({ page }) => {
    test.setTimeout(60_000);
    await createSession(page, "E2E Analyze Button Test");
    await addTextNote(page);
    await page.getByText("New idea...").click();
    await page.locator("textarea").first().fill("Brutalist editorial design with stark contrast.");
    await page.keyboard.press("Tab"); // Tab blurs the textarea, triggering auto-analysis
    await expect(page.getByText("Extracting signals…")).toBeVisible({ timeout: 10_000 });
  });

  test("delete button removes text note", async ({ page }) => {
    await createSession(page, "E2E Delete Test");
    await addTextNote(page);
    await expect(page.getByText("New idea...")).toBeVisible();
    await page.locator('button[title="Remove"]').first().click({ force: true });
    await expect(page.getByText("New idea...")).not.toBeVisible({ timeout: 5_000 });
  });

  test("selecting a card reveals annotation textarea", async ({ page }) => {
    await createSession(page, "E2E Annotation Test");
    await addTextNote(page);
    await page.locator(".react-flow__node").first().click();
    await expect(
      page.getByPlaceholder("What about this is relevant? What to ignore?")
    ).toBeVisible({ timeout: 5_000 });
  });

  test("canvas persists cards on page refresh", async ({ page }) => {
    await createSession(page, "E2E Persistence Test");
    await addTextNote(page);
    await expect(page.getByText("New idea...")).toBeVisible();
    const url = page.url();
    await page.reload();
    await page.waitForURL(url, { timeout: 10_000 });
    await expect(page.getByText("New idea...")).toBeVisible({ timeout: 10_000 });
  });
});

// ---------------------------------------------------------------------------
// Suite 3: Canvas — URL cards
// ---------------------------------------------------------------------------

test.describe("Canvas — URL cards", () => {
  test("add URL card via toolbar shows domain after fetch", async ({ page }) => {
    await createSession(page, "E2E URL Test");
    await page.getByRole("button", { name: "+ URL" }).click();
    await expect(page.getByPlaceholder("https://...")).toBeVisible();
    await page.getByPlaceholder("https://...").fill("https://vercel.com");
    await page.getByRole("button", { name: "Add" }).click();
    // Fetching state appears first, then resolves to metadata
    await expect(page.getByText("Fetching page…")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Fetching page…")).not.toBeVisible({ timeout: 20_000 });
    // Domain stamp should be visible after fetch
    await expect(page.locator(".react-flow__node").filter({ hasText: "vercel" })).toBeVisible();
  });

  test("URL input dismisses on Escape", async ({ page }) => {
    await createSession(page, "E2E URL Escape Test");
    await page.getByRole("button", { name: "+ URL" }).click();
    await expect(page.getByPlaceholder("https://...")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByPlaceholder("https://...")).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Suite 4: Canvas — Merge node
// ---------------------------------------------------------------------------

test.describe("Canvas — Merge node", () => {
  test("add merge node via toolbar", async ({ page }) => {
    await createSession(page, "E2E Merge Node Test");
    await page.getByRole("button", { name: "+ Merge" }).click();
    await expect(
      page.getByText("Connect asset nodes to this merge node to synthesize a spec fragment.")
    ).toBeVisible({ timeout: 5_000 });
  });

  test("generate fragment button is disabled with no connections", async ({ page }) => {
    await createSession(page, "E2E Merge Button Test");
    await page.getByRole("button", { name: "+ Merge" }).click();
    await expect(page.getByRole("button", { name: "Generate fragment" })).toBeDisabled({ timeout: 5_000 });
  });
});

// ---------------------------------------------------------------------------
// Suite 5: Canvas — Merge node connections
// ---------------------------------------------------------------------------

async function addMergeNode(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "+ Merge" }).click();
  await expect(
    page.getByText("Connect asset nodes to this merge node to synthesize a spec fragment.")
  ).toBeVisible({ timeout: 5_000 });
}

async function connectNodeToMerge(page: import("@playwright/test").Page) {
  // Use ReactFlow's handle CSS classes to get exact viewport positions
  // regardless of where nodes were randomly placed on the canvas
  const sourceHandle = page.locator(".react-flow__handle-bottom").first();
  const targetHandle = page.locator(".react-flow__handle-left").first();

  await sourceHandle.waitFor({ state: "attached", timeout: 5_000 });
  await targetHandle.waitFor({ state: "attached", timeout: 5_000 });

  const sourceBox = await sourceHandle.boundingBox();
  const targetBox = await targetHandle.boundingBox();
  if (!sourceBox || !targetBox) throw new Error("Handles not found in DOM");

  const sx = sourceBox.x + sourceBox.width / 2;
  const sy = sourceBox.y + sourceBox.height / 2;
  const tx = targetBox.x + targetBox.width / 2;
  const ty = targetBox.y + targetBox.height / 2;

  await page.mouse.move(sx, sy);
  await page.mouse.down();
  // Move in fine steps so ReactFlow's pointer-move handler tracks the drag
  for (let i = 1; i <= 20; i++) {
    await page.mouse.move(sx + (tx - sx) * (i / 20), sy + (ty - sy) * (i / 20));
  }
  await page.mouse.up();
}

test.describe("Canvas — Merge node connections", () => {
  test("connecting asset to merge node shows reference count", async ({ page }) => {
    await createSession(page, "E2E Merge Connect Test");
    await addTextNote(page);
    await addMergeNode(page);
    await connectNodeToMerge(page);
    await expect(page.getByText("1 reference connected")).toBeVisible({ timeout: 5_000 });
  });

  test("generate fragment button enables after connection", async ({ page }) => {
    await createSession(page, "E2E Merge Enable Test");
    await addTextNote(page);
    await addMergeNode(page);
    await connectNodeToMerge(page);
    await expect(page.getByRole("button", { name: "Generate fragment" })).toBeEnabled({ timeout: 5_000 });
  });
});

// ---------------------------------------------------------------------------
// Suite 6: Merge → fragment generation (LLM — slower)
// ---------------------------------------------------------------------------

test.describe("Merge fragment generation", () => {
  test("generate fragment → OutputNode appears with element name and spec URL", async ({ page }) => {
    test.setTimeout(180_000);
    await createSession(page, "E2E Fragment Gen Test");
    await addTextNote(page);
    await page.getByText("New idea...").click();
    await page.locator("textarea").first().fill(
      "Dark editorial hero section. Amber accent. Full-bleed image with typographic overlay."
    );
    await page.keyboard.press("Tab");

    // Wait for auto-analysis to complete
    await expect(page.getByText("Extracting signals…")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Extracting signals…")).not.toBeVisible({ timeout: 45_000 });

    await addMergeNode(page);
    await connectNodeToMerge(page);
    await expect(page.getByRole("button", { name: "Generate fragment" })).toBeEnabled({ timeout: 5_000 });
    await page.getByRole("button", { name: "Generate fragment" }).click();

    await expect(page.getByText("Synthesizing…")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Synthesizing…")).not.toBeVisible({ timeout: 60_000 });

    // OutputNode should appear with a spec fragment heading
    await expect(page.getByText("Spec Fragment")).toBeVisible({ timeout: 10_000 });

    // Spec URL strip should be visible on the OutputNode
    await expect(page.locator("code").filter({ hasText: "/api/spec/" })).toBeVisible({ timeout: 5_000 });
  });

  test("Add to brief enables after fragment generated", async ({ page }) => {
    test.setTimeout(180_000);
    await createSession(page, "E2E Add To Brief Test");
    await addTextNote(page);
    await page.getByText("New idea...").click();
    await page.locator("textarea").first().fill(
      "Minimal card component. Subtle borders. Monospace labels."
    );
    await page.keyboard.press("Tab");
    await expect(page.getByText("Extracting signals…")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Extracting signals…")).not.toBeVisible({ timeout: 45_000 });

    await addMergeNode(page);
    await connectNodeToMerge(page);
    await page.getByRole("button", { name: "Generate fragment" }).click();
    await expect(page.getByText("Synthesizing…")).not.toBeVisible({ timeout: 60_000 });

    await expect(page.getByRole("button", { name: "Add to brief" })).toBeVisible({ timeout: 5_000 });
    await page.getByRole("button", { name: "Add to brief" }).click();
    await expect(page.getByRole("button", { name: "Added to brief" })).toBeVisible({ timeout: 5_000 });
  });

  test("OutputPanel shows Component Specs section after fragment generated", async ({ page }) => {
    test.setTimeout(180_000);
    await createSession(page, "E2E Component Specs Panel Test");
    await addTextNote(page);
    await page.getByText("New idea...").click();
    await page.locator("textarea").first().fill(
      "Navigation bar. Sticky. Transparent on scroll. Amber logo mark."
    );
    await page.keyboard.press("Tab");
    await expect(page.getByText("Extracting signals…")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Extracting signals…")).not.toBeVisible({ timeout: 45_000 });

    await addMergeNode(page);
    await connectNodeToMerge(page);
    await page.getByRole("button", { name: "Generate fragment" }).click();
    await expect(page.getByText("Synthesizing…")).not.toBeVisible({ timeout: 60_000 });

    // OutputPanel should now show Component Specs section
    await expect(page.getByText("Component Specs")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("button", { name: "Copy all @includes" })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Suite 8: Analysis flow — auto-triggered (LLM — slower)
// ---------------------------------------------------------------------------

test.describe("Analysis flow", () => {
  test("text save auto-triggers analysis → signals appear → Clarify panel updates", async ({ page }) => {
    test.setTimeout(120_000);
    await createSession(page, "E2E Analysis Test");
    await addTextNote(page);
    await page.getByText("New idea...").click();
    await page.locator("textarea").first().fill(
      "Clean Swiss editorial design. Dark surfaces, precision type, maximal whitespace."
    );
    // Tab to blur — auto-analysis triggers, no manual Analyze button needed
    await page.keyboard.press("Tab");

    await expect(page.getByText("Extracting signals…")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Extracting signals…")).not.toBeVisible({ timeout: 45_000 });

    await expect(
      page.getByText("Signals ready. Run synthesis to generate targeted questions.")
    ).toBeVisible({ timeout: 5_000 });
  });

  test("Analyze button no longer present on text note", async ({ page }) => {
    await createSession(page, "E2E No Analyze Button Test");
    await addTextNote(page);
    await page.getByText("New idea...").click();
    await page.locator("textarea").first().fill("Some design text.");
    await page.keyboard.press("Tab");
    // Analyze button should not appear — analysis is automatic
    await expect(page.getByRole("button", { name: "Analyze" })).not.toBeVisible({ timeout: 3_000 });
  });
});

// ---------------------------------------------------------------------------
// Suite 9: Synthesis + output (LLM — slowest)
// ---------------------------------------------------------------------------

test.describe("Synthesis and output flow", () => {
  test("synthesize → Generate button enabled", async ({ page }) => {
    test.setTimeout(180_000);
    await createSession(page, "E2E Synthesis Test");
    await addTextNote(page);
    await page.getByText("New idea...").click();
    await page.locator("textarea").first().fill(
      "Brutalist typographic grid. High contrast. Raw industrial aesthetic."
    );
    await page.keyboard.press("Tab");

    // Auto-analysis triggers on blur — no Analyze button needed
    await expect(page.getByText("Extracting signals…")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Extracting signals…")).not.toBeVisible({ timeout: 45_000 });

    await page.getByRole("button", { name: "Synthesize signals" }).click();
    await expect(page.getByRole("button", { name: "Synthesizing…" })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole("button", { name: "Synthesizing…" })).not.toBeVisible({ timeout: 45_000 });

    await expect(page.getByRole("button", { name: "Generate" })).toBeEnabled({ timeout: 5_000 });
  });

  test("generate → direction brief + export buttons appear", async ({ page }) => {
    test.setTimeout(240_000);
    await createSession(page, "E2E Output Test");
    await addTextNote(page);
    await page.getByText("New idea...").click();
    await page.locator("textarea").first().fill(
      "Warm editorial. Amber accents. Handcrafted feel. Dense information layout."
    );
    await page.keyboard.press("Tab");

    // Auto-analysis triggers on blur — no Analyze button needed
    await expect(page.getByText("Extracting signals…")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Extracting signals…")).not.toBeVisible({ timeout: 45_000 });

    await page.getByRole("button", { name: "Synthesize signals" }).click();
    await expect(page.getByRole("button", { name: "Synthesizing…" })).not.toBeVisible({ timeout: 45_000 });

    await page.getByRole("button", { name: "Generate" }).click();
    await expect(page.getByText("Generating brief…")).toBeVisible({ timeout: 10_000 });

    // Re-generate button confirms output was produced
    await expect(page.getByRole("button", { name: "Re-generate" })).toBeVisible({ timeout: 60_000 });

    // IDE export buttons
    await expect(page.getByRole("button", { name: "Claude Code" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Cursor" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Export" })).toBeVisible();
  });
});
