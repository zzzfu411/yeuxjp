import assert from "node:assert/strict"

import { readJsonStorage } from "./harness.mjs"

export async function resetQuizLearningState(page) {
  await page.evaluate(() => {
    localStorage.clear()
    localStorage.setItem("yasashi.speech.prefs.v1", JSON.stringify({
      rate: 1,
      repeat: 1,
      autoPlay: false,
      gapMs: 250,
    }))
  })
}

export async function openQuizMode(page, baseUrl, mode) {
  await page.goto(baseUrl, { waitUntil: "networkidle" })
  await resetQuizLearningState(page)
  await page.goto(`${baseUrl}/quiz`, { waitUntil: "networkidle" })

  if (mode === "hiragana-romaji") await page.getByTestId("quiz-mode-hiragana-romaji").click()
  else if (mode === "audio-kana") await page.getByTestId("quiz-mode-audio-kana").click()
  else if (mode === "particle") await page.getByTestId("quiz-mode-particle").click()
  else if (mode === "verb-conjugation") await page.getByTestId("quiz-mode-verb-conjugation").click()
  else if (mode === "audio-sokuon") await page.getByTestId("quiz-mode-audio-sokuon").click()
  else if (mode === "audio-longvowel") await page.getByTestId("quiz-mode-audio-longvowel").click()
  else if (mode === "meaning-vocab") await page.getByTestId("quiz-mode-meaning-vocab").click()
  else throw new Error(`Unknown quiz mode for browser E2E: ${mode}`)

  await page.getByTestId("quiz-score").waitFor({ state: "visible" })
  await page.locator('[data-testid^="quiz-answer-option-"]').first().waitFor({ state: "visible" })
}

export async function clickFirstQuizOptionAndReadPractice(page) {
  await page.locator('[data-testid^="quiz-answer-option-"]').first().click()
  await page.waitForFunction(() => {
    const practice = JSON.parse(localStorage.getItem("yasashi.learning.practice.v1") ?? "[]")
    return Array.isArray(practice) && practice.length > 0
  })
  assert.match(await page.getByTestId("quiz-score").innerText(), /\/1\b/)
  return readJsonStorage(page, "yasashi.learning.practice.v1")
}

export async function assertQuizModeRecordsPractice(page, baseUrl, { mode, itemType, practiceMode }) {
  await openQuizMode(page, baseUrl, mode)
  const practice = await clickFirstQuizOptionAndReadPractice(page)
  assert.ok(
    Array.isArray(practice) &&
      practice.some((item) => item.itemType === itemType && item.mode === practiceMode),
    `${mode} quiz should record ${itemType}/${practiceMode} practice`
  )

  const itemProgress = await readJsonStorage(page, "yasashi.learning.items.v1")
  assert.ok(
    Object.values(itemProgress ?? {}).some((item) => item.itemType === itemType && item.attempts >= 1),
    `${mode} quiz should update item progress`
  )
}
