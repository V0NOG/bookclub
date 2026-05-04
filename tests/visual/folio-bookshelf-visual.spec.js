const { expect, test } = require("@playwright/test");
const path = require("path");
const fs = require("fs");

const baseUrl = process.env.FOLIO_BASE_URL || "http://localhost:3000";
const outDir = path.join(process.cwd(), "test-results", "folio-bookshelf-screenshots");

async function signIn(page) {
  await page.goto(`${baseUrl}/sign-in`, { waitUntil: "networkidle" });
  const credentialsCallback = page.waitForResponse(
    (response) => response.url().includes("/api/auth/callback/credentials") && response.status() === 200,
    { timeout: 45000 }
  );
  await page.getByRole("button", { name: /try demo/i }).click();
  await credentialsCallback;
}

async function openLibrary(page) {
  await page.goto(`${baseUrl}/library`, { waitUntil: "networkidle" });
  await page.locator("[data-bookshelf-view]").waitFor({ timeout: 20000 });
  await page.locator("[data-bookshelf-spine]").first().scrollIntoViewIfNeeded();
}

async function capture(page, name) {
  await page.screenshot({ path: path.join(outDir, name), fullPage: false });
}

async function selectFirstBook(page) {
  const firstSpine = page.locator("[data-bookshelf-spine]").first();
  await firstSpine.click();
  await page.waitForTimeout(260);
  await expect(page.locator(".folio-book-object")).toHaveCount(1);
  return page.locator(".folio-book-object").first();
}

async function selectedBookPoint(page, ratioX, ratioY = 0.52) {
  const object = page.locator(".folio-book-object").first();
  const box = await object.boundingBox();
  if (!box) throw new Error("Selected book object has no bounding box.");
  return {
    x: box.x + box.width * ratioX,
    y: box.y + box.height * ratioY,
  };
}

async function clickSelectedBookAt(page, ratioX, ratioY = 0.52) {
  const point = await selectedBookPoint(page, ratioX, ratioY);
  await page.mouse.click(point.x, point.y);
  await page.locator("[data-bookshelf-opening-overlay]").waitFor({ timeout: 3000 });
}

async function clickSelectedBookWithoutWaiting(page, ratioX, ratioY = 0.52) {
  const point = await selectedBookPoint(page, ratioX, ratioY);
  await page.mouse.click(point.x, point.y);
}

async function hasNoHorizontalOverflow(page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
}

async function selectedDiagnostics(page) {
  return page.evaluate(() => {
    const objects = [...document.querySelectorAll(".folio-book-object")];
    const selectedSlots = [...document.querySelectorAll(".folio-book-slot[data-selected='true']")];
    return {
      objectCount: objects.length,
      selectedSlotCount: selectedSlots.length,
      titles: objects.map((object) => object.querySelector(".folio-book-attached-spine-title")?.textContent?.trim()),
      boxes: objects.map((object) => {
        const rect = object.getBoundingClientRect();
        return { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) };
      }),
    };
  });
}

test("desktop selected book opens from the full visible hitbox", async ({ browser }) => {
  fs.mkdirSync(outDir, { recursive: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  const points = [
    { name: "selected-left-click.png", ratio: 0.12 },
    { name: "selected-centre-click.png", ratio: 0.5 },
    { name: "selected-right-click.png", ratio: 0.82 },
    { name: "selected-far-right-click.png", ratio: 0.97 },
  ];

  for (const point of points) {
    const page = await context.newPage();
    await signIn(page);
    await openLibrary(page);
    await selectFirstBook(page);
    expect(await hasNoHorizontalOverflow(page)).toBe(true);
    console.log(point.name, JSON.stringify(await selectedDiagnostics(page)));
    await clickSelectedBookAt(page, point.ratio);
    await page.waitForTimeout(180);
    await capture(page, point.name);
    await page.close();
  }

  await context.close();
});

test("desktop switching books and smooth opening screenshots", async ({ browser }) => {
  fs.mkdirSync(outDir, { recursive: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await signIn(page);
  await openLibrary(page);

  const spines = page.locator("[data-bookshelf-spine]");
  await spines.nth(0).click();
  await page.waitForTimeout(260);
  console.log("after A", JSON.stringify(await selectedDiagnostics(page)));

  await spines.nth(1).click();
  await page.waitForTimeout(260);
  console.log("after B", JSON.stringify(await selectedDiagnostics(page)));
  expect(await hasNoHorizontalOverflow(page)).toBe(true);

  await clickSelectedBookWithoutWaiting(page, 0.5);
  await page.waitForTimeout(350);
  await expect(page.locator("[data-bookshelf-opening-overlay]")).toBeVisible();
  await capture(page, "overlay-early.png");
  await page.waitForTimeout(550);
  await capture(page, "overlay-mid.png");
  await page.waitForTimeout(600);
  await capture(page, "overlay-final.png");
  await page.waitForURL(/\/books\//, { timeout: 2500, waitUntil: "commit" });

  await context.close();
});

test("mobile tap opens from the selected book", async ({ browser }) => {
  fs.mkdirSync(outDir, { recursive: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
  });
  const page = await context.newPage();
  await signIn(page);
  await openLibrary(page);
  await selectFirstBook(page);
  expect(await hasNoHorizontalOverflow(page)).toBe(true);
  await capture(page, "mobile-selected.png");
  console.log("mobile", JSON.stringify(await selectedDiagnostics(page)));
  await clickSelectedBookAt(page, 0.58);
  await expect(page.locator("[data-bookshelf-opening-overlay]")).toBeVisible();
  await page.waitForURL(/\/books\//, { timeout: 2500, waitUntil: "commit" });
  await context.close();
});

test("reduced motion skips the overlay animation", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1024, height: 800 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await signIn(page);
  await openLibrary(page);
  await selectFirstBook(page);
  const point = await selectedBookPoint(page, 0.5);
  await page.mouse.click(point.x, point.y);
  await page.waitForURL(/\/books\//, { timeout: 3000, waitUntil: "commit" });
  await expect(page.locator("[data-bookshelf-opening-overlay]")).toHaveCount(0);
  await context.close();
});
