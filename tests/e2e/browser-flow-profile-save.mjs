import assert from "node:assert/strict"

import { readJsonStorage } from "./harness.mjs"
import { E2E_STORAGE_KEYS } from "./storage-keys.mjs"

async function failProfileWrites(page) {
  await page.evaluate((key) => {
    const originalSetItem = Storage.prototype.setItem
    window.__yasashiRestoreProfileSetItem = () => {
      Storage.prototype.setItem = originalSetItem
      delete window.__yasashiRestoreProfileSetItem
    }
    Storage.prototype.setItem = function setItemWithE2EProfileFailure(storageKey, value) {
      if (storageKey === key) throw new Error("E2E simulated profile write failure")
      return originalSetItem.call(this, storageKey, value)
    }
  }, E2E_STORAGE_KEYS.USER_PROFILE)
}

async function restoreProfileWrites(page) {
  await page.evaluate(() => {
    window.__yasashiRestoreProfileSetItem?.()
  })
}

export async function verifyProfileSaveFailureFlow(page, baseUrl) {
  await page.goto(baseUrl, { waitUntil: "networkidle" })
  await page.evaluate(() => localStorage.clear())
  await page.reload({ waitUntil: "networkidle" })

  await page.getByTestId("home-edit-profile").click()
  await page.getByTestId("onboarding-goal-travel").click()
  await page.getByTestId("onboarding-some").click()
  await page.getByTestId("onboarding-always").click()
  await page.getByTestId("onboarding-minutes").focus()
  await page.keyboard.press("ArrowRight")

  await failProfileWrites(page)
  await page.getByTestId("onboarding-save").click()
  await page.getByTestId("practice-save-error").waitFor({ state: "visible" })
  assert.equal(await readJsonStorage(page, E2E_STORAGE_KEYS.USER_PROFILE), null)
  assert.equal(await page.getByTestId("onboarding-save").isVisible(), true)
  await restoreProfileWrites(page)

  await page.getByTestId("onboarding-save").click()
  await page.waitForFunction((key) => {
    const profile = JSON.parse(localStorage.getItem(key) ?? "null")
    return profile?.goal === "travel" && profile?.kanaLevel === "some" && profile?.romajiMode === "always"
  }, E2E_STORAGE_KEYS.USER_PROFILE)
  const savedProfile = await readJsonStorage(page, E2E_STORAGE_KEYS.USER_PROFILE)
  assert.equal(savedProfile?.minutesPerDay, 15, "profile save retry should persist the selected daily minutes")
}
