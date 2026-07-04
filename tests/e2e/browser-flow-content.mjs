import assert from "node:assert/strict"

import { readJsonStorage } from "./harness.mjs"
import { E2E_STORAGE_KEYS } from "./storage-keys.mjs"

const modalFocusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(", ")

async function readDialogFocusState(page) {
  return page.evaluate((selector) => {
    const dialog = document.querySelector('[role="dialog"][aria-modal="true"]')
    if (!dialog) return { hasDialog: false }

    const focusableElements = Array.from(dialog.querySelectorAll(selector)).filter(
      (element) => !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true"
    )
    const activeElement = document.activeElement
    const labelledBy = dialog.getAttribute("aria-labelledby")
    const describedBy = dialog.getAttribute("aria-describedby")

    return {
      hasDialog: true,
      activeIndex: focusableElements.indexOf(activeElement),
      containsFocus: activeElement === dialog || dialog.contains(activeElement),
      focusableCount: focusableElements.length,
      labelledBy,
      describedBy,
      titleText: labelledBy ? document.getElementById(labelledBy)?.textContent?.trim() ?? "" : "",
      descriptionText: describedBy ? document.getElementById(describedBy)?.textContent?.trim() ?? "" : "",
    }
  }, modalFocusableSelector)
}

async function verifyDialogHasAccessibleName(page, message) {
  await page.getByRole("dialog").waitFor({ state: "visible" })
  const state = await readDialogFocusState(page)

  assert.equal(state.hasDialog, true, `${message}: dialog should be visible`)
  assert.ok(state.labelledBy, `${message}: dialog should declare aria-labelledby`)
  assert.ok(state.titleText.length > 0, `${message}: aria-labelledby should point to non-empty text`)
}

async function verifyDialogTabTrap(page) {
  await page.getByRole("dialog").waitFor({ state: "visible" })
  await page.waitForFunction(() => {
    const dialog = document.querySelector('[role="dialog"][aria-modal="true"]')
    return document.activeElement === dialog
  })

  const initial = await readDialogFocusState(page)
  assert.equal(initial.hasDialog, true, "modal focus trap should run inside a visible dialog")
  assert.ok(initial.focusableCount >= 2, "modal focus trap needs multiple controls to prove focus wrapping")

  await page.keyboard.press("Shift+Tab")
  const wrappedBackward = await readDialogFocusState(page)
  assert.equal(wrappedBackward.containsFocus, true, "Shift+Tab from the dialog should keep focus in the modal")
  assert.equal(
    wrappedBackward.activeIndex,
    initial.focusableCount - 1,
    "Shift+Tab from the dialog should wrap focus to the last modal control"
  )

  await page.keyboard.press("Tab")
  const wrappedForward = await readDialogFocusState(page)
  assert.equal(wrappedForward.containsFocus, true, "Tab from the last modal control should keep focus in the modal")
  assert.equal(wrappedForward.activeIndex, 0, "Tab from the last modal control should wrap focus to the first modal control")
}

export async function verifyKanaAndVocabularyFlow(page, baseUrl) {
  await page.goto(`${baseUrl}/kana`, { waitUntil: "networkidle" })
  await page.getByTestId("kana-card-a").click()
  await verifyDialogHasAccessibleName(page, "kana detail modal")
  await verifyDialogTabTrap(page)
  await page.getByTestId("kana-stroke-toggle").click()
  await page.getByTestId("kana-stroke-board").waitFor({ state: "visible" })
  await page.getByTestId("kana-mastery-toggle").click()
  await page.waitForFunction((storageKeys) => {
    const mastered = JSON.parse(localStorage.getItem(storageKeys.KANA_MASTERED) ?? "[]")
    const srs = JSON.parse(localStorage.getItem(storageKeys.SRS_KANA) ?? "{}")
    return Array.isArray(mastered) && mastered.includes("a") && !!srs?.a?.dueAt
  }, E2E_STORAGE_KEYS)
  const masteredKana = await readJsonStorage(page, E2E_STORAGE_KEYS.KANA_MASTERED)
  assert.ok(Array.isArray(masteredKana) && masteredKana.includes("a"), "kana mastery toggle should persist kana a")
  const masteredKanaSrs = await readJsonStorage(page, E2E_STORAGE_KEYS.SRS_KANA)
  assert.ok(masteredKanaSrs?.a?.dueAt, "kana mastery toggle should enroll kana a for SRS review")
  await page.keyboard.press("Escape")
  await page.getByTestId("kana-clear-progress").click()
  await page.getByTestId("kana-clear-progress-dialog-cancel").click()
  assert.ok(
    (await readJsonStorage(page, E2E_STORAGE_KEYS.KANA_MASTERED)).includes("a"),
    "canceling kana progress reset should keep mastered kana"
  )
  await page.getByTestId("kana-clear-progress").click()
  await page.getByTestId("kana-clear-progress-dialog-confirm").click()
  await page.waitForFunction((key) => {
    const mastered = JSON.parse(localStorage.getItem(key) ?? "[]")
    return Array.isArray(mastered) && mastered.length === 0
  }, E2E_STORAGE_KEYS.KANA_MASTERED)

  await page.goto(`${baseUrl}/vocabulary`, { waitUntil: "networkidle" })
  await page.getByTestId("vocabulary-search").fill("みせ")
  await page.getByText("みせ").first().waitFor({ state: "visible" })
  assert.equal(await page.getByTestId("vocabulary-expand-sur-n-35").evaluate((element) => element.tabIndex), 0)
  assert.equal(await page.getByTestId("vocabulary-expand-back-sur-n-35").evaluate((element) => element.tabIndex), -1)
  await page.getByTestId("vocabulary-expand-sur-n-35").locator("xpath=ancestor::*[@role='button'][1]").press("Space")
  await page.getByTestId("vocabulary-expand-back-sur-n-35").waitFor({ state: "visible" })
  assert.equal(await page.getByTestId("vocabulary-expand-sur-n-35").evaluate((element) => element.tabIndex), -1)
  assert.equal(await page.getByTestId("vocabulary-expand-back-sur-n-35").evaluate((element) => element.tabIndex), 0)
  await page.getByTestId("vocabulary-expand-back-sur-n-35").press("Space")
  await page.getByRole("dialog").waitFor({ state: "visible" })
  await verifyDialogHasAccessibleName(page, "vocabulary focus modal")
  await page.getByTestId("vocabulary-focus-card").press("Space")
  await page.getByTestId("vocabulary-learned-toggle").waitFor({ state: "visible" })
  await page.getByTestId("vocabulary-learned-toggle").press("Space")
  await page.getByTestId("vocabulary-learned-toggle").waitFor({ state: "visible" })
  await page.waitForFunction((key) => {
    const learned = JSON.parse(localStorage.getItem(key) ?? "[]")
    return Array.isArray(learned) && learned.includes("sur-n-35")
  }, E2E_STORAGE_KEYS.VOCAB_LEARNED)
  await page.waitForFunction((storageKeys) => {
    const learned = JSON.parse(localStorage.getItem(storageKeys.VOCAB_LEARNED) ?? "[]")
    const srs = JSON.parse(localStorage.getItem(storageKeys.SRS_VOCAB) ?? "{}")
    return Array.isArray(learned) && learned.includes("sur-n-35") && !!srs?.["sur-n-35"]?.dueAt
  }, E2E_STORAGE_KEYS)
  const learnedVocab = await readJsonStorage(page, E2E_STORAGE_KEYS.VOCAB_LEARNED)
  assert.ok(Array.isArray(learnedVocab) && learnedVocab.includes("sur-n-35"), "vocabulary learned toggle should support keyboard activation without flipping the modal")
  const vocabSrs = await readJsonStorage(page, E2E_STORAGE_KEYS.SRS_VOCAB)
  assert.ok(vocabSrs?.["sur-n-35"]?.dueAt, "vocabulary learned toggle should enroll the selected vocabulary for SRS review")
  await page.keyboard.press("Escape")
  await page.getByTestId("vocabulary-clear-progress").click()
  await page.getByTestId("vocabulary-clear-progress-dialog-cancel").click()
  assert.ok(
    (await readJsonStorage(page, E2E_STORAGE_KEYS.VOCAB_LEARNED)).includes("sur-n-35"),
    "canceling vocabulary progress reset should keep learned vocabulary"
  )
  await page.getByTestId("vocabulary-clear-progress").click()
  await page.getByTestId("vocabulary-clear-progress-dialog-confirm").click()
  await page.waitForFunction((key) => {
    const learned = JSON.parse(localStorage.getItem(key) ?? "[]")
    return Array.isArray(learned) && learned.length === 0
  }, E2E_STORAGE_KEYS.VOCAB_LEARNED)
  await page.goto(`${baseUrl}/vocabulary`, { waitUntil: "networkidle" })
  await page.getByTestId("vocabulary-level-daily").click()
  await page.getByTestId("vocabulary-search").fill("Yakusoku")
  await page.getByText("約束").first().waitFor({ state: "visible" })
  await page.getByTestId("vocabulary-level-fluent").click()
  await page.getByTestId("vocabulary-search").fill("Gainen")
  await page.getByText("概念").first().waitFor({ state: "visible" })
}
