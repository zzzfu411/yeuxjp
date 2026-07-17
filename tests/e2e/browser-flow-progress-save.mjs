import assert from "node:assert/strict"

import { readJsonStorage } from "./harness.mjs"
import { E2E_STORAGE_KEYS } from "./storage-keys.mjs"

async function failStorageWrites(page, keys, label) {
  await page.evaluate(
    ({ keys: failingKeys, label: failureLabel }) => {
      const originalSetItem = Storage.prototype.setItem
      window.__yasashiRestoreProgressSetItem = () => {
        Storage.prototype.setItem = originalSetItem
        delete window.__yasashiRestoreProgressSetItem
      }
      Storage.prototype.setItem = function setItemWithE2EProgressFailure(storageKey, value) {
        if (failingKeys.includes(storageKey)) throw new Error(`E2E simulated ${failureLabel} write failure`)
        return originalSetItem.call(this, storageKey, value)
      }
    },
    { keys, label }
  )
}

async function restoreStorageWrites(page) {
  await page.evaluate(() => {
    window.__yasashiRestoreProgressSetItem?.()
  })
}

async function resetBrowserLearningState(page, url) {
  await page.goto(url, { waitUntil: "networkidle" })
  await page.evaluate(() => localStorage.clear())
  await page.reload({ waitUntil: "networkidle" })
}

async function openVocabularyFocusModal(page) {
  await page.getByTestId("vocabulary-search").fill("みせ")
  await page.getByTestId("vocabulary-expand-sur-n-35").waitFor({ state: "visible" })
  await page.getByTestId("vocabulary-expand-sur-n-35").locator("xpath=ancestor::*[@role='button'][1]").press("Space")
  await page.getByTestId("vocabulary-expand-back-sur-n-35").waitFor({ state: "visible" })
  await page.getByTestId("vocabulary-expand-back-sur-n-35").press("Space")
  await page.getByRole("dialog").waitFor({ state: "visible" })
  await page.getByTestId("vocabulary-focus-card").click()
  await page.waitForFunction(() => document.querySelector('[data-testid="vocabulary-focus-card"]')?.getAttribute("aria-pressed") === "true")
  await page.getByTestId("vocabulary-learned-toggle").waitFor({ state: "visible" })
}

export async function verifyProgressSaveFailureFlow(page, baseUrl) {
  await resetBrowserLearningState(page, `${baseUrl}/kana`)

  const corruptKanaProgress = '["hiragana:a",'
  await page.evaluate(({ key, value }) => {
    localStorage.setItem(key, value)
  }, { key: E2E_STORAGE_KEYS.KANA_MASTERED, value: corruptKanaProgress })
  await page.reload({ waitUntil: "networkidle" })
  await page.getByTestId("kana-card-a").click()
  await page.getByTestId("kana-mastery-toggle").click()
  await page.getByTestId("practice-save-error").waitFor({ state: "visible" })
  assert.equal(
    await page.evaluate((key) => localStorage.getItem(key), E2E_STORAGE_KEYS.KANA_MASTERED),
    corruptKanaProgress,
    "incremental kana writes must preserve corrupt storage for explicit recovery"
  )
  await page.keyboard.press("Escape")
  await page.getByTestId("kana-clear-progress").click()
  await page.getByTestId("kana-clear-progress-dialog-confirm").click()
  await page.waitForFunction(
    (key) => localStorage.getItem(key) === "[]",
    E2E_STORAGE_KEYS.KANA_MASTERED
  )

  await resetBrowserLearningState(page, `${baseUrl}/kana`)
  await page.getByTestId("kana-card-a").click()
  await failStorageWrites(page, [E2E_STORAGE_KEYS.KANA_MASTERED], "kana progress")
  await page.getByTestId("kana-mastery-toggle").click()
  await page.getByTestId("practice-save-error").waitFor({ state: "visible" })
  assert.equal(await readJsonStorage(page, E2E_STORAGE_KEYS.KANA_MASTERED), null)
  assert.equal((await readJsonStorage(page, E2E_STORAGE_KEYS.SRS_KANA))?.["hiragana:a"], undefined)
  await restoreStorageWrites(page)

  await page.getByTestId("kana-mastery-toggle").click()
  await page.waitForFunction((storageKeys) => {
    const mastered = JSON.parse(localStorage.getItem(storageKeys.KANA_MASTERED) ?? "[]")
    const srs = JSON.parse(localStorage.getItem(storageKeys.SRS_KANA) ?? "{}")
    return Array.isArray(mastered) && mastered.includes("hiragana:a") && !!srs?.["hiragana:a"]?.dueAt
  }, E2E_STORAGE_KEYS)
  await page.keyboard.press("Escape")

  await failStorageWrites(page, [E2E_STORAGE_KEYS.KANA_MASTERED], "kana progress clear")
  await page.getByTestId("kana-clear-progress").click()
  await page.getByTestId("kana-clear-progress-dialog-confirm").click()
  await page.getByTestId("practice-save-error").waitFor({ state: "visible" })
  assert.ok(
    (await readJsonStorage(page, E2E_STORAGE_KEYS.KANA_MASTERED)).includes("hiragana:a"),
    "failed kana progress clear should keep mastered kana"
  )
  assert.ok(
    (await readJsonStorage(page, E2E_STORAGE_KEYS.SRS_KANA))?.["hiragana:a"]?.dueAt,
    "failed kana progress clear should restore kana SRS"
  )
  await restoreStorageWrites(page)
  await page.getByTestId("kana-clear-progress").click()
  await page.getByTestId("kana-clear-progress-dialog-confirm").click()
  await page.waitForFunction((key) => {
    const mastered = JSON.parse(localStorage.getItem(key) ?? "[]")
    return Array.isArray(mastered) && mastered.length === 0
  }, E2E_STORAGE_KEYS.KANA_MASTERED)

  await resetBrowserLearningState(page, `${baseUrl}/vocabulary`)
  await openVocabularyFocusModal(page)
  await failStorageWrites(page, [E2E_STORAGE_KEYS.VOCAB_LEARNED], "vocabulary progress")
  await page.getByTestId("vocabulary-learned-toggle").press("Space")
  await page.getByTestId("practice-save-error").waitFor({ state: "visible" })
  assert.equal(await readJsonStorage(page, E2E_STORAGE_KEYS.VOCAB_LEARNED), null)
  assert.equal((await readJsonStorage(page, E2E_STORAGE_KEYS.SRS_VOCAB))?.["sur-n-35"], undefined)
  await restoreStorageWrites(page)

  await page.getByTestId("vocabulary-learned-toggle").press("Space")
  await page.waitForFunction((storageKeys) => {
    const learned = JSON.parse(localStorage.getItem(storageKeys.VOCAB_LEARNED) ?? "[]")
    const srs = JSON.parse(localStorage.getItem(storageKeys.SRS_VOCAB) ?? "{}")
    return Array.isArray(learned) && learned.includes("sur-n-35") && !!srs?.["sur-n-35"]?.dueAt
  }, E2E_STORAGE_KEYS)
  await page.keyboard.press("Escape")

  await failStorageWrites(page, [E2E_STORAGE_KEYS.VOCAB_LEARNED], "vocabulary progress clear")
  await page.getByTestId("vocabulary-clear-progress").click()
  await page.getByTestId("vocabulary-clear-progress-dialog-confirm").click()
  await page.getByTestId("practice-save-error").waitFor({ state: "visible" })
  assert.ok(
    (await readJsonStorage(page, E2E_STORAGE_KEYS.VOCAB_LEARNED)).includes("sur-n-35"),
    "failed vocabulary progress clear should keep learned vocabulary"
  )
  assert.ok(
    (await readJsonStorage(page, E2E_STORAGE_KEYS.SRS_VOCAB))?.["sur-n-35"]?.dueAt,
    "failed vocabulary progress clear should restore vocabulary SRS"
  )
  await restoreStorageWrites(page)
  await page.getByTestId("vocabulary-clear-progress").click()
  await page.getByTestId("vocabulary-clear-progress-dialog-confirm").click()
  await page.waitForFunction((key) => {
    const learned = JSON.parse(localStorage.getItem(key) ?? "[]")
    return Array.isArray(learned) && learned.length === 0
  }, E2E_STORAGE_KEYS.VOCAB_LEARNED)
}
