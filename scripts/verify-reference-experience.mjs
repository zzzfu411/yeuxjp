import assert from "node:assert/strict"
import fs from "node:fs"
import { fileURLToPath } from "node:url"

export async function verifyReferenceExperience(browser, baseUrl) {
  const evidence = []
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: "light", serviceWorkers: "block" })
  const page = await context.newPage()
  const errors = []
  page.on("pageerror", error => errors.push(error.message))
  try {
    for (const item of [{ path: "/semantics", label: "搜索语义辨析", query: "知る" }, { path: "/pragmatics", label: "搜索情境表达", query: "おはよう" }]) {
      await page.goto(baseUrl + item.path, { waitUntil: "networkidle" })
      await page.getByRole("textbox", { name: item.label }).fill(item.query)
      await page.waitForURL(url => url.searchParams.get("q") === item.query)
      const firstResult = page.locator("#reference-results a").first()
      await firstResult.waitFor()
      const href = await firstResult.getAttribute("href")
      assert.equal(new URL(href, baseUrl).searchParams.get("q"), item.query)
      await firstResult.click()
      await page.getByTestId("reference-document").waitFor()
      assert.equal(await page.getByRole("dialog").count(), 0)
      assert.notEqual(await page.locator("body").evaluate(el => getComputedStyle(el).overflow), "hidden")
      assert.equal(await page.getByRole("heading", { level: 1 }).count(), 1)

      await page.getByRole("link", { name: "下一条", exact: true }).click()
      await page.waitForURL(url => url.searchParams.get("q") === item.query && url.pathname !== new URL(href, baseUrl).pathname)
      await page.getByTestId("reference-back").click()
      await page.waitForURL(url => url.pathname === item.path && url.searchParams.get("q") === item.query)
      assert.equal(await page.getByRole("textbox", { name: item.label }).inputValue(), item.query)
      await page.reload({ waitUntil: "networkidle" })
      assert.equal(await page.getByRole("textbox", { name: item.label }).inputValue(), item.query)

      await page.getByRole("button", { name: "清除搜索", exact: true }).click()
      await page.waitForURL(url => !url.searchParams.has("q"))
      await page.getByRole("button", { name: "下一页", exact: true }).first().click()
      await page.waitForURL(url => url.searchParams.get("page") === "2")
      const pageTwoTitle = await page.locator("#reference-results h2").first().innerText()
      await page.locator("#reference-results a").first().click()
      await page.getByTestId("reference-document").waitFor()
      await page.getByTestId("reference-back").click()
      await page.waitForURL(url => url.pathname === item.path && url.searchParams.get("page") === "2")
      assert.equal(await page.locator("#reference-results h2").first().innerText(), pageTwoTitle)
      await page.goBack({ waitUntil: "networkidle" })
      await page.getByTestId("reference-document").waitFor()
      await page.getByRole("button", { name: "打开听力控制面板", exact: true }).click()
      await page.getByRole("dialog").waitFor()
      const readerUrl = page.url()
      await page.keyboard.press("ArrowRight")
      assert.equal(page.url(), readerUrl, "a reader shortcut must not navigate beneath an open dialog")
      await page.keyboard.press("Escape")
      await page.getByRole("dialog").waitFor({ state: "hidden" })
      assert.equal(page.url(), readerUrl)
      await page.getByRole("heading", { level: 1 }).click()
      await page.keyboard.press("Escape")
      await page.waitForURL(url => url.pathname === item.path && url.searchParams.get("page") === "2")
      evidence.push({ route: item.path, queryRestored: true, pageRestored: true, nativeDocument: true, dialogShortcutsIsolated: true })
    }

    await page.goto(`${baseUrl}/pragmatics/p-aisatsu-morning`, { waitUntil: "networkidle" })
    await page.getByRole("button", { name: "切换为深色主题", exact: true }).click()
    await page.getByRole("button", { name: "切换为明亮主题", exact: true }).waitFor()
    assert.equal(await page.locator("html").evaluate(el => el.classList.contains("dark")), true)
    await page.evaluate(() => window.scrollTo({ top: 600, behavior: "instant" }))
    await page.evaluate(() => window.dispatchEvent(new CustomEvent("yasashi:learning-write:error", { detail: "failed" })))
    const notice = page.getByTestId("learning-storage-notice")
    await notice.waitFor()
    const rect = await notice.boundingBox()
    const header = await page.locator("header.paper-nav").boundingBox()
    assert.ok(rect.y >= header.y + header.height, "save failure notice must be below the fixed navigation while scrolled")
    assert.ok(rect.y + rect.height <= 844, "save failure copy and dismissal must fit the viewport")
    await notice.getByRole("button", { name: "关闭保存提示", exact: true }).click()
    await notice.waitFor({ state: "hidden" })
    assert.deepEqual(errors, [])
    evidence.push({ themeActionLabels: true, scrolledSaveNoticeVisible: true, noticeDismissible: true, pageErrors: errors })
  } finally { await context.close() }

  const unsupportedContext = await browser.newContext({ viewport: { width: 320, height: 568 }, serviceWorkers: "block" })
  try {
    await unsupportedContext.addInitScript(() => Object.defineProperty(Navigator.prototype, "locks", { configurable: true, get: () => undefined }))
    const unsupportedPage = await unsupportedContext.newPage()
    await unsupportedPage.goto(baseUrl, { waitUntil: "networkidle" })
    const notice = unsupportedPage.getByTestId("learning-storage-notice")
    await notice.waitFor()
    const rect = await notice.boundingBox()
    const header = await unsupportedPage.locator("header.paper-nav").boundingBox()
    assert.ok(rect.y >= header.y + header.height)
    assert.ok(rect.y + rect.height <= 568)
    await notice.getByRole("button", { name: "关闭保存提示", exact: true }).click()
    await notice.waitFor({ state: "hidden" })
    evidence.push({ unsupportedBrowserNoticeVisible: true, narrowViewport: 320 })
  } finally { await unsupportedContext.close() }
  const output = process.env.UI_EVIDENCE_DIR ?? "output/playwright/holistic-20260912"
  fs.mkdirSync(output, { recursive: true })
  fs.writeFileSync(`${output}/reference-experience.json`, JSON.stringify(evidence, null, 2))
  console.log("Reference navigation, document reading, theme and storage-notice experience passed")
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { chromium } = await import("playwright")
  const browser = await chromium.launch({ headless: true })
  try { await verifyReferenceExperience(browser, process.env.E2E_BASE_URL ?? "http://127.0.0.1:3217") }
  finally { await browser.close() }
}
