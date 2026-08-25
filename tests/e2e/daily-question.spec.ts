import { expect, test, type Locator, type Page } from "@playwright/test";
import { openTwoPeers } from "@baditaflorin/mesh-common/testing";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8")) as {
  name: string;
};
const storagePrefix = pkg.name;

async function closeInitiallyOpenSettings(page: Page): Promise<void> {
  const settings = page.getByRole("dialog", { name: "Settings" });
  if (!(await settings.isVisible().catch(() => false))) return;
  const close = settings.getByRole("button", { name: "close" });
  if (await close.isVisible().catch(() => false)) {
    await close.click();
  } else {
    await page.keyboard.press("Escape");
  }
  await expect(settings).toBeHidden();
}

async function expectWithinInitialViewport(locator: Locator): Promise<void> {
  const box = await locator.boundingBox();
  expect(box, "The primary action should have a layout box.").not.toBeNull();
  const viewport = await locator.evaluate(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(viewport.scrollWidth, "The page must not overflow horizontally.").toBeLessThanOrEqual(
    viewport.width,
  );
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.y + box!.height, "The primary action must be above the fold.").toBeLessThanOrEqual(
    viewport.height,
  );
}

test("two peers exchange actual reflections through the shared room", async ({
  browser,
  baseURL,
}) => {
  const { a, b, cleanup } = await openTwoPeers(browser, baseURL ?? "", { storagePrefix });
  try {
    await Promise.all([closeInitiallyOpenSettings(a), closeInitiallyOpenSettings(b)]);

    await a.getByRole("textbox", { name: "Your name" }).fill("Ari");
    await a
      .getByRole("textbox", { name: "Your response" })
      .fill("A slow cup of coffee before the messages arrive.");
    await a.getByRole("button", { name: "Share today’s answer" }).click();

    await expect(b.getByText("A slow cup of coffee before the messages arrive.")).toBeVisible();
    await expect(b.getByText("Ari", { exact: true })).toBeVisible();
    await b.getByRole("button", { name: "Add appreciation for this answer" }).click();
    await expect(a.locator(".appreciation")).toContainText("1");

    await b.getByRole("textbox", { name: "Your name" }).fill("Bea");
    await b.getByRole("textbox", { name: "Your response" }).fill("A walk without a destination.");
    await b.getByLabel("Post anonymously").check();
    await b.getByRole("button", { name: "Share today’s answer" }).click();

    await expect(a.getByText("A walk without a destination.")).toBeVisible();
    await expect(a.getByText("Anonymous", { exact: true })).toBeVisible();
    await expect(a.getByText("Shared reflections")).toBeVisible();
  } finally {
    await cleanup();
  }
});

test("390 by 844 keeps the question and share action inside a no-overflow first view", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./", { waitUntil: "domcontentloaded" });
  await closeInitiallyOpenSettings(page);

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expectWithinInitialViewport(
    page.locator(".daily-mobile-action").getByRole("button", { name: "Share today’s answer" }),
  );

  const response = page.getByRole("textbox", { name: "Your response" });
  await response.focus();
  await page.waitForTimeout(50);
  const focusedBounds = await response.evaluate((element) => {
    const field = element.getBoundingClientRect();
    const action = document.querySelector(".daily-mobile-action")?.getBoundingClientRect();
    return { fieldBottom: field.bottom, actionTop: action?.top ?? 0 };
  });
  expect(
    focusedBounds.fieldBottom,
    "The focused response field must clear the fixed action.",
  ).toBeLessThanOrEqual(focusedBounds.actionTop);
});

test("1141 by 602 keeps today’s real question and primary answer contract above the fold", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1141, height: 602 });
  await page.goto("./", { waitUntil: "domcontentloaded" });
  await closeInitiallyOpenSettings(page);

  const question = page.getByRole("heading", { level: 1 });
  await expect(question).toBeVisible();
  await expect(question).toHaveText(/.+\?$/);
  await expectWithinInitialViewport(page.getByRole("button", { name: "Share today’s answer" }));
});
