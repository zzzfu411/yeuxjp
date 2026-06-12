import assert from "node:assert/strict"

import { readJsonStorage } from "./harness.mjs"

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
  await page.waitForFunction(() => {
    const mastered = JSON.parse(localStorage.getItem("yasashi.kana.mastered.v1") ?? "[]")
    const srs = JSON.parse(localStorage.getItem("yasashi.srs.kana.v1") ?? "{}")
    return Array.isArray(mastered) && mastered.includes("a") && !!srs?.a?.dueAt
  })
  const masteredKana = await readJsonStorage(page, "yasashi.kana.mastered.v1")
  assert.ok(Array.isArray(masteredKana) && masteredKana.includes("a"), "kana mastery toggle should persist kana a")
  const masteredKanaSrs = await readJsonStorage(page, "yasashi.srs.kana.v1")
  assert.ok(masteredKanaSrs?.a?.dueAt, "kana mastery toggle should enroll kana a for SRS review")
  await page.keyboard.press("Escape")
  await page.getByTestId("kana-clear-progress").click()
  await page.getByRole("button", { name: "取消" }).click()
  assert.ok(
    (await readJsonStorage(page, "yasashi.kana.mastered.v1")).includes("a"),
    "canceling kana progress reset should keep mastered kana"
  )
  await page.getByTestId("kana-clear-progress").click()
  await page.getByTestId("kana-clear-progress-dialog-confirm").click()
  await page.waitForFunction(() => {
    const mastered = JSON.parse(localStorage.getItem("yasashi.kana.mastered.v1") ?? "[]")
    return Array.isArray(mastered) && mastered.length === 0
  })

  await page.goto(`${baseUrl}/vocabulary`, { waitUntil: "networkidle" })
  await page.getByTestId("vocabulary-search").fill("みせ")
  await page.getByText("みせ").first().waitFor({ state: "visible" })
  await page.getByRole("button", { name: /みせ/ }).focus()
  await page.keyboard.press("Space")
  await page.getByTestId("vocabulary-expand-back-sur-n-35").waitFor({ state: "visible" })
  await page.getByTestId("vocabulary-expand-back-sur-n-35").focus()
  await page.keyboard.press("Space")
  await page.getByRole("dialog").waitFor({ state: "visible" })
  await page.getByRole("button", { name: "关闭" }).click()
  await page.getByRole("dialog").waitFor({ state: "detached" })
  await page.getByTestId("vocabulary-expand-sur-n-35").click()
  await verifyDialogHasAccessibleName(page, "vocabulary focus modal")
  await page.getByTestId("vocabulary-focus-card").focus()
  await page.keyboard.press("Space")
  await page.getByTestId("vocabulary-learned-toggle").waitFor({ state: "visible" })
  await page.getByTestId("vocabulary-learned-toggle").focus()
  await page.keyboard.press("Space")
  await page.getByTestId("vocabulary-learned-toggle").waitFor({ state: "visible" })
  await page.waitForFunction(() => {
    const learned = JSON.parse(localStorage.getItem("yasashi.vocab.learned.v1") ?? "[]")
    return Array.isArray(learned) && learned.includes("sur-n-35")
  })
  await page.waitForFunction(() => {
    const learned = JSON.parse(localStorage.getItem("yasashi.vocab.learned.v1") ?? "[]")
    const srs = JSON.parse(localStorage.getItem("yasashi.srs.vocab.v1") ?? "{}")
    return Array.isArray(learned) && learned.includes("sur-n-35") && !!srs?.["sur-n-35"]?.dueAt
  })
  const learnedVocab = await readJsonStorage(page, "yasashi.vocab.learned.v1")
  assert.ok(Array.isArray(learnedVocab) && learnedVocab.includes("sur-n-35"), "vocabulary learned toggle should support keyboard activation without flipping the modal")
  const vocabSrs = await readJsonStorage(page, "yasashi.srs.vocab.v1")
  assert.ok(vocabSrs?.["sur-n-35"]?.dueAt, "vocabulary learned toggle should enroll the selected vocabulary for SRS review")
  await page.keyboard.press("Escape")
  await page.getByTestId("vocabulary-clear-progress").click()
  await page.getByRole("button", { name: "取消" }).click()
  assert.ok(
    (await readJsonStorage(page, "yasashi.vocab.learned.v1")).includes("sur-n-35"),
    "canceling vocabulary progress reset should keep learned vocabulary"
  )
  await page.getByTestId("vocabulary-clear-progress").click()
  await page.getByTestId("vocabulary-clear-progress-dialog-confirm").click()
  await page.waitForFunction(() => {
    const learned = JSON.parse(localStorage.getItem("yasashi.vocab.learned.v1") ?? "[]")
    return Array.isArray(learned) && learned.length === 0
  })
  await page.goto(`${baseUrl}/vocabulary`, { waitUntil: "networkidle" })
  await page.getByTestId("vocabulary-level-daily").click()
  await page.getByTestId("vocabulary-search").fill("Yakusoku")
  await page.getByText("約束").first().waitFor({ state: "visible" })
  await page.getByTestId("vocabulary-level-fluent").click()
  await page.getByTestId("vocabulary-search").fill("Gainen")
  await page.getByText("概念").first().waitFor({ state: "visible" })
}
