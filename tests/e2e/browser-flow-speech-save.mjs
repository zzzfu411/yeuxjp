import assert from "node:assert/strict"

import { readJsonStorage } from "./harness.mjs"
import { E2E_STORAGE_KEYS } from "./storage-keys.mjs"

async function failSpeechPreferenceWrites(page) {
  await page.evaluate((key) => {
    const originalSetItem = Storage.prototype.setItem
    window.__yasashiRestoreSpeechSetItem = () => {
      Storage.prototype.setItem = originalSetItem
      delete window.__yasashiRestoreSpeechSetItem
    }
    Storage.prototype.setItem = function setItemWithE2ESpeechFailure(storageKey, value) {
      if (storageKey === key) throw new Error("E2E simulated speech preference write failure")
      return originalSetItem.call(this, storageKey, value)
    }
  }, E2E_STORAGE_KEYS.SPEECH_PREFS)
}

async function restoreSpeechPreferenceWrites(page) {
  await page.evaluate(() => {
    window.__yasashiRestoreSpeechSetItem?.()
  })
}

export async function verifySpeechPreferenceSaveFailureFlow(page, baseUrl) {
  await page.goto(`${baseUrl}/review`, { waitUntil: "networkidle" })
  await page.evaluate((key) => localStorage.removeItem(key), E2E_STORAGE_KEYS.SPEECH_PREFS)

  await failSpeechPreferenceWrites(page)
  await page.getByTestId("speech-repeat-2").click()
  await page.getByTestId("practice-save-error").waitFor({ state: "visible" })
  assert.equal(await readJsonStorage(page, E2E_STORAGE_KEYS.SPEECH_PREFS), null)
  await restoreSpeechPreferenceWrites(page)

  await page.getByTestId("speech-repeat-2").click()
  await page.waitForFunction((key) => {
    const prefs = JSON.parse(localStorage.getItem(key) ?? "null")
    return prefs?.repeat === 2
  }, E2E_STORAGE_KEYS.SPEECH_PREFS)
  await page.getByTestId("practice-save-error").waitFor({ state: "hidden" })
  const savedPrefs = await readJsonStorage(page, E2E_STORAGE_KEYS.SPEECH_PREFS)
  assert.equal(savedPrefs?.repeat, 2, "speech preference save retry should persist repeat count")

  await page.getByTestId("speech-autoplay-toggle").click()
  await page.waitForFunction((key) => {
    const prefs = JSON.parse(localStorage.getItem(key) ?? "null")
    return prefs?.autoPlay === false
  }, E2E_STORAGE_KEYS.SPEECH_PREFS)
  const autoplayPrefs = await readJsonStorage(page, E2E_STORAGE_KEYS.SPEECH_PREFS)
  assert.equal(autoplayPrefs?.autoPlay, false, "speech autoplay toggle should persist autoplay preference")

  await page.getByTestId("speech-preferences-reset").click()
  await page.waitForFunction((key) => {
    const prefs = JSON.parse(localStorage.getItem(key) ?? "null")
    return prefs?.rate === 0.9 && prefs?.repeat === 1 && prefs?.autoPlay === true && prefs?.gapMs === 250
  }, E2E_STORAGE_KEYS.SPEECH_PREFS)
  const resetPrefs = await readJsonStorage(page, E2E_STORAGE_KEYS.SPEECH_PREFS)
  assert.deepEqual(
    resetPrefs,
    { rate: 0.9, repeat: 1, autoPlay: true, gapMs: 250 },
    "speech preference reset should restore default speech preferences"
  )
}
