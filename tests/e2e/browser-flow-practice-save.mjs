import assert from "node:assert/strict"

import { readJsonStorage } from "./harness.mjs"
import { openQuizMode, seedReviewState } from "./browser-fixtures.mjs"
import { E2E_STORAGE_KEYS } from "./storage-keys.mjs"

async function failStorageKeyWrites(page, key, failureMessage) {
  await page.evaluate(({ key: targetKey, failureMessage: message }) => {
    window.__yasashiRestoreSetItem?.()
    const originalSetItem = Storage.prototype.setItem
    window.__yasashiRestoreSetItem = () => {
      Storage.prototype.setItem = originalSetItem
      delete window.__yasashiRestoreSetItem
    }
    Storage.prototype.setItem = function setItemWithE2EFailure(storageKey, value) {
      if (storageKey === targetKey) throw new Error(message)
      return originalSetItem.call(this, storageKey, value)
    }
  }, { key, failureMessage })
}

async function failPracticeResultWrites(page) {
  await failStorageKeyWrites(page, E2E_STORAGE_KEYS.PRACTICE_RESULTS, "E2E simulated practice write failure")
}

async function failReviewSrsWrites(page) {
  await failStorageKeyWrites(page, E2E_STORAGE_KEYS.SRS_KANA, "E2E simulated review SRS write failure")
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

  await seedReviewState(page, baseUrl)
  await page.goto(`${baseUrl}/review`, { waitUntil: "networkidle" })
  await page.getByTestId("review-start-today").click()
  const beforeSrsFailure = {
    practice: await readJsonStorage(page, E2E_STORAGE_KEYS.PRACTICE_RESULTS),
    mistakes: await readJsonStorage(page, E2E_STORAGE_KEYS.MISTAKES),
    kanaSrs: await readJsonStorage(page, E2E_STORAGE_KEYS.SRS_KANA),
  }
  const wrongKanaOption = await page.evaluate(() => {
    const option = Array.from(document.querySelectorAll('[data-testid^="review-answer-"]'))
      .find((button) => button.getAttribute("data-testid") !== "review-answer-a")
    return option?.getAttribute("data-testid")
  })
  assert.ok(wrongKanaOption, "kana review should expose a wrong answer option for SRS failure testing")
  await failReviewSrsWrites(page)
  await page.getByTestId(wrongKanaOption).click()
  await page.getByTestId("practice-save-error").waitFor({ state: "visible" })
  assert.equal(await page.getByTestId("review-next").isVisible(), false)
  assert.equal(await page.getByTestId(wrongKanaOption).getAttribute("aria-pressed"), "false")
  assert.deepEqual(
    await readJsonStorage(page, E2E_STORAGE_KEYS.PRACTICE_RESULTS),
    beforeSrsFailure.practice,
    "failed review SRS write should roll back practice history"
  )
  assert.deepEqual(
    await readJsonStorage(page, E2E_STORAGE_KEYS.MISTAKES),
    beforeSrsFailure.mistakes,
    "failed review SRS write should roll back mistake notebook writes"
  )
  assert.deepEqual(
    await readJsonStorage(page, E2E_STORAGE_KEYS.SRS_KANA),
    beforeSrsFailure.kanaSrs,
    "failed review SRS write should keep the original kana SRS state"
  )
  await restorePracticeResultWrites(page)

  await page.goto(`${baseUrl}/learn/day-1-a-row-hello`, { waitUntil: "networkidle" })
  await page.evaluate(() => localStorage.clear())
  await page.reload({ waitUntil: "networkidle" })
  await page.getByTestId("lesson-next").click()
  await page.getByTestId("lesson-next").click()
  await page.getByTestId("lesson-answer-a").waitFor({ state: "visible" })
  await failPracticeResultWrites(page)
  await page.getByTestId("lesson-answer-a").click()
  await page.getByTestId("practice-save-error").waitFor({ state: "visible" })
  assert.equal(await page.getByTestId("lesson-next").isDisabled(), true)
  assert.equal(await readJsonStorage(page, E2E_STORAGE_KEYS.PRACTICE_RESULTS), null)
  assert.equal(await readJsonStorage(page, E2E_STORAGE_KEYS.ITEM_PROGRESS), null)
  assert.equal((await readJsonStorage(page, E2E_STORAGE_KEYS.SRS_KANA))?.a, undefined)
  await restorePracticeResultWrites(page)
}
