import assert from "node:assert/strict"
import fs from "node:fs"
import { fileURLToPath } from "node:url"
import { E2E_STORAGE_KEYS, managedLearningBackupKeys } from "../tests/e2e/storage-keys.mjs"

const LOCK_NAME = "yasashi:learning:write:v1"

async function holdLock(page) {
  await page.evaluate(name => {
    window.__auditLockHeld = false
    void navigator.locks.request(name, () => new Promise(resolve => {
      window.__releaseAuditLock = resolve
      window.__auditLockHeld = true
    }))
  }, LOCK_NAME)
  await page.waitForFunction(() => window.__auditLockHeld)
}

async function waitForQueued(page, count) {
  await page.waitForFunction(async ({ name, count }) => {
    const locks = await navigator.locks.query()
    return locks.pending.filter(lock => lock.name === name).length >= count
  }, { name: LOCK_NAME, count })
}

async function releaseLock(page) { await page.evaluate(() => window.__releaseAuditLock()) }
async function read(page, key, fallback = null) {
  return page.evaluate(({ key, fallback }) => JSON.parse(localStorage.getItem(key) ?? JSON.stringify(fallback)), { key, fallback })
}

export async function verifyLearningConcurrency(browser, baseUrl) {
  const context = await browser.newContext({ serviceWorkers: "block" })
  const [first, second, holder] = await Promise.all([context.newPage(), context.newPage(), context.newPage()])
  const errors = [], checks = []
  for (const page of [first, second, holder]) page.on("pageerror", error => errors.push(String(error)))
  try {
    await holder.goto(baseUrl, { waitUntil: "networkidle" })
    await Promise.all([first, second].map(page => page.goto(baseUrl + "/kana", { waitUntil: "networkidle" })))
    await first.getByTestId("kana-card-a").click()
    await second.getByTestId("kana-card-i").click()
    await holdLock(holder)
    await Promise.all([first, second].map(page => page.getByTestId("kana-mastery-toggle").click()))
    await waitForQueued(holder, 2)
    assert.equal(await read(holder, E2E_STORAGE_KEYS.KANA_MASTERED), null, "Waiting UI actions must not write before acquiring the lock")
    await releaseLock(holder)
    await holder.waitForFunction(key => JSON.parse(localStorage.getItem(key) ?? "[]").length === 2, E2E_STORAGE_KEYS.KANA_MASTERED)
    assert.deepEqual((await read(holder, E2E_STORAGE_KEYS.KANA_MASTERED)).sort(), ["hiragana:a", "hiragana:i"])
    assert.deepEqual(Object.keys(await read(holder, E2E_STORAGE_KEYS.SRS_KANA)).sort(), ["hiragana:a", "hiragana:i"])
    checks.push("Two tabs preserve both mastery marks and SRS entries")

    await Promise.all([first, second].map(async page => {
      await page.goto(baseUrl + "/quiz", { waitUntil: "networkidle" })
      await page.getByTestId("quiz-mode-hiragana-romaji").click()
      await page.locator('[data-testid^="quiz-answer-option-"]').first().waitFor()
    }))
    await holdLock(holder)
    await Promise.all([first, second].map(page => page.locator('[data-testid^="quiz-answer-option-"]').first().click()))
    await waitForQueued(holder, 2)
    await releaseLock(holder)
    await holder.waitForFunction(key => JSON.parse(localStorage.getItem(key) ?? "[]").length === 2, E2E_STORAGE_KEYS.PRACTICE_RESULTS)
    assert.equal(Object.values(await read(holder, E2E_STORAGE_KEYS.ITEM_PROGRESS)).reduce((sum, item) => sum + item.attempts, 0), 2)
    assert.equal(Object.values(await read(holder, E2E_STORAGE_KEYS.STUDY_CALENDAR)).reduce((sum, day) => sum + day.practiceCount, 0), 2)
    checks.push("Concurrent quiz answers retain both history, mastery, and calendar updates")

    await first.goto(baseUrl + "/learn/day-1-a-row-hello", { waitUntil: "networkidle" })
    await first.getByTestId("lesson-next").click()
    await first.getByTestId("lesson-next").click()
    await first.getByTestId("lesson-answer-a").waitFor()
    await second.goto(baseUrl + "/learn/day-1-a-row-hello", { waitUntil: "networkidle" })
    await second.getByTestId("lesson-answer-a").waitFor()
    const previousCount = (await read(holder, E2E_STORAGE_KEYS.PRACTICE_RESULTS)).length
    await holdLock(holder)
    await Promise.all([first, second].map(page => page.getByTestId("lesson-answer-a").click()))
    await waitForQueued(holder, 2)
    await releaseLock(holder)
    await Promise.all([first, second].map(page => page.waitForFunction(() => document.querySelector('[data-testid="lesson-answer-a"]').disabled)))
    assert.equal((await read(holder, E2E_STORAGE_KEYS.PRACTICE_RESULTS)).length, previousCount + 1, "The same lesson step and attempt must be recorded once across tabs")
    checks.push("Simultaneous submissions of one lesson step are idempotent")

    await first.goto(baseUrl + "/review", { waitUntil: "networkidle" })
    await second.goto(baseUrl + "/kana", { waitUntil: "networkidle" })
    await second.getByTestId("kana-card-ka").click()
    await first.getByTestId("learning-data-reset").click()
    await holdLock(holder)
    await first.getByTestId("learning-data-reset-dialog-confirm").click()
    await waitForQueued(holder, 1)
    await second.getByTestId("kana-mastery-toggle").click()
    await waitForQueued(holder, 2)
    await releaseLock(holder)
    await second.getByTestId("practice-save-error").waitFor()
    await second.keyboard.press("Escape")
    await second.getByText(/另一页面刚刚导入或重置了学习数据，本次操作已取消/).waitFor()
    for (const key of managedLearningBackupKeys) assert.equal(await read(holder, key), null, key + " stays cleared")
    checks.push("Reset invalidates a queued write instead of recreating cleared data")
    assert.deepEqual(errors, [])
    console.log("Learning concurrency validation passed")
  } finally {
    const out = process.env.UI_EVIDENCE_DIR ?? "output/playwright/maturity-20260905"
    fs.mkdirSync(out, { recursive: true })
    fs.writeFileSync(`${out}/concurrency.json`, JSON.stringify({ checks, errors }, null, 2))
    await context.close()
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { chromium } = await import("playwright")
  const browser = await chromium.launch({ headless: true })
  try { await verifyLearningConcurrency(browser, process.env.E2E_BASE_URL ?? "http://127.0.0.1:3217") }
  finally { await browser.close() }
}
