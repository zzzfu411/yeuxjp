import { E2E_STORAGE_KEYS } from "./storage-keys.mjs"

export async function seedReviewState(page, baseUrl) {
  await page.goto(baseUrl, { waitUntil: "networkidle" })
  await page.evaluate((storageKeys) => {
    const now = Date.now()
    localStorage.clear()
    localStorage.setItem(storageKeys.KANA_MASTERED, JSON.stringify(["a"]))
    localStorage.setItem(
      storageKeys.SRS_KANA,
      JSON.stringify({ a: { box: 1, dueAt: now - 1, createdAt: now - 1000, right: 0, wrong: 0 } })
    )
  }, E2E_STORAGE_KEYS)
}

export async function seedMixedReviewState(page, baseUrl) {
  await page.goto(baseUrl, { waitUntil: "networkidle" })
  await page.evaluate((storageKeys) => {
    const now = Date.now()
    localStorage.clear()
    localStorage.setItem(storageKeys.KANA_MASTERED, JSON.stringify(["a"]))
    localStorage.setItem(storageKeys.VOCAB_LEARNED, JSON.stringify(["sur-g-1"]))
    localStorage.setItem(
      storageKeys.SRS_KANA,
      JSON.stringify({ a: { box: 1, dueAt: now - 3, createdAt: now - 3000, right: 0, wrong: 0 } })
    )
    localStorage.setItem(
      storageKeys.SRS_VOCAB,
      JSON.stringify({ "sur-g-1": { box: 1, dueAt: now - 2, createdAt: now - 3000, right: 0, wrong: 0 } })
    )
    localStorage.setItem(
      storageKeys.MISTAKES,
      JSON.stringify([
        {
          id: "e2e-mistake:kana-a",
          type: "hiragana-romaji",
          questionText: String.fromCodePoint(0x3042),
          itemId: "a",
          itemType: "kana",
          mode: "recognition",
          correctAnswer: "a",
          correctDisplay: "a",
          lastWrongAnswer: "i",
          options: [
            { value: "a", display: "a" },
            { value: "i", display: "i" },
          ],
          wrongCount: 2,
          createdAt: now - 60_000,
          lastWrongAt: now - 30_000,
        },
      ])
    )
    localStorage.setItem(
      storageKeys.SRS_MISTAKES,
      JSON.stringify({
        "e2e-mistake:kana-a": { box: 1, dueAt: now - 1, createdAt: now - 60_000, right: 0, wrong: 2 },
      })
    )
  }, E2E_STORAGE_KEYS)
}

export async function seedDueMistakeReviewState(page, baseUrl) {
  await page.goto(baseUrl, { waitUntil: "networkidle" })
  await page.evaluate((storageKeys) => {
    const now = Date.now()
    localStorage.clear()
    localStorage.setItem(
      storageKeys.MISTAKES,
      JSON.stringify([
        {
          id: "e2e-mistake:kana-a",
          type: "hiragana-romaji",
          questionText: String.fromCodePoint(0x3042),
          itemId: "a",
          itemType: "kana",
          mode: "recognition",
          correctAnswer: "a",
          correctDisplay: "a",
          lastWrongAnswer: "i",
          options: [
            { value: "a", display: "a" },
            { value: "i", display: "i" },
          ],
          wrongCount: 2,
          createdAt: now - 60_000,
          lastWrongAt: now - 30_000,
        },
      ])
    )
    localStorage.setItem(
      storageKeys.SRS_MISTAKES,
      JSON.stringify({
        "e2e-mistake:kana-a": { box: 1, dueAt: now - 1, createdAt: now - 60_000, right: 0, wrong: 2 },
      })
    )
  }, E2E_STORAGE_KEYS)
}

export async function seedMissingThenDueMistakeReviewState(page, baseUrl) {
  await page.goto(baseUrl, { waitUntil: "networkidle" })
  await page.evaluate((storageKeys) => {
    const now = Date.now()
    localStorage.clear()
    localStorage.setItem(
      storageKeys.MISTAKES,
      JSON.stringify([
        {
          id: "e2e-mistake:kana-a",
          type: "hiragana-romaji",
          questionText: String.fromCodePoint(0x3042),
          itemId: "a",
          itemType: "kana",
          mode: "recognition",
          correctAnswer: "a",
          correctDisplay: "a",
          lastWrongAnswer: "i",
          options: [
            { value: "a", display: "a" },
            { value: "i", display: "i" },
          ],
          wrongCount: 2,
          createdAt: now - 60_000,
          lastWrongAt: now - 30_000,
        },
      ])
    )
    localStorage.setItem(
      storageKeys.SRS_MISTAKES,
      JSON.stringify({
        "e2e-mistake:missing": { box: 1, dueAt: now - 2, createdAt: now - 60_000, right: 0, wrong: 1 },
        "e2e-mistake:kana-a": { box: 1, dueAt: now - 1, createdAt: now - 60_000, right: 0, wrong: 2 },
      })
    )
  }, E2E_STORAGE_KEYS)
}
