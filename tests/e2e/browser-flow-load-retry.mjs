import { E2E_STORAGE_KEYS } from "./storage-keys.mjs"
import { seedMixedReviewState } from "./browser-fixtures.mjs"

const FLUENT_REVIEW_ID = "flu-abs-1"

async function failNextVocabularyLoad(page, level) {
  await page.evaluate((targetLevel) => {
    window.__yasashiE2EVocabularyLoadFailures = window.__yasashiE2EVocabularyLoadFailures ?? {}
    window.__yasashiE2EVocabularyLoadFailures[targetLevel] =
      (window.__yasashiE2EVocabularyLoadFailures[targetLevel] ?? 0) + 1
  }, level)
}

async function seedFluentVocabularyReviewState(page, baseUrl) {
  await page.goto(baseUrl, { waitUntil: "networkidle" })
  await page.evaluate(({ storageKeys, id }) => {
    const now = Date.now()
    localStorage.clear()
    localStorage.setItem(storageKeys.VOCAB_LEARNED, JSON.stringify([id]))
    localStorage.setItem(
      storageKeys.SRS_VOCAB,
      JSON.stringify({ [id]: { box: 1, dueAt: now - 1, createdAt: now - 3000, right: 0, wrong: 0 } })
    )
  }, { storageKeys: E2E_STORAGE_KEYS, id: FLUENT_REVIEW_ID })
}

async function verifyQuizVocabularyLoadRetry(page, baseUrl) {
  await page.goto(baseUrl, { waitUntil: "networkidle" })
  await page.evaluate((storageKeys) => {
    localStorage.clear()
    localStorage.setItem(storageKeys.SPEECH_PREFS, JSON.stringify({
      rate: 1,
      repeat: 1,
      autoPlay: false,
      gapMs: 250,
    }))
  }, E2E_STORAGE_KEYS)
  await page.goto(`${baseUrl}/quiz`, { waitUntil: "networkidle" })
  await failNextVocabularyLoad(page, "survival")
  await page.getByTestId("quiz-mode-meaning-vocab").click()
  await page.getByTestId("quiz-retry-vocabulary").waitFor({ state: "visible" })
  await page.getByTestId("quiz-retry-vocabulary").click()
  await page.getByTestId("quiz-score").waitFor({ state: "visible" })
  await page.locator('[data-testid^="quiz-answer-option-"]').first().waitFor({ state: "visible" })
}

async function verifyVocabularyPageLoadRetry(page, baseUrl) {
  await page.goto(`${baseUrl}/vocabulary`, { waitUntil: "networkidle" })
  await page.getByTestId("vocabulary-search").waitFor({ state: "visible" })

  await failNextVocabularyLoad(page, "daily")
  await page.getByTestId("vocabulary-level-daily").click()
  await page.getByTestId("vocabulary-retry-load").waitFor({ state: "visible" })
  await page.getByTestId("vocabulary-retry-load").click()
  await page.getByTestId("vocabulary-search").fill("Yakusoku")
  await page.getByText("約束").first().waitFor({ state: "visible" })
}

async function verifyReviewVocabularyLoadRetry(page, baseUrl) {
  await seedFluentVocabularyReviewState(page, baseUrl)
  await page.goto(`${baseUrl}/review`, { waitUntil: "networkidle" })
  await page.getByTestId("review-due-state").waitFor({ state: "visible" })

  await failNextVocabularyLoad(page, "fluent")
  await page.getByTestId("review-start-vocab").click()
  await page.getByTestId("review-retry-load").waitFor({ state: "visible" })
  await page.getByTestId("review-retry-load").click()
  await page.getByTestId("review-answer-flu-abs-1").waitFor({ state: "visible" })
  await page.getByTestId("review-answer-flu-abs-1").click()
  await page.waitForFunction(({ storageKeys, id }) => {
    const srs = JSON.parse(localStorage.getItem(storageKeys.SRS_VOCAB) ?? "{}")
    return srs?.[id]?.box > 1 && srs?.[id]?.right >= 1
  }, { storageKeys: E2E_STORAGE_KEYS, id: FLUENT_REVIEW_ID })
}

async function verifyTodayReviewVocabularyLoadRetry(page, baseUrl) {
  await seedMixedReviewState(page, baseUrl)
  await page.goto(`${baseUrl}/review`, { waitUntil: "networkidle" })
  await page.getByTestId("review-due-state").waitFor({ state: "visible" })

  await failNextVocabularyLoad(page, "survival")
  await page.getByTestId("review-start-today").click()
  await page.getByTestId("review-retry-load").waitFor({ state: "visible" })
  await page.getByTestId("review-retry-load").click()
  await page.getByTestId("review-remaining").waitFor({ state: "visible" })

  await page.getByTestId("review-answer-a").click()
  await page.getByTestId("review-next").waitFor({ state: "visible" })
  await page.getByTestId("review-next").click()
  await page.getByTestId("review-answer-a").click()
  await page.getByTestId("review-next").waitFor({ state: "visible" })
  await page.getByTestId("review-next").click()
  await page.getByTestId("review-answer-sur-g-1").waitFor({ state: "visible" })
  await page.getByTestId("review-answer-sur-g-1").click()
  await page.waitForFunction((storageKeys) => {
    const srs = JSON.parse(localStorage.getItem(storageKeys.SRS_VOCAB) ?? "{}")
    const practice = JSON.parse(localStorage.getItem(storageKeys.PRACTICE_RESULTS) ?? "[]")
    return srs?.["sur-g-1"]?.box > 1 &&
      srs?.["sur-g-1"]?.right >= 1 &&
      Array.isArray(practice) &&
      practice.some((item) =>
        item.itemId === "sur-g-1" &&
        item.itemType === "vocab" &&
        item.mode === "meaning" &&
        item.correct === true
      )
  }, E2E_STORAGE_KEYS)
  await page.evaluate(() => localStorage.clear())
}

export async function verifyVocabularyLoadRetryFlow(page, baseUrl) {
  await verifyQuizVocabularyLoadRetry(page, baseUrl)
  await verifyVocabularyPageLoadRetry(page, baseUrl)
  await verifyReviewVocabularyLoadRetry(page, baseUrl)
  await verifyTodayReviewVocabularyLoadRetry(page, baseUrl)
}
