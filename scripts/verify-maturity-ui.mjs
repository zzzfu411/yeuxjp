import assert from "node:assert/strict"
import fs from "node:fs"
import { fileURLToPath } from "node:url"

export async function verifyMaturityUi(base = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3217") {
const { chromium } = await import("playwright")
const out = process.env.UI_EVIDENCE_DIR ?? "output/playwright/maturity-20260905"
fs.mkdirSync(out, { recursive: true })
const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" })
const page = await context.newPage()
const records = [], errors = []
page.on("pageerror", error => errors.push(String(error)))
try {
  for (const width of [390, 1440, 320]) {
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 })
    for (const route of ["/", "/vocabulary", "/learn/day-1-a-row-hello", "/semantics", "/pragmatics", "/grammar"]) {
      await page.goto(base + route, { waitUntil: "networkidle" })
      await page.screenshot({ path: `${out}/${width}-${route.replaceAll("/", "_") || "home"}.png` })
      records.push({ route, ...await page.evaluate(() => {
        const card = document.querySelector(".vocab-flashcard")
        const lesson = document.querySelector('[aria-label="课程内容"]')
        return { width: innerWidth, scrollWidth: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight,
          elements: document.querySelectorAll("*").length, cards: document.querySelectorAll(".vocab-flashcard").length,
          firstCardTop: card?.getBoundingClientRect().top, lessonBodyTop: lesson?.getBoundingClientRect().top,
          firstWordBottom: card?.querySelector('.font-jp')?.getBoundingClientRect().bottom,
          scriptBytes: performance.getEntriesByType("resource").filter(r => r.initiatorType === "script").reduce((sum, r) => sum + r.encodedBodySize, 0) }
      }) })
    }
  }
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(base + "/vocabulary", { waitUntil: "networkidle" })
  await page.getByRole("navigation", { name: "结果分页" }).first().getByRole("button", { name: "下一页" }).click()
  await page.waitForURL(/page=2/)
  const secondPageFirst = await page.locator('[data-testid^="vocabulary-expand-"]').first().getAttribute("data-testid")
  await page.reload({ waitUntil: "networkidle" })
  assert.equal(await page.locator('[data-testid^="vocabulary-expand-"]').first().getAttribute("data-testid"), secondPageFirst)
  for (const [route, expected] of [
    ["/vocabulary?level=survival&item=sur-g-1", "こんにちは"],
    ["/grammar?level=N5&item=n5-wa", "は"],
    ["/kana?mode=katakana&set=dakuon&item=katakana%3Aga", "ガ"],
  ]) {
    await page.goto(base + route, { waitUntil: "networkidle" })
    const dialog = page.getByRole("dialog")
    await dialog.waitFor({ state: "visible" })
    assert.ok((await dialog.innerText()).includes(expected), route + " opens the intended entry")
    assert.ok(await page.locator("main").evaluate(el => !!el.closest("[inert]")), "Open dialogs isolate the main content")
    await page.keyboard.press("Escape")
    await dialog.waitFor({ state: "hidden" })
    assert.equal(await page.locator("main").evaluate(el => !!el.closest("[inert]")), false)
  }
  await page.goto(base, { waitUntil: "networkidle" })
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 844 })
    await page.goto(base, { waitUntil: "networkidle" })
    assert.equal(await page.getByTestId("home-start-learning").count(), 1, "Home has one primary learning action")
    if (width === 390) {
      const action = await page.getByTestId("home-start-learning").boundingBox()
      assert.ok(action && action.y + action.height <= 844, "The learning action is visible in the first mobile screen")
    }
    assert.equal(await page.getByRole("dialog").count(), 0, "First-run settings do not interrupt learning")
    const settings = page.getByTestId("home-edit-profile")
    await settings.click()
    await page.getByRole("dialog", { name: "学习设置", exact: true }).waitFor()
    assert.ok(await page.locator("main").evaluate(el => !!el.closest("[inert]")))
    await page.getByTestId("onboarding-goal-travel").click()
    await page.getByTestId("home-edit-profile-cancel").click()
    await page.getByRole("dialog").waitFor({ state: "hidden" })
    assert.equal(await settings.evaluate(el => el === document.activeElement), true, "Settings focus returns to its trigger")
    await settings.click()
    assert.equal(await page.getByTestId("onboarding-goal-balanced").getAttribute("aria-pressed"), "true", "Cancel discards unsaved profile choices")
    await page.keyboard.press("Escape")
    await page.getByRole("dialog").waitFor({ state: "hidden" })
  }
  await page.setViewportSize({ width: 390, height: 844 })
  const menu = page.getByRole("button", { name: "打开导航菜单" })
  await menu.click()
  await page.getByRole("dialog").waitFor({ state: "visible" })
  assert.equal(await page.getByRole("navigation", { name: "移动导航" }).getByRole("link").count(), 10)
  await page.keyboard.press("Escape")
  await page.getByRole("dialog").waitFor({ state: "hidden" })
  assert.equal(await menu.evaluate(el => el === document.activeElement), true, "Menu focus returns to its trigger")
  await page.goto(base + "/semantics", { waitUntil: "networkidle" })
  await page.getByRole("textbox", { name: "搜索语义辨析" }).fill("不存在xyz")
  await page.getByText("没有匹配内容，试试更短的关键词。").waitFor()
  await page.getByRole("textbox", { name: "搜索语义辨析" }).fill("知る")
  assert.ok(await page.locator('a[href="/semantics/s-shiru-wakaru"]').isVisible())
  for (const record of records) {
    assert.ok(record.scrollWidth <= record.width + 1, `${record.width} ${record.route}: horizontal overflow`)
    if (record.route === "/vocabulary") assert.equal(record.cards, 24)
    if (record.route === "/vocabulary" && record.width === 390) assert.ok(record.firstCardTop < 800, "A vocabulary card should enter the first mobile screen")
    if (record.route === "/vocabulary" && record.width === 390) assert.ok(record.firstWordBottom < 844, "The first word must be fully readable before scrolling")
    if (record.route.startsWith("/learn") && record.width === 390) assert.ok(record.lessonBodyTop < 400, "Lesson content should enter the upper mobile screen")
  }
  assert.deepEqual(errors, [])
  console.log("Maturity UI validation passed")
} catch (error) {
  await page.screenshot({ path: `${out}/failure.png` })
  errors.push(String(error))
  throw error
} finally {
  fs.writeFileSync(`${out}/evidence.json`, JSON.stringify({ records, errors }, null, 2))
  await browser.close()
}
}
if (process.argv[1] === fileURLToPath(import.meta.url)) await verifyMaturityUi()
