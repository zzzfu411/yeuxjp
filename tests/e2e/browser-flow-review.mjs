import assert from "node:assert/strict"

import { readJsonStorage } from "./harness.mjs"
import { seedReviewState } from "./browser-fixtures.mjs"

export async function verifyInitialReviewEmptyState(page, baseUrl) {
  await page.goto(`${baseUrl}/review`, { waitUntil: "networkidle" })
  await page.getByTestId("review-empty-state").waitFor({ state: "visible" })
  await page.getByTestId("review-today-empty").waitFor({ state: "visible" })
}

export async function verifyDueReviewFlow(page, baseUrl) {
  await seedReviewState(page, baseUrl)
  await page.goto(`${baseUrl}/review`, { waitUntil: "networkidle" })
  await page.getByTestId("review-due-state").waitFor({ state: "visible" })
  await page.getByTestId("review-today-due").waitFor({ state: "visible" })
  await page.getByTestId("review-start-today").click()
  assert.ok(await page.getByTestId("review-remaining").isVisible())
  await page.getByTestId("review-answer-a").click()
  await page.waitForFunction(() => {
    const srs = JSON.parse(localStorage.getItem("yasashi.srs.kana.v1") ?? "{}")
    const practice = JSON.parse(localStorage.getItem("yasashi.learning.practice.v1") ?? "[]")
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
  })
  const reviewedKanaSrs = await readJsonStorage(page, "yasashi.srs.kana.v1")
  assert.ok(reviewedKanaSrs?.a?.box > 1, "correct review answer should advance kana SRS box")
  assert.ok(reviewedKanaSrs?.a?.right >= 1, "correct review answer should increment SRS right count")
  const reviewPractice = await readJsonStorage(page, "yasashi.learning.practice.v1")
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
}
