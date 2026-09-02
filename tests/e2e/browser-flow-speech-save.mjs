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

async function verifyAutoplayStaysStableOnPreferenceChange(page, baseUrl) {
  const autoplayPage = await page.context().newPage()
  try {
    await autoplayPage.addInitScript((storageKey) => {
      const spoken = []
      class FakeUtterance {
        constructor(text) {
          this.text = text
        }
      }

      Object.defineProperty(window, "__yasashiSpeechSpoken", {
        configurable: true,
        value: spoken,
      })
      Object.defineProperty(window, "SpeechSynthesisUtterance", {
        configurable: true,
        writable: true,
        value: FakeUtterance,
      })
      Object.defineProperty(window, "speechSynthesis", {
        configurable: true,
        value: {
          cancel() {},
          getVoices: () => [],
          speak(utterance) {
            spoken.push(utterance.text)
          },
        },
      })
      localStorage.setItem(storageKey, JSON.stringify({
        rate: 0.9,
        repeat: 1,
        autoPlay: true,
        gapMs: 250,
      }))
    }, E2E_STORAGE_KEYS.SPEECH_PREFS)

    await autoplayPage.goto(`${baseUrl}/quiz`, { waitUntil: "networkidle" })
    await autoplayPage.getByTestId("quiz-mode-audio-kana").click()
    await autoplayPage.getByTestId("speech-repeat-2").waitFor({ state: "visible" })
    await autoplayPage.waitForFunction(() => window.__yasashiSpeechSpoken?.length === 1, undefined, { timeout: 2_000 })

    await autoplayPage.getByTestId("speech-repeat-2").click()
    await autoplayPage.waitForFunction((key) => {
      const prefs = JSON.parse(localStorage.getItem(key) ?? "null")
      return prefs?.repeat === 2
    }, E2E_STORAGE_KEYS.SPEECH_PREFS)
    await autoplayPage.waitForTimeout(700)

    const spokenCount = await autoplayPage.evaluate(() => window.__yasashiSpeechSpoken?.length ?? 0)
    assert.equal(spokenCount, 1, "changing repeat should not replay the unchanged autoplay prompt")
  } finally {
    await autoplayPage.close()
  }
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

  await verifyAutoplayStaysStableOnPreferenceChange(page, baseUrl)
}
