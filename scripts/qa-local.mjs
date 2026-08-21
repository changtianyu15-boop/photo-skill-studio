import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright-core";

const root = path.resolve(import.meta.dirname, "..");
const screenshotDir = process.env.QA_CAPTURE_DIR || path.join(
  root,
  "docs",
  "design-references",
  "serotoninn-com-817ae7db",
  "root-8a5edab2",
);
const reportPath = process.env.QA_REPORT_PATH || path.join(
  root,
  "docs",
  "research",
  "serotoninn-com-817ae7db",
  "root-8a5edab2",
  "local-qa.json",
);
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const targetUrl = process.env.QA_URL || "http://127.0.0.1:4317/";
const sourceImage = process.env.QA_SOURCE_IMAGE;
const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 768, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

await fs.mkdir(screenshotDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
  args: ["--disable-gpu", "--disable-dev-shm-usage"],
});

const report = { targetUrl, sourceImage: Boolean(sourceImage), viewports: {}, consoleErrors: [] };

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    page.on("console", (message) => {
      if (message.type() === "error") report.consoleErrors.push(`${viewport.name}: ${message.text()}`);
    });
    page.on("pageerror", (error) => report.consoleErrors.push(`${viewport.name}: ${error.message}`));

    await page.goto(targetUrl, { waitUntil: "networkidle", timeout: 20_000 });
    await page.waitForSelector(".skill-card", { state: "attached", timeout: 10_000 });
    if (sourceImage) await page.locator("#imageInput").setInputFiles(sourceImage);
    if (viewport.name === "mobile") {
      await page.locator("#flowStepSkills").click();
      await page.locator(".skill-card").first().waitFor({ state: "visible", timeout: 10_000 });
    }

    const metrics = await page.evaluate(() => ({
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      skillCount: document.querySelectorAll(".skill-card").length,
      selectedCount: document.querySelectorAll(".skill-card.selected").length,
      systemCount: document.querySelector("#systemCount")?.textContent?.trim(),
      sourceVisible: !document.querySelector("#sourcePreview")?.hidden,
      generateEnabled: !document.querySelector("#generateButton")?.disabled,
      apiState: document.querySelector("#apiState")?.textContent?.replace(/\s+/g, " ").trim(),
    }));

    await page.screenshot({
      path: path.join(screenshotDir, `local-${viewport.name}-${viewport.width}.png`),
      fullPage: true,
      animations: "disabled",
    });

    await page.locator("#openInstall").click();
    metrics.installDialogOpen = await page.locator("#installDialog").evaluate((dialog) => dialog.open);
    if (viewport.name === "desktop") {
      await page.screenshot({
        path: path.join(screenshotDir, "local-install-dialog.png"),
        animations: "disabled",
      });
    }

    report.viewports[viewport.name] = metrics;
    await context.close();
  }
} finally {
  await browser.close();
}

await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);

const failures = [];
for (const [name, metrics] of Object.entries(report.viewports)) {
  if (metrics.documentWidth > metrics.viewportWidth || metrics.bodyWidth > metrics.viewportWidth) {
    failures.push(`${name}: horizontal overflow`);
  }
  if (metrics.skillCount !== 4 || metrics.selectedCount !== 4) failures.push(`${name}: skill matrix mismatch`);
  if (sourceImage && (!metrics.sourceVisible || !metrics.generateEnabled)) failures.push(`${name}: upload state mismatch`);
  if (!metrics.installDialogOpen) failures.push(`${name}: install dialog did not open`);
}
if (report.consoleErrors.length) failures.push(...report.consoleErrors);

console.log(JSON.stringify({ reportPath, screenshotDir, report, failures }, null, 2));
if (failures.length) process.exitCode = 1;
