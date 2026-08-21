import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright-core";

const root = path.resolve(import.meta.dirname, "..");
const siteKey = "serotoninn-com-817ae7db";
const pageKey = "root-8a5edab2";
const researchDir = path.join(root, "docs", "research", siteKey, pageKey);
const screenshotDir = path.join(root, "docs", "design-references", siteKey, pageKey);
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const targetUrl = "https://serotoninn.com/";

await Promise.all([
  fs.mkdir(researchDir, { recursive: true }),
  fs.mkdir(screenshotDir, { recursive: true }),
]);

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
  args: ["--disable-gpu", "--disable-dev-shm-usage"],
});

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 768, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

const context = await browser.newContext({ viewport: viewports[0] });
const page = await context.newPage();
page.setDefaultTimeout(12_000);

async function settle() {
  await page.waitForLoadState("domcontentloaded", { timeout: 10_000 }).catch(() => {});
  await page.evaluate(() => document.fonts?.ready).catch(() => {});
  await page.waitForTimeout(2500);
}

async function dismissConsent() {
  const reject = page.getByRole("button", { name: /reject all/i });
  if (await reject.isVisible().catch(() => false)) {
    await reject.click({ force: true }).catch(() => {});
    await page.waitForTimeout(500);
  }
}

async function extractPageState(viewport) {
  return page.evaluate(({ name, width, height }) => {
    const props = [
      "fontSize", "fontWeight", "fontFamily", "lineHeight", "letterSpacing", "color",
      "textTransform", "textDecoration", "backgroundColor", "background",
      "padding", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
      "margin", "marginTop", "marginRight", "marginBottom", "marginLeft",
      "width", "height", "maxWidth", "minWidth", "display", "flexDirection",
      "justifyContent", "alignItems", "gap", "gridTemplateColumns", "borderRadius",
      "border", "borderTop", "borderBottom", "boxShadow", "overflow", "position",
      "top", "right", "bottom", "left", "zIndex", "opacity", "transform",
      "transition", "cursor", "objectFit", "mixBlendMode", "filter", "backdropFilter",
      "whiteSpace", "textOverflow",
    ];
    const text = (element) => element?.textContent?.replace(/\s+/g, " ").trim() || "";
    const findText = (selector, matcher) => [...document.querySelectorAll(selector)]
      .find((element) => matcher.test(text(element)));
    const style = (element) => {
      if (!element) return null;
      const computed = getComputedStyle(element);
      const values = {};
      for (const prop of props) {
        const value = computed[prop];
        if (value && value !== "none" && value !== "normal" && value !== "auto" && value !== "0px" && value !== "rgba(0, 0, 0, 0)") {
          values[prop] = value;
        }
      }
      const rect = element.getBoundingClientRect();
      return { tag: element.tagName.toLowerCase(), text: text(element).slice(0, 220), rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }, values };
    };

    const rootStyles = getComputedStyle(document.documentElement);
    const customProperties = {};
    for (const name of rootStyles) {
      if (name.startsWith("--")) customProperties[name] = rootStyles.getPropertyValue(name).trim();
    }
    const headings = [...document.querySelectorAll("h1,h2")].slice(0, 12).map(style);
    const representatives = {
      body: style(document.body),
      header: style(document.querySelector("header")),
      heroTitle: style(document.querySelector("h1")),
      heroSubtitle: style(findText("p", /Where glam meets grunge/i)),
      heroCta: style(findText("a,button", /SEE COLLECTION/i)),
      sectionHeading: style(findText("h2", /New Arrivals/i)),
      campaign: style(findText("h2", /Campaign/i)),
      categoryHeading: style(findText("h2", /CATEGORIES/i)),
      menuButton: style(findText("button", /^menu$/i)),
      shopLink: style(findText("a", /^Shop all$/i)),
      cookieButton: style(findText("button", /accept cookies/i)),
    };

    return {
      viewport: { name, width, height, devicePixelRatio: window.devicePixelRatio },
      document: { width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight },
      title: document.title,
      language: document.documentElement.lang,
      classes: { html: document.documentElement.className, body: document.body.className },
      customProperties,
      representatives,
      headings,
      assets: {
        images: [...document.querySelectorAll("img")].map((img) => ({ src: img.currentSrc || img.src, alt: img.alt, width: img.naturalWidth, height: img.naturalHeight })),
        videos: [...document.querySelectorAll("video")].map((video) => ({ src: video.currentSrc || video.src || video.querySelector("source")?.src, poster: video.poster, autoplay: video.autoplay, loop: video.loop, muted: video.muted })),
        backgrounds: [...document.querySelectorAll("*")].map((element) => ({ element, background: getComputedStyle(element).backgroundImage })).filter((item) => item.background && item.background !== "none").slice(0, 100).map((item) => ({ tag: item.element.tagName.toLowerCase(), className: String(item.element.className).slice(0, 160), background: item.background })),
        favicons: [...document.querySelectorAll('link[rel*="icon"]')].map((link) => ({ href: link.href, sizes: link.sizes?.toString() })),
        svgCount: document.querySelectorAll("svg").length,
        fonts: [...new Set([...document.querySelectorAll("*")].slice(0, 400).map((element) => getComputedStyle(element).fontFamily))],
      },
    };
  }, viewport);
}

try {
  await page.goto(targetUrl, { waitUntil: "commit", timeout: 45_000 });
  await settle();
  await dismissConsent();

  const results = {};
  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.reload({ waitUntil: "commit", timeout: 45_000 });
    await settle();
    await dismissConsent();
    await page.screenshot({
      path: path.join(screenshotDir, `${viewport.name}-${viewport.width}.png`),
      fullPage: true,
      animations: "disabled",
    });
    results[viewport.name] = await extractPageState(viewport);
  }

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.reload({ waitUntil: "commit", timeout: 45_000 });
  await settle();
  await dismissConsent();
  const header = page.locator("header").first();
  const heroCta = page.getByRole("link", { name: /SEE COLLECTION/i }).first();
  const behavior = {
    scrollInitial: await header.evaluate((element) => ({ scrollY: window.scrollY, style: { backgroundColor: getComputedStyle(element).backgroundColor, transform: getComputedStyle(element).transform, boxShadow: getComputedStyle(element).boxShadow, position: getComputedStyle(element).position } })),
    ctaInitial: await heroCta.evaluate((element) => ({ color: getComputedStyle(element).color, backgroundColor: getComputedStyle(element).backgroundColor, transform: getComputedStyle(element).transform, transition: getComputedStyle(element).transition })),
  };
  await page.evaluate(() => window.scrollTo(0, 700));
  await page.waitForTimeout(700);
  behavior.scrollAfter700 = await header.evaluate((element) => ({ scrollY: window.scrollY, style: { backgroundColor: getComputedStyle(element).backgroundColor, transform: getComputedStyle(element).transform, boxShadow: getComputedStyle(element).boxShadow, position: getComputedStyle(element).position } }));
  await page.evaluate(() => window.scrollTo(0, 0));
  await heroCta.hover();
  await page.waitForTimeout(250);
  behavior.ctaHover = await heroCta.evaluate((element) => ({ color: getComputedStyle(element).color, backgroundColor: getComputedStyle(element).backgroundColor, transform: getComputedStyle(element).transform, transition: getComputedStyle(element).transition }));

  await fs.writeFile(path.join(researchDir, "extraction.json"), `${JSON.stringify(results, null, 2)}\n`);
  await fs.writeFile(path.join(researchDir, "behaviors.json"), `${JSON.stringify(behavior, null, 2)}\n`);
  console.log(JSON.stringify({ researchDir, screenshotDir, viewports: Object.keys(results), behavior }, null, 2));
} finally {
  await browser.close();
}
