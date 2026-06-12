import assert from "node:assert/strict"

import { readJsonStorage } from "./harness.mjs"
import {
  assertQuizModeRecordsPractice,
  openQuizMode,
  seedDueMistakeReviewState,
  seionHiraganaToRomaji,
  seionRomaji,
} from "./browser-fixtures.mjs"

export async function verifyQuizAndMistakeFlow(page, baseUrl) {
  await openQuizMode(page, baseUrl, "hiragana-romaji")
  await page.getByTestId("quiz-question-text").waitFor({ state: "visible" })
  assert.match(await page.getByTestId("quiz-score").innerText(), /0\/0\b/)
  const quizPrompt = (await page.getByTestId("quiz-question-text").innerText()).trim()
  const expectedAnswer = seionHiraganaToRomaji[quizPrompt]
  assert.ok(expectedAnswer, `quiz prompt should be a known seion kana, got ${quizPrompt}`)
  const wrongOption = await page.evaluate((correctAnswer) => {
    const option = Array.from(document.querySelectorAll('[data-testid^="quiz-answer-option-"]'))
      .find((button) => button.textContent?.trim() !== correctAnswer)
    return option?.getAttribute("data-testid")
  }, expectedAnswer)
  assert.ok(wrongOption, "hiragana quiz should expose at least one wrong answer option")
  await page.getByTestId(wrongOption).click()
  await page.waitForFunction(() => {
    const mistakes = JSON.parse(localStorage.getItem("yasashi.mistakes.v1") ?? "[]")
    return Array.isArray(mistakes) && mistakes.length > 0
  })
  const mistakes = await readJsonStorage(page, "yasashi.mistakes.v1")
  assert.ok(Array.isArray(mistakes), "wrong quiz answer should write mistake notebook")
  const recordedQuizMistake = mistakes.find((item) =>
    item.type === "hiragana-romaji" &&
    item.questionText === quizPrompt &&
    item.correctAnswer === expectedAnswer &&
    item.wrongCount >= 1
  )
  assert.ok(recordedQuizMistake, "wrong quiz answer should record the current kana prompt in mistakes")
  await page.goto(`${baseUrl}/review`, { waitUntil: "networkidle" })
  await page.getByTestId("recent-mistakes").waitFor({ state: "visible" })
  await page.getByTestId(`recent-mistake-${recordedQuizMistake.id}`).waitFor({ state: "visible" })
  await page.getByTestId("review-start-mistakes").click()
  await page.getByTestId("mistake-review-session").waitFor({ state: "visible" })

  await seedDueMistakeReviewState(page, baseUrl)
  await page.goto(`${baseUrl}/review`, { waitUntil: "networkidle" })
  await page.getByTestId("review-start-mistakes").click()
  await page.getByTestId("mistake-review-session").waitFor({ state: "visible" })
  await page.getByTestId("review-answer-a").click()
  await page.waitForFunction(() => {
    const mistakes = JSON.parse(localStorage.getItem("yasashi.mistakes.v1") ?? "[]")
    const srs = JSON.parse(localStorage.getItem("yasashi.srs.mistakes.v1") ?? "{}")
    const item = Array.isArray(mistakes) ? mistakes.find((mistake) => mistake.id === "e2e-mistake:kana-a") : null
    return item?.wrongCount === 2 && srs?.["e2e-mistake:kana-a"]?.box > 1
  })
  const retainedMistakes = await readJsonStorage(page, "yasashi.mistakes.v1")
  const retainedMistake = Array.isArray(retainedMistakes)
    ? retainedMistakes.find((item) => item.id === "e2e-mistake:kana-a")
    : null
  assert.equal(retainedMistake?.wrongCount, 2, "correct mistake review should retain the historical mistake count")
  const reviewedMistakeSrs = await readJsonStorage(page, "yasashi.srs.mistakes.v1")
  assert.ok(
    reviewedMistakeSrs?.["e2e-mistake:kana-a"]?.box > 1,
    "correct mistake review should advance mistake SRS without deleting notebook history"
  )

  await assertQuizModeRecordsPractice(page, baseUrl, {
    mode: "audio-kana",
    itemType: "kana",
    practiceMode: "listening",
  })
  await assertQuizModeRecordsPractice(page, baseUrl, {
    mode: "particle",
    itemType: "grammar",
    practiceMode: "recognition",
  })
  await assertQuizModeRecordsPractice(page, baseUrl, {
    mode: "verb-conjugation",
    itemType: "grammar",
    practiceMode: "production",
  })
  await assertQuizModeRecordsPractice(page, baseUrl, {
    mode: "audio-sokuon",
    itemType: "kana",
    practiceMode: "listening",
  })
  await assertQuizModeRecordsPractice(page, baseUrl, {
    mode: "audio-longvowel",
    itemType: "kana",
    practiceMode: "listening",
  })
  await assertQuizModeRecordsPractice(page, baseUrl, {
    mode: "meaning-vocab",
    itemType: "vocab",
    practiceMode: "meaning",
  })

  await page.goto(`${baseUrl}/quiz`, { waitUntil: "networkidle" })
  await page.evaluate((masteredIds) => {
    localStorage.clear()
    localStorage.setItem("yasashi.kana.mastered.v1", JSON.stringify(masteredIds))
  }, seionRomaji)
  await page.getByTestId("quiz-mode-hiragana-romaji").click()
  await page.getByTestId("quiz-only-unmastered-kana").click()
  await page.getByTestId("quiz-empty-state").waitFor({ state: "visible" })
}
