import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { openQuizModeWithLearningState, quizVocabIdsByLevel } from "../tests/e2e/browser-fixture-quiz.mjs"
import { seionHiraganaIds } from "../tests/e2e/browser-fixture-kana.mjs"
import { E2E_STORAGE_KEYS } from "../tests/e2e/storage-keys.mjs"

export async function verifyProductUx(browser, baseUrl) {
  // This owned browser context is separate from the user's profile and learning data.
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" })
  const page = await context.newPage()
  page.setDefaultTimeout(30_000)
  page.setDefaultNavigationTimeout(90_000)
  const errors = []
  const evidence = []
  const output = process.env.UI_EVIDENCE_DIR ?? "output/playwright/product-audit-20260912"
  fs.mkdirSync(output, { recursive: true })
  const outputFile = path.join(output, "product-ux.json")
  fs.writeFileSync(outputFile, JSON.stringify({ passed: false, status: "running", baseUrl, recordedAt: new Date().toISOString() }, null, 2))
  page.on("pageerror", error => errors.push(error.message))
  const measure = async name => evidence.push({ name, ...await page.evaluate(() => ({
    height: document.documentElement.scrollHeight,
    overflow: document.documentElement.scrollWidth > innerWidth,
    heading: document.querySelector("h1")?.textContent,
  })) })
  try {
    await page.goto(`${baseUrl}/path`, { waitUntil: "networkidle" })
    await page.getByTestId("path-course-unit-1").waitFor()
    const courseIds = await page.locator("[data-course-lesson]").evaluateAll(rows => rows.map(row => row.getAttribute("data-course-lesson")))
    assert.equal(courseIds.length, 175, "all 175 lessons must remain in the course map")
    assert.equal(new Set(courseIds).size, 175, "each lesson must occur in exactly one unit")
    assert.equal(await page.locator('[data-course-lesson][aria-disabled="true"]').count(), 174, "a fresh learner can only enter the first course")
    assert.equal(await page.locator('a[data-course-lesson][aria-disabled="true"]').count(), 0, "locked course rows must not be links")
    assert.equal((await page.locator('[data-course-lesson="day-1-a-row-hello"]').innerText()).match(/第\s*1\s*课/g)?.length, 1, "the lesson number must not repeat inside its title")
    assert.equal(await page.getByTestId("path-course-unit-1").getAttribute("aria-expanded"), "true")
    assert.equal(await page.getByTestId("path-course-unit-2").getAttribute("aria-expanded"), "false")
    assert.equal(await page.getByTestId("path-unit-lessons-1").locator(":scope > *").count(), 5)
    assert.equal(await page.getByTestId("path-unit-lessons-2").isVisible(), false)
    assert.equal(await page.getByTestId("path-progress-details").getAttribute("open"), null)
    assert.equal(await page.getByTestId("path-supplementary-practice").getAttribute("open"), null)
    assert.equal(await page.getByTestId("path-placement-link").getAttribute("href"), "/placement")
    await measure("path-initial")
    await page.getByTestId("path-course-unit-2").click()
    assert.equal(await page.getByTestId("path-unit-lessons-2").isVisible(), true)
    assert.equal(await page.getByTestId("path-unit-lessons-2").locator('[aria-disabled="true"]').count(), 5, "expanding a unit must not unlock its lessons")
    await page.getByTestId("path-course-phase-n4").click()
    await page.getByTestId("path-course-unit-10").click()
    assert.equal(await page.getByTestId("path-unit-lessons-10").locator('[aria-disabled="true"]').count(), 5)
    await page.evaluate(key => localStorage.setItem(key, JSON.stringify({ goal: "balanced", minutesPerDay: 10, kanaLevel: "solid", romajiMode: "practice", createdAt: 1, updatedAt: 1 })), E2E_STORAGE_KEYS.USER_PROFILE)
    await page.goto(`${baseUrl}/path`, { waitUntil: "networkidle" })
    assert.equal(await page.getByTestId("path-course-unit-5").getAttribute("aria-expanded"), "true", "foundation skipping must reveal the unit containing lesson 22")
    assert.equal(await page.getByTestId("path-course-unit-1").getAttribute("aria-expanded"), "false")

    await page.goto(`${baseUrl}/placement`, { waitUntil: "networkidle" })
    for (const phase of ["n5", "n4", "n3", "n2"]) {
      const details = page.getByTestId(`placement-coverage-${phase}`)
      assert.equal(await details.getAttribute("open"), null)
      const card = page.locator(`section#${phase}`)
      assert.equal(await card.getByRole("link", { name: "进入阶段诊断", exact: true }).isVisible(), true)
      await details.locator("summary").click()
      assert.match(await details.innerText(), /独立输入题/)
      await details.locator("summary").click()
    }
    await measure("placement-initial")
    await page.getByRole("button", { name: "打开导航菜单" }).click()
    const menu = page.getByRole("dialog")
    await menu.waitFor({ state: "visible" })
    for (const name of ["学习", "查阅", "设置"]) assert.equal(await menu.getByRole("heading", { name, exact: true }).isVisible(), true)
    await menu.getByRole("link", { name: "找学习起点" }).click()
    await page.waitForFunction(() => !document.querySelector('[role="dialog"]'))

    for (const [mode, seed, toggle, scope] of [
      ["hiragana-romaji", { masteredKana: seionHiraganaIds }, "quiz-only-unmastered-kana", "quiz-kana-scope-all"],
      ["meaning-vocab", { learnedVocab: quizVocabIdsByLevel.survival }, "quiz-only-unlearned-vocab", "quiz-vocab-scope-daily"],
    ]) {
      await openQuizModeWithLearningState(page, baseUrl, mode, seed)
      await page.getByTestId(toggle).click()
      await page.getByTestId("quiz-empty-state").waitFor()
      assert.equal(await page.getByTestId(scope).isVisible(), true, "empty results must keep range controls usable")
      await page.getByTestId("quiz-clear-filters").click()
      await page.locator('[data-testid^="quiz-answer-option-"]').first().waitFor()
      assert.equal(await page.getByTestId(toggle).getAttribute("aria-pressed"), "false")
      await page.locator('[data-testid^="quiz-answer-option-"]').first().click()
      await page.getByTestId("quiz-next-question").waitFor()
      assert.match(await page.getByTestId("quiz-score").innerText(), /\/1\b/, "recovery must still save and score the next actual answer")
    }

    await page.goto(`${baseUrl}/placement/n5`, { waitUntil: "networkidle" })
    await page.getByRole("button", { name: "开始本阶段诊断", exact: true }).click()
    for (let index = 0; index < 16; index++) {
      await page.waitForFunction(() => document.activeElement?.getAttribute("data-testid") === "diagnostic-question-heading")
      const prompt = await page.getByTestId("diagnostic-question-heading").innerText()
      if (index === 8) {
        await page.getByTestId("diagnostic-passage").waitFor()
        const questionForm = page.getByTestId("diagnostic-question")
        const selected = questionForm.getByRole("radio").first()
        await selected.check()
        const selectedValue = await selected.inputValue()
        const originalRecord = await page.evaluate(key => localStorage.getItem(key), E2E_STORAGE_KEYS.DIAGNOSTICS)
        await page.evaluate(key => {
          const original = Storage.prototype.setItem
          window.__restoreDiagnosticStorageForUxTest = () => { Storage.prototype.setItem = original }
          Storage.prototype.setItem = function (storageKey, value) {
            if (storageKey === key) throw new DOMException("Storage is full", "QuotaExceededError")
            return original.call(this, storageKey, value)
          }
        }, E2E_STORAGE_KEYS.DIAGNOSTICS)
        // The long reading item scrolls past the page-level error copy. Each failed
        // attempt must bring that copy back into view without changing the answer.
        for (let failure = 0; failure < 2; failure++) {
          await questionForm.getByRole("button", { name: "确认并继续", exact: true }).click()
          await page.waitForFunction(() => document.activeElement?.getAttribute("data-testid") === "diagnostic-save-error")
          const errorBox = await page.getByTestId("diagnostic-save-error").boundingBox()
          const header = await page.locator("header.paper-nav").boundingBox()
          assert.ok(errorBox.y >= header.y + header.height && errorBox.y + errorBox.height <= 844, "diagnostic failure copy must be visible below navigation")
          assert.equal(await page.getByTestId("diagnostic-question-heading").innerText(), prompt, "a failed diagnostic save must not advance the question")
          assert.equal(await questionForm.locator("input:checked").inputValue(), selectedValue, "failed saves retain the selected answer")
          assert.equal(await page.evaluate(key => localStorage.getItem(key), E2E_STORAGE_KEYS.DIAGNOSTICS), originalRecord, "failed answers must not change stored diagnostics")
        }
        await page.evaluate(() => {
          window.__restoreDiagnosticStorageForUxTest()
          delete window.__restoreDiagnosticStorageForUxTest
        })
        evidence.push({ name: "diagnostic-reading-save-failure", visibleFailureFocus: true, inputRetained: true, storedRecordUnchanged: true, repeatedFailure: true })
      }
      await page.getByRole("button", { name: "不会，跳过此题", exact: true }).click()
      await page.waitForFunction(previous => {
        const next = document.querySelector('[data-testid="diagnostic-question-heading"]')
        return next?.textContent !== previous
      }, prompt)
    }
    await page.waitForFunction(() => document.activeElement?.getAttribute("data-testid") === "diagnostic-result-heading")
    assert.match(await page.getByTestId("diagnostic-result").innerText(), /独立答对 0\/16/)
    assert.equal(await page.getByTestId("diagnostic-question").count(), 0)
    await measure("diagnostic-completed")
    assert.deepEqual(errors, [], "new product flows must have no browser exceptions")
    assert.equal(evidence.some(row => row.overflow), false, "product flows must fit the mobile viewport")
    fs.writeFileSync(outputFile, JSON.stringify({ passed: true, baseUrl, recordedAt: new Date().toISOString(), evidence }, null, 2))
    console.log("Product UX passed: 5-lesson units, retained locks, placement actions, grouped navigation, both empty-filter recovery modes, diagnostic question/result focus")
  } catch (error) {
    fs.writeFileSync(outputFile, JSON.stringify({ passed: false, baseUrl, recordedAt: new Date().toISOString(), error: error.message, browserErrors: errors, evidence }, null, 2))
    throw error
  } finally { await context.close() }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { chromium } = await import("playwright")
  const browser = await chromium.launch({ headless: true })
  try { await verifyProductUx(browser, process.env.E2E_BASE_URL ?? "http://127.0.0.1:3217") }
  finally { await browser.close() }
}
