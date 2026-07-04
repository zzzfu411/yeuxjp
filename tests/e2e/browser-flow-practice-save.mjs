import assert from "node:assert/strict"

import { readJsonStorage } from "./harness.mjs"
import { openQuizMode, seedReviewState } from "./browser-fixtures.mjs"
import { E2E_STORAGE_KEYS } from "./storage-keys.mjs"

async function failPracticeResultWrites(page) {
  await page.evaluate((key) => {
    const originalSetItem = Storage.prototype.setItem
    window.__yasashiRestoreSetItem = () => {
      Storage.prototype.setItem = originalSetItem
      delete window.__yasashiRestoreSetItem
    }
    Storage.prototype.setItem = function setItemWithE2EFailure(storageKey, value) {
      if (storageKey === key) throw new Error("E2E simulated practice write failure")
      return originalSetItem.call(this, storageKey, value)
    }
  }, E2E_STORAGE_KEYS.PRACTICE_RESULTS)
}

async function restorePracticeResultWrites(page) {
  await page.evaluate(() => {
    window.__yasashiRestoreSetItem?.()
  })
}

export async function verifyPracticeSaveFailureFlow(page, baseUrl) {
  await openQuizMode(page, baseUrl, "hiragana-romaji")
  await failPracticeResultWrites(page)
  await page.locator('[data-testid^="quiz-answer-option-"]').first().click()
  await page.getByTestId("practice-save-error").waitFor({ state: "visible" })
  assert.match(await page.getByTestId("quiz-score").innerText(), /0\/0\b/)
  assert.equal(await readJsonStorage(page, E2E_STORAGE_KEYS.PRACTICE_RESULTS), null)
  assert.equal(await page.locator('[data-testid^="quiz-answer-option-"]').first().isEnabled(), true)
  await restorePracticeResultWrites(page)

  await seedReviewState(page, baseUrl)
  await page.goto(`${baseUrl}/review`, { waitUntil: "networkidle" })
  await page.getByTestId("review-start-today").click()
  await failPracticeResultWrites(page)
  await page.getByTestId("review-answer-a").click()
  await page.getByTestId("practice-save-error").waitFor({ state: "visible" })
  assert.match(await page.getByTestId("review-remaining").innerText(), /1\b/)
  assert.equal(await readJsonStorage(page, E2E_STORAGE_KEYS.PRACTICE_RESULTS), null)
  const kanaSrs = await readJsonStorage(page, E2E_STORAGE_KEYS.SRS_KANA)
  assert.equal(kanaSrs?.a?.box, 1)
  assert.equal(kanaSrs?.a?.right, 0)
  assert.equal(await page.getByTestId("review-answer-a").isEnabled(), true)
  await restorePracticeResultWrites(page)
}
