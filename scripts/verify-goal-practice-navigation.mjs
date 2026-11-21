import assert from "node:assert/strict"
import fs from "node:fs"
import { chromium } from "playwright"
import { loadTsModule } from "../tests/unit/load-ts-module.mjs"

const base = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3218"
const out = `${process.env.UI_EVIDENCE_DIR ?? "output/playwright/product-audit-20260912"}/goal-navigation`
const { STORAGE_KEYS } = await loadTsModule("src/lib/storage-keys.ts")
const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" })
const profile = { goal: "media", kanaLevel: "none", romajiMode: "practice", minutesPerDay: 10, selfAssessedLevel: "unknown", createdAt: 1, updatedAt: 1 }
await context.addInitScript(({ key, profile }) => { if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(profile)) }, { key: STORAGE_KEYS.USER_PROFILE, profile })
const page = await context.newPage()
const errors = []
page.on("pageerror", error => errors.push(error.message))
const rows = []
fs.mkdirSync(out, { recursive: true })
try {
  for (const [path, source, level] of [["/", "home", "N2"], ["/path", "path", "N3"]]) {
    await page.goto(`${base}${path}`, { waitUntil: "networkidle" })
    await page.getByRole("group", { name: "动漫情境难度" }).getByRole("button", { name: level, exact: true }).click()
    await page.waitForURL(url => url.searchParams.get("mediaLevel") === level)
    await page.reload({ waitUntil: "networkidle" })
    const selected = page.getByRole("group", { name: "动漫情境难度" }).getByRole("button", { name: level, exact: true })
    assert.equal(await selected.getAttribute("aria-pressed"), "true", "material selection survives refresh")
    const taskLink = page.getByTestId("goal-practice").locator("[data-goal-task]").first().getByRole("link")
    const href = await taskLink.getAttribute("href")
    const taskUrl = new URL(href, base)
    assert.equal(taskUrl.searchParams.get("source"), source)
    assert.equal(taskUrl.searchParams.get("mediaLevel"), level)
    await taskLink.click()
    await page.getByTestId("written-work").waitFor()
    const back = page.getByTestId("goal-practice-return")
    const expected = `${path}?mediaLevel=${level}#goal-practice`
    await page.waitForFunction(expected => document.querySelector('[data-testid="goal-practice-return"]')?.getAttribute("href") === expected, expected)
    await page.getByRole("textbox").fill(`${level}の課題について、自分の考えを書きます。`)
    await page.getByTestId("work-save-status").filter({ hasText: "已保存草稿" }).waitFor()
    await page.reload({ waitUntil: "networkidle" })
    assert.equal(await page.getByRole("textbox").inputValue(), `${level}の課題について、自分の考えを書きます。`)
    await back.click()
    await page.waitForURL(`${base}${expected}`)
    assert.equal(await selected.getAttribute("aria-pressed"), "true")
    assert.ok((await page.getByTestId("goal-practice").innerText()).includes(`动漫理解 · ${level}`))
    assert.deepEqual(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), STORAGE_KEYS.USER_PROFILE), profile, "viewing a different stage must not change the learning profile")
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false)
    await page.getByTestId("goal-practice").scrollIntoViewIfNeeded()
    await page.screenshot({ path: `${out}/${source}-${level}-returned.png` })
    rows.push({ source, level, taskHref: href, returnedTo: page.url(), refreshRetainedSelection: true, draftRetained: true, profileUnchanged: true })
  }
  for (const suffix of ["", "?source=https%3A%2F%2Fexample.com&mediaLevel=N2"]) {
    await page.goto(`${base}/practice/media-address${suffix}`, { waitUntil: "networkidle" })
    assert.equal(await page.getByTestId("goal-practice-return").getAttribute("href"), "/#daily-study-plan")
  }
  assert.deepEqual(errors, [])
  fs.writeFileSync(`${out}/report.json`, JSON.stringify({ passed: true, rows, legacyDailyReturn: true, unknownSourceIgnored: true, errors }, null, 2))
  console.log("Goal navigation passed: home/path source, selected difficulty, refresh, draft preservation, unchanged profile, legacy daily return.")
} finally {
  await context.close()
  await browser.close()
}
