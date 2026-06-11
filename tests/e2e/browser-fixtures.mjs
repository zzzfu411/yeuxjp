import assert from "node:assert/strict"
import { readJsonStorage } from "./harness.mjs"

export const seionRomaji = [
  "a",
  "i",
  "u",
  "e",
  "o",
  "ka",
  "ki",
  "ku",
  "ke",
  "ko",
  "sa",
  "shi",
  "su",
  "se",
  "so",
  "ta",
  "chi",
  "tsu",
  "te",
  "to",
  "na",
  "ni",
  "nu",
  "ne",
  "no",
  "ha",
  "hi",
  "fu",
  "he",
  "ho",
  "ma",
  "mi",
  "mu",
  "me",
  "mo",
  "ya",
  "yu",
  "yo",
  "ra",
  "ri",
  "ru",
  "re",
  "ro",
  "wa",
  "wo",
  "n",
]

export const managedLearningBackupKeys = [
  "yasashi.learning.profile.v1",
  "yasashi.learning.lessons.v1",
  "yasashi.learning.items.v1",
  "yasashi.learning.practice.v1",
  "yasashi.srs.kana.v1",
  "yasashi.srs.vocab.v1",
  "yasashi.srs.mistakes.v1",
  "yasashi.mistakes.v1",
  "yasashi.kana.mastered.v1",
  "yasashi.vocab.learned.v1",
  "yasashi.speech.prefs.v1",
]

export async function readManagedLearningBackupSnapshot(page) {
  return page.evaluate((keys) => {
    return Object.fromEntries(keys.map((key) => [key, localStorage.getItem(key)]))
  }, managedLearningBackupKeys)
}

export function assertManagedLearningSnapshot(actual, expected, message) {
  for (const key of managedLearningBackupKeys) {
    assert.equal(actual[key], expected[key], `${message}: ${key}`)
  }
}

export async function seedReviewState(page, baseUrl) {
  await page.goto(baseUrl, { waitUntil: "networkidle" })
  await page.evaluate(() => {
    const now = Date.now()
    localStorage.setItem(
      "yasashi.srs.kana.v1",
      JSON.stringify({ a: { box: 1, dueAt: now - 1, createdAt: now - 1000, right: 0, wrong: 0 } })
    )
  })
}

export async function seedLearningDataBackupState(page, baseUrl) {
  await page.goto(baseUrl, { waitUntil: "networkidle" })
  await page.evaluate(() => {
    const now = Date.now()
    const createdAt = now - 1000
    localStorage.clear()
    localStorage.setItem("yasashi.e2e.unmanaged", "keep")
    localStorage.setItem(
      "yasashi.learning.profile.v1",
      JSON.stringify({ goal: "balanced", minutesPerDay: 15, kanaLevel: "some", romajiMode: "practice", createdAt, updatedAt: now })
    )
    localStorage.setItem(
      "yasashi.learning.lessons.v1",
      JSON.stringify({
        "day-1-a-row-hello": {
          lessonId: "day-1-a-row-hello",
          status: "completed",
          startedAt: createdAt,
          completedAt: now,
          score: 100,
          currentStepIndex: 5,
          lastStepId: "summary",
          updatedAt: now,
        },
      })
    )
    localStorage.setItem(
      "yasashi.learning.items.v1",
      JSON.stringify({
        a: {
          itemId: "a",
          itemType: "kana",
          recognition: 18,
          listening: 0,
          meaning: 0,
          recall: 0,
          production: 0,
          attempts: 1,
          correct: 1,
          updatedAt: now,
        },
        "sur-n-35": {
          itemId: "sur-n-35",
          itemType: "vocab",
          recognition: 0,
          listening: 0,
          meaning: 18,
          recall: 0,
          production: 0,
          attempts: 1,
          correct: 1,
          updatedAt: now,
        },
      })
    )
    localStorage.setItem(
      "yasashi.learning.practice.v1",
      JSON.stringify([
        {
          lessonId: "day-1-a-row-hello",
          lessonStepId: "recognize-a",
          itemId: "a",
          itemType: "kana",
          mode: "recognition",
          correct: true,
          answer: "a",
          createdAt: now,
        },
      ])
    )
    localStorage.setItem(
      "yasashi.srs.kana.v1",
      JSON.stringify({
        a: { box: 2, dueAt: now + 60_000, createdAt, lastReviewedAt: now, right: 1, wrong: 0 },
      })
    )
    localStorage.setItem(
      "yasashi.srs.vocab.v1",
      JSON.stringify({
        "sur-n-35": { box: 1, dueAt: now + 120_000, createdAt, right: 0, wrong: 0 },
      })
    )
    localStorage.setItem(
      "yasashi.mistakes.v1",
      JSON.stringify([
        {
          id: "kana:a:hiragana-romaji",
          type: "hiragana-romaji",
          questionText: "seed kana prompt",
          correctAnswer: "a",
          correctDisplay: "a",
          lastWrongAnswer: "i",
          options: [
            { value: "a", display: "a" },
            { value: "i", display: "i" },
          ],
          wrongCount: 1,
          createdAt,
          lastWrongAt: now,
        },
      ])
    )
    localStorage.setItem(
      "yasashi.srs.mistakes.v1",
      JSON.stringify({
        "kana:a:hiragana-romaji": { box: 1, dueAt: now - 1, createdAt, right: 0, wrong: 1 },
      })
    )
    localStorage.setItem("yasashi.kana.mastered.v1", JSON.stringify(["a", "i"]))
    localStorage.setItem("yasashi.vocab.learned.v1", JSON.stringify(["sur-n-35"]))
    localStorage.setItem("yasashi.speech.prefs.v1", JSON.stringify({ rate: 1, repeat: 2, autoPlay: false, gapMs: 500 }))
  })
}

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
