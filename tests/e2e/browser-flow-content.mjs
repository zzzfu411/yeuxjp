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

async function verifyKanaStrokeBoardRendered(page) {
  const board = page.getByTestId("kana-stroke-board")
  await board.waitFor({ state: "visible" })
  await page.waitForFunction(() => {
    const boardElement = document.querySelector('[data-testid="kana-stroke-board"]')
    const progressElement = boardElement?.querySelector("[data-active-stroke]")
    const activeStroke = Number(progressElement?.getAttribute("data-active-stroke"))
    const strokePaths = Array.from(boardElement?.querySelectorAll("path[data-stroke-index]") ?? [])
    const hasRenderableStrokeGeometry = strokePaths.length > 1 && strokePaths.every((path) => {
      if (!(path instanceof SVGPathElement)) return false
      if (path.parentElement?.namespaceURI !== "http://www.w3.org/2000/svg") return false
      return path.getTotalLength() > 0
    })
    return Boolean(
      boardElement?.querySelector("svg") &&
      hasRenderableStrokeGeometry &&
      Number.isFinite(activeStroke)
    )
  })
  await page.waitForFunction(() => {
    const boardElement = document.querySelector('[data-testid="kana-stroke-board"]')
    const progressElement = boardElement?.querySelector("[data-active-stroke]")
    const activeStroke = Number(progressElement?.getAttribute("data-active-stroke") ?? "0")
    return activeStroke > 0
  })
}

async function readKanaStrokePlaybackState(page) {
  return page.evaluate(() => {
    const boardElement = document.querySelector('[data-testid="kana-stroke-board"]')
    const progressElement = boardElement?.querySelector("[data-active-stroke]")
    const activeStroke = Number(progressElement?.getAttribute("data-active-stroke") ?? "0")
    const progressText = document.querySelector('[data-testid="kana-stroke-progress"]')?.textContent?.trim() ?? ""
    const speedText = document.querySelector('[data-testid="kana-stroke-speed"]')?.textContent?.trim() ?? ""

    return { activeStroke, progressText, speedText }
  })
}

async function verifyKanaStrokeControls(page) {
  await page.getByTestId("kana-stroke-progress").waitFor({ state: "visible" })
  await page.getByTestId("kana-stroke-replay").click()
  await page.getByTestId("kana-stroke-play-toggle").click()
  await page.waitForFunction(() => {
    const boardElement = document.querySelector('[data-testid="kana-stroke-board"]')
    const progressElement = boardElement?.querySelector("[data-active-stroke]")
    const activeStroke = Number(progressElement?.getAttribute("data-active-stroke") ?? "0")
    return Number.isFinite(activeStroke) && activeStroke <= 1
  })

  const paused = await readKanaStrokePlaybackState(page)
  assert.ok(paused.progressText.includes("/"), "kana stroke progress should report current and total strokes")
  assert.ok(paused.speedText.length > 0, "kana stroke speed button should show the current speed label")
  await page.waitForTimeout(700)
  const stillPaused = await readKanaStrokePlaybackState(page)
  assert.equal(stillPaused.activeStroke, paused.activeStroke, "paused kana stroke playback should not advance")

  await page.getByTestId("kana-stroke-next").click()
  await page.waitForFunction((previous) => {
    const boardElement = document.querySelector('[data-testid="kana-stroke-board"]')
    const progressElement = boardElement?.querySelector("[data-active-stroke]")
    const activeStroke = Number(progressElement?.getAttribute("data-active-stroke") ?? "0")
    return Number.isFinite(activeStroke) && activeStroke > previous
  }, paused.activeStroke)
  const afterNext = await readKanaStrokePlaybackState(page)

  await page.getByTestId("kana-stroke-prev").click()
  await page.waitForFunction((previous) => {
    const boardElement = document.querySelector('[data-testid="kana-stroke-board"]')
    const progressElement = boardElement?.querySelector("[data-active-stroke]")
    const activeStroke = Number(progressElement?.getAttribute("data-active-stroke") ?? "0")
    return Number.isFinite(activeStroke) && activeStroke < previous
  }, afterNext.activeStroke)

  const speedBefore = (await readKanaStrokePlaybackState(page)).speedText
  await page.getByTestId("kana-stroke-speed").click()
  await page.waitForFunction((before) => {
    const speedText = document.querySelector('[data-testid="kana-stroke-speed"]')?.textContent?.trim() ?? ""
    return speedText.length > 0 && speedText !== before
  }, speedBefore)
}

async function waitForVisibleImagesToSettle(page) {
  await page.waitForFunction(() => {
    const visibleImages = Array.from(document.images).filter((image) => {
      const rect = image.getBoundingClientRect()
      const style = window.getComputedStyle(image)
      return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden"
    })

    return visibleImages.every((image) => image.complete)
  })
}

async function verifyKanaFilterControls(page) {
  const katakanaA = String.fromCodePoint(0x30a2)

  await page.getByTestId("kana-mode-katakana").click()
  assert.equal(await page.getByTestId("kana-mode-katakana").getAttribute("aria-pressed"), "true")
  assert.ok(
    (await page.getByTestId("kana-card-a").getAttribute("aria-label"))?.includes(katakanaA),
    "katakana mode should show katakana glyphs on kana cards"
  )
  await page.getByTestId("kana-mode-hiragana").click()
  assert.equal(await page.getByTestId("kana-mode-hiragana").getAttribute("aria-pressed"), "true")

  await page.getByTestId("kana-set-yoon").click()
  assert.equal(await page.getByTestId("kana-set-yoon").getAttribute("aria-pressed"), "true")
  await page.getByTestId("kana-card-kya").waitFor({ state: "visible" })
  await page.getByTestId("kana-card-a").waitFor({ state: "hidden" })
  await waitForVisibleImagesToSettle(page)

  await page.getByTestId("kana-set-special").click()
  assert.equal(await page.getByTestId("kana-set-special").getAttribute("aria-pressed"), "true")
  await page.getByTestId("kana-card-sokuon").waitFor({ state: "visible" })
  await waitForVisibleImagesToSettle(page)

  await page.getByTestId("kana-set-seion").click()
  assert.equal(await page.getByTestId("kana-set-seion").getAttribute("aria-pressed"), "true")
  await page.getByTestId("kana-card-ka").getByText("ka", { exact: true }).waitFor({ state: "visible" })
  await page.getByTestId("kana-romaji-toggle").click()
  assert.equal(await page.getByTestId("kana-romaji-toggle").getAttribute("aria-pressed"), "false")
  await page.getByTestId("kana-card-ka").getByText("ka", { exact: true }).waitFor({ state: "hidden" })
  await page.getByTestId("kana-romaji-toggle").click()
  assert.equal(await page.getByTestId("kana-romaji-toggle").getAttribute("aria-pressed"), "true")
}

export async function verifyKanaAndVocabularyFlow(page, baseUrl) {
  await page.goto(`${baseUrl}/kana`, { waitUntil: "networkidle" })
  await verifyKanaFilterControls(page)
  await page.getByTestId("kana-card-a").click()
  await verifyDialogHasAccessibleName(page, "kana detail modal")
  await verifyDialogTabTrap(page)
  await page.getByTestId("kana-stroke-toggle").click()
  await verifyKanaStrokeBoardRendered(page)
  await verifyKanaStrokeControls(page)
  await page.getByTestId("kana-mastery-toggle").click()
  await page.waitForFunction((storageKeys) => {
    const mastered = JSON.parse(localStorage.getItem(storageKeys.KANA_MASTERED) ?? "[]")
    const srs = JSON.parse(localStorage.getItem(storageKeys.SRS_KANA) ?? "{}")
    return Array.isArray(mastered) && mastered.includes("hiragana:a") && !!srs?.["hiragana:a"]?.dueAt
  }, E2E_STORAGE_KEYS)
  const masteredKana = await readJsonStorage(page, E2E_STORAGE_KEYS.KANA_MASTERED)
  assert.ok(
    Array.isArray(masteredKana) && masteredKana.includes("hiragana:a"),
    "kana mastery toggle should persist hiragana a"
  )
  assert.equal(masteredKana.includes("katakana:a"), false, "mastering hiragana a should not master katakana a")
  const masteredKanaSrs = await readJsonStorage(page, E2E_STORAGE_KEYS.SRS_KANA)
  assert.ok(masteredKanaSrs?.["hiragana:a"]?.dueAt, "kana mastery toggle should enroll hiragana a for SRS review")
  assert.equal(masteredKanaSrs?.["katakana:a"], undefined, "mastering hiragana a should not enroll katakana a")
  await page.keyboard.press("Escape")
  await page.getByTestId("kana-only-unmastered-toggle").click()
  assert.equal(await page.getByTestId("kana-only-unmastered-toggle").getAttribute("aria-pressed"), "true")
  await page.getByTestId("kana-card-a").waitFor({ state: "hidden" })
  await page.getByTestId("kana-card-i").waitFor({ state: "visible" })
  await page.getByTestId("kana-mode-katakana").click()
  await page.getByTestId("kana-card-a").waitFor({ state: "visible" })
  await page.getByTestId("kana-card-a").click()
  assert.equal(
    await page.getByTestId("kana-mastery-toggle").getAttribute("aria-pressed"),
    "false",
    "katakana a should remain unmastered after mastering hiragana a"
  )
  await page.keyboard.press("Escape")
  await page.getByTestId("kana-mode-hiragana").click()
  await page.getByTestId("kana-card-a").waitFor({ state: "hidden" })
  await page.getByTestId("kana-only-unmastered-toggle").click()
  assert.equal(await page.getByTestId("kana-only-unmastered-toggle").getAttribute("aria-pressed"), "false")
  await page.getByTestId("kana-card-a").waitFor({ state: "visible" })
  await page.getByTestId("kana-clear-progress").click()
  await page.getByTestId("kana-clear-progress-dialog-cancel").click()
  assert.ok(
    (await readJsonStorage(page, E2E_STORAGE_KEYS.KANA_MASTERED)).includes("hiragana:a"),
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
  const vocabularyRomajiToggle = page.getByTestId("vocabulary-toggle-romaji")
  assert.equal(await vocabularyRomajiToggle.getAttribute("aria-pressed"), "true")
  await vocabularyRomajiToggle.click()
  assert.equal(await vocabularyRomajiToggle.getAttribute("aria-pressed"), "false")
  assert.equal(await page.getByTestId("vocabulary-expand-sur-n-35").evaluate((element) => element.tabIndex), 0)
  assert.equal(await page.getByTestId("vocabulary-expand-back-sur-n-35").evaluate((element) => element.tabIndex), -1)
  await page.getByTestId("vocabulary-expand-sur-n-35").locator("xpath=ancestor::*[@role='button'][1]").press("Space")
  await page.getByTestId("vocabulary-expand-back-sur-n-35").waitFor({ state: "visible" })
  await page.getByText("Mise", { exact: true }).waitFor({ state: "hidden" })
  await vocabularyRomajiToggle.click()
  assert.equal(await vocabularyRomajiToggle.getAttribute("aria-pressed"), "true")
  await page.getByText("Mise", { exact: true }).waitFor({ state: "visible" })
  assert.equal(await page.getByTestId("vocabulary-expand-sur-n-35").evaluate((element) => element.tabIndex), -1)
  assert.equal(await page.getByTestId("vocabulary-expand-back-sur-n-35").evaluate((element) => element.tabIndex), 0)
  await page.getByTestId("vocabulary-expand-back-sur-n-35").press("Space")
  await page.getByRole("dialog").waitFor({ state: "visible" })
  await verifyDialogHasAccessibleName(page, "vocabulary focus modal")
  await page.getByTestId("vocabulary-focus-card").click()
  await page.waitForFunction(() => document.querySelector('[data-testid="vocabulary-focus-card"]')?.getAttribute("aria-pressed") === "true")
  const learnedToggle = page.getByTestId("vocabulary-learned-toggle")
  await learnedToggle.waitFor({ state: "visible" })
  await learnedToggle.click()
  await learnedToggle.waitFor({ state: "visible" })
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
  assert.ok(Array.isArray(learnedVocab) && learnedVocab.includes("sur-n-35"), "vocabulary learned toggle should persist without flipping the modal")
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
