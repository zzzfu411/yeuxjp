import assert from "node:assert/strict"

import { readJsonStorage } from "./harness.mjs"
import { seedMixedReviewState, seedReviewState } from "./browser-fixtures.mjs"
import { E2E_STORAGE_KEYS } from "./storage-keys.mjs"

export async function verifyInitialReviewEmptyState(page, baseUrl) {
  await page.goto(`${baseUrl}/review`, { waitUntil: "networkidle" })
  await page.getByTestId("review-empty-state").waitFor({ state: "visible" })
  await page.getByTestId("review-today-empty").waitFor({ state: "visible" })
}

async function startActiveKanaReview(page, baseUrl) {
  await seedReviewState(page, baseUrl)
  await page.goto(`${baseUrl}/review`, { waitUntil: "networkidle" })
  await page.getByTestId("review-start-kana").click()
  await page.getByTestId("review-answer-a").waitFor({ state: "visible" })
}

async function assertActiveReviewInvalidated(page, message) {
  const invalidatedState = page.getByTestId("review-invalidated-state")
  await invalidatedState.waitFor({ state: "visible" })
  assert.ok(await invalidatedState.isVisible(), message)
}

export async function verifyDueReviewFlow(page, baseUrl) {
  await seedReviewState(page, baseUrl)
  await page.goto(`${baseUrl}/review`, { waitUntil: "networkidle" })
  await page.getByTestId("review-due-state").waitFor({ state: "visible" })
  await page.getByTestId("review-today-due").waitFor({ state: "visible" })
  await page.getByTestId("review-start-today").click()
  await page.getByTestId("review-remaining").waitFor({ state: "visible" })
  const wrongKanaOption = await page.evaluate(() => {
    const option = Array.from(document.querySelectorAll('[data-testid^="review-answer-"]'))
      .find((button) => button.getAttribute("data-testid") !== "review-answer-a")
    return option?.getAttribute("data-testid")
  })
  assert.ok(wrongKanaOption, "kana review should expose at least one wrong answer option")
  await page.getByTestId(wrongKanaOption).click()
  await page.waitForFunction((storageKeys) => {
    const srs = JSON.parse(localStorage.getItem(storageKeys.SRS_KANA) ?? "{}")
    const practice = JSON.parse(localStorage.getItem(storageKeys.PRACTICE_RESULTS) ?? "[]")
    const mistakes = JSON.parse(localStorage.getItem(storageKeys.MISTAKES) ?? "[]")
    return srs?.a?.box === 0 &&
      srs?.a?.wrong >= 1 &&
      srs?.a?.dueAt <= Date.now() &&
      Array.isArray(practice) &&
      practice.some((item) =>
        item.itemId === "a" &&
        item.itemType === "kana" &&
        item.mode === "recognition" &&
        item.correct === false
      ) &&
      Array.isArray(mistakes) &&
      mistakes.some((item) => item.correctAnswer === "a" && item.wrongCount >= 1)
  }, E2E_STORAGE_KEYS)
  const wrongKanaSrs = await readJsonStorage(page, E2E_STORAGE_KEYS.SRS_KANA)
  assert.equal(wrongKanaSrs?.a?.box, 0, "wrong review answer should reset kana SRS to immediate review")
  assert.ok(wrongKanaSrs?.a?.wrong >= 1, "wrong review answer should increment SRS wrong count")
  assert.ok(wrongKanaSrs?.a?.dueAt <= Date.now(), "wrong review answer should keep the item due now")
  const wrongReviewPractice = await readJsonStorage(page, E2E_STORAGE_KEYS.PRACTICE_RESULTS)
  assert.ok(
    Array.isArray(wrongReviewPractice) &&
      wrongReviewPractice.some((item) =>
        item.itemId === "a" &&
        item.itemType === "kana" &&
        item.mode === "recognition" &&
        item.correct === false
      ),
    "wrong review answer should write failed practice history"
  )
  await page.getByTestId("review-next").click()
  assert.match(await page.getByTestId("review-remaining").innerText(), /1\b/)

  await seedMixedReviewState(page, baseUrl)
  await page.goto(`${baseUrl}/review`, { waitUntil: "networkidle" })
  await page.getByTestId("review-due-state").waitFor({ state: "visible" })
  await page.getByTestId("review-start-today").click()

  await page.getByTestId("review-answer-i").click()
  await page.waitForFunction((storageKeys) => {
    const mistakes = JSON.parse(localStorage.getItem(storageKeys.MISTAKES) ?? "[]")
    const srs = JSON.parse(localStorage.getItem(storageKeys.SRS_MISTAKES) ?? "{}")
    const practice = JSON.parse(localStorage.getItem(storageKeys.PRACTICE_RESULTS) ?? "[]")
    const item = Array.isArray(mistakes) ? mistakes.find((mistake) => mistake.id === "e2e-mistake:kana-a") : null
    return item?.wrongCount === 3 &&
      srs?.["e2e-mistake:kana-a"]?.wrong === 3 &&
      srs?.["e2e-mistake:kana-a"]?.box === 0 &&
      Array.isArray(practice) &&
      practice.some((entry) =>
        entry.itemId === "a" &&
        entry.itemType === "kana" &&
        entry.mode === "recognition" &&
        entry.correct === false
      )
  }, E2E_STORAGE_KEYS)
  const mixedWrongMistakes = await readJsonStorage(page, E2E_STORAGE_KEYS.MISTAKES)
  const mixedWrongMistake = Array.isArray(mixedWrongMistakes)
    ? mixedWrongMistakes.find((item) => item.id === "e2e-mistake:kana-a")
    : null
  assert.equal(mixedWrongMistake?.wrongCount, 3, "mixed today wrong mistake answer should increment notebook count once")
  const mixedWrongMistakeSrs = await readJsonStorage(page, E2E_STORAGE_KEYS.SRS_MISTAKES)
  assert.equal(
    mixedWrongMistakeSrs?.["e2e-mistake:kana-a"]?.wrong,
    3,
    "mixed today wrong mistake answer should grade mistake SRS exactly once"
  )
  assert.equal(
    mixedWrongMistakeSrs?.["e2e-mistake:kana-a"]?.box,
    0,
    "mixed today wrong mistake answer should keep the mistake due for another pass"
  )
  await page.getByTestId("review-next").click()
  assert.match(await page.getByTestId("review-remaining").innerText(), /3\b/)
  await page.getByTestId("review-answer-a").waitFor({ state: "visible" })

  await seedMixedReviewState(page, baseUrl)
  await page.goto(`${baseUrl}/review`, { waitUntil: "networkidle" })
  await page.getByTestId("review-due-state").waitFor({ state: "visible" })
  await page.getByTestId("review-start-today").click()

  await page.getByTestId("review-answer-a").click()
  await page.waitForFunction((storageKeys) => {
    const mistakes = JSON.parse(localStorage.getItem(storageKeys.MISTAKES) ?? "[]")
    const srs = JSON.parse(localStorage.getItem(storageKeys.SRS_MISTAKES) ?? "{}")
    const item = Array.isArray(mistakes) ? mistakes.find((mistake) => mistake.id === "e2e-mistake:kana-a") : null
    return item?.wrongCount === 2 && srs?.["e2e-mistake:kana-a"]?.box > 1
  }, E2E_STORAGE_KEYS)
  await page.getByTestId("review-next").click()

  await page.getByTestId("review-answer-a").click()
  await page.waitForFunction((storageKeys) => {
    const srs = JSON.parse(localStorage.getItem(storageKeys.SRS_KANA) ?? "{}")
    const practice = JSON.parse(localStorage.getItem(storageKeys.PRACTICE_RESULTS) ?? "[]")
    return srs?.a?.box > 1 &&
      srs?.a?.right >= 1 &&
      srs?.a?.dueAt > Date.now() &&
      Array.isArray(practice) &&
      practice.some((item) =>
        item.itemId === "a" &&
        item.itemType === "kana" &&
        item.mode === "recognition" &&
        item.correct === true
      )
  }, E2E_STORAGE_KEYS)
  const reviewedKanaSrs = await readJsonStorage(page, E2E_STORAGE_KEYS.SRS_KANA)
  assert.ok(reviewedKanaSrs?.a?.box > 1, "correct review answer should advance kana SRS box")
  assert.ok(reviewedKanaSrs?.a?.right >= 1, "correct review answer should increment SRS right count")
  await page.getByTestId("review-next").click()

  await page.getByTestId("review-answer-sur-g-1").click()
  await page.waitForFunction((storageKeys) => {
    const srs = JSON.parse(localStorage.getItem(storageKeys.SRS_VOCAB) ?? "{}")
    const practice = JSON.parse(localStorage.getItem(storageKeys.PRACTICE_RESULTS) ?? "[]")
    return srs?.["sur-g-1"]?.box > 1 &&
      srs?.["sur-g-1"]?.right >= 1 &&
      srs?.["sur-g-1"]?.dueAt > Date.now() &&
      Array.isArray(practice) &&
      practice.some((item) =>
        item.itemId === "sur-g-1" &&
        item.itemType === "vocab" &&
        item.mode === "meaning" &&
        item.correct === true
      )
  }, E2E_STORAGE_KEYS)
  const reviewedMistakeSrs = await readJsonStorage(page, E2E_STORAGE_KEYS.SRS_MISTAKES)
  assert.ok(
    reviewedMistakeSrs?.["e2e-mistake:kana-a"]?.box > 1,
    "mixed today review should advance mistake SRS"
  )
  const reviewedVocabSrs = await readJsonStorage(page, E2E_STORAGE_KEYS.SRS_VOCAB)
  assert.ok(reviewedVocabSrs?.["sur-g-1"]?.box > 1, "mixed today review should advance vocabulary SRS box")
  const reviewPractice = await readJsonStorage(page, E2E_STORAGE_KEYS.PRACTICE_RESULTS)
  assert.ok(
    Array.isArray(reviewPractice) &&
      reviewPractice.some((item) =>
        item.itemId === "a" &&
        item.itemType === "kana" &&
        item.mode === "recognition" &&
        item.correct === true
      ),
    "correct review answer should write practice history"
  )
  assert.ok(
    Array.isArray(reviewPractice) &&
      reviewPractice.some((item) =>
        item.itemId === "sur-g-1" &&
        item.itemType === "vocab" &&
        item.mode === "meaning" &&
        item.correct === true
      ),
    "mixed today review should write vocabulary practice history"
  )

  await seedReviewState(page, baseUrl)
  await page.goto(`${baseUrl}/review`, { waitUntil: "networkidle" })
  await page.getByTestId("review-start-kana").click()
  await page.getByTestId("review-answer-a").click()
  await page.waitForFunction((storageKeys) => {
    const srs = JSON.parse(localStorage.getItem(storageKeys.SRS_KANA) ?? "{}")
    const practice = JSON.parse(localStorage.getItem(storageKeys.PRACTICE_RESULTS) ?? "[]")
    return srs?.a?.box > 1 &&
      Array.isArray(practice) &&
      practice.some((item) =>
        item.itemId === "a" &&
        item.itemType === "kana" &&
        item.mode === "recognition" &&
        item.correct === true
      )
  }, E2E_STORAGE_KEYS)

  await seedMixedReviewState(page, baseUrl)
  await page.goto(`${baseUrl}/review`, { waitUntil: "networkidle" })
  await page.getByTestId("review-start-vocab").click()
  await page.getByTestId("review-answer-sur-g-1").click()
  await page.waitForFunction((storageKeys) => {
    const srs = JSON.parse(localStorage.getItem(storageKeys.SRS_VOCAB) ?? "{}")
    const practice = JSON.parse(localStorage.getItem(storageKeys.PRACTICE_RESULTS) ?? "[]")
    return srs?.["sur-g-1"]?.box > 1 &&
      Array.isArray(practice) &&
      practice.some((item) =>
        item.itemId === "sur-g-1" &&
        item.itemType === "vocab" &&
        item.mode === "meaning" &&
        item.correct === true
      )
  }, E2E_STORAGE_KEYS)

  await startActiveKanaReview(page, baseUrl)

  const resetPage = await page.context().newPage()
  try {
    await resetPage.goto(`${baseUrl}/review`, { waitUntil: "networkidle" })
    await resetPage.getByTestId("learning-data-reset").click()
    await resetPage.getByTestId("learning-data-reset-dialog-confirm").click()
    await resetPage.waitForFunction((storageKeys) => {
      return localStorage.getItem(storageKeys.KANA_MASTERED) === null &&
        localStorage.getItem(storageKeys.SRS_KANA) === null
    }, E2E_STORAGE_KEYS)
    await assertActiveReviewInvalidated(
      page,
      "active review sessions should invalidate after cross-tab learning data reset"
    )
  } finally {
    await resetPage.close()
  }

  await startActiveKanaReview(page, baseUrl)

  const restorePage = await page.context().newPage()
  try {
    await restorePage.goto(`${baseUrl}/review`, { waitUntil: "networkidle" })
    await restorePage.getByTestId("learning-data-panel").waitFor({ state: "visible" })
    const fileChooserPromise = restorePage.waitForEvent("filechooser")
    await restorePage.getByTestId("learning-data-import").click()
    const fileChooser = await fileChooserPromise
    await fileChooser.setFiles({
      name: "empty-yasashi-backup.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify({
        version: 1,
        exportedAt: Date.now(),
        entries: {},
      })),
    })
    await restorePage.waitForFunction((storageKeys) => {
      return localStorage.getItem(storageKeys.KANA_MASTERED) === null &&
        localStorage.getItem(storageKeys.SRS_KANA) === null
    }, E2E_STORAGE_KEYS)
    await assertActiveReviewInvalidated(
      page,
      "active review sessions should invalidate after cross-tab learning data import"
    )
  } finally {
    await restorePage.close()
  }
}
