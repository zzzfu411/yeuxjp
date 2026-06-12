import assert from "node:assert/strict"

import { E2E_STORAGE_KEYS, managedLearningBackupKeys } from "./storage-keys.mjs"

export { managedLearningBackupKeys }

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

export async function seedLearningDataBackupState(page, baseUrl) {
  await page.goto(baseUrl, { waitUntil: "networkidle" })
  await page.evaluate((storageKeys) => {
    const now = Date.now()
    const createdAt = now - 1000
    localStorage.clear()
    localStorage.setItem("yasashi.e2e.unmanaged", "keep")
    localStorage.setItem(
      storageKeys.USER_PROFILE,
      JSON.stringify({ goal: "balanced", minutesPerDay: 15, kanaLevel: "some", romajiMode: "practice", createdAt, updatedAt: now })
    )
    localStorage.setItem(
      storageKeys.LESSON_PROGRESS,
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
      storageKeys.ITEM_PROGRESS,
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
      storageKeys.PRACTICE_RESULTS,
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
      storageKeys.SRS_KANA,
      JSON.stringify({
        a: { box: 2, dueAt: now + 60_000, createdAt, lastReviewedAt: now, right: 1, wrong: 0 },
      })
    )
    localStorage.setItem(
      storageKeys.SRS_VOCAB,
      JSON.stringify({
        "sur-n-35": { box: 1, dueAt: now + 120_000, createdAt, right: 0, wrong: 0 },
      })
    )
    localStorage.setItem(
      storageKeys.MISTAKES,
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
      storageKeys.SRS_MISTAKES,
      JSON.stringify({
        "kana:a:hiragana-romaji": { box: 1, dueAt: now - 1, createdAt, right: 0, wrong: 1 },
      })
    )
    localStorage.setItem(storageKeys.KANA_MASTERED, JSON.stringify(["a", "i"]))
    localStorage.setItem(storageKeys.VOCAB_LEARNED, JSON.stringify(["sur-n-35"]))
    localStorage.setItem(storageKeys.SPEECH_PREFS, JSON.stringify({ rate: 1, repeat: 2, autoPlay: false, gapMs: 500 }))
  }, E2E_STORAGE_KEYS)
}
