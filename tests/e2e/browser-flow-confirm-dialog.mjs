import assert from "node:assert/strict"

import { readJsonStorage } from "./harness.mjs"
import { E2E_STORAGE_KEYS } from "./storage-keys.mjs"

const focusableSelector = [
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
    const activeElement = document.activeElement
    if (!dialog) {
      return {
        hasDialog: false,
        activeTestId: activeElement?.getAttribute("data-testid") ?? null,
      }
    }

    const focusableElements = Array.from(dialog.querySelectorAll(selector)).filter(
      (element) => !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true"
    )
    const labelledBy = dialog.getAttribute("aria-labelledby")
    const describedBy = dialog.getAttribute("aria-describedby")

    return {
      hasDialog: true,
      activeIndex: focusableElements.indexOf(activeElement),
      activeTestId: activeElement?.getAttribute("data-testid") ?? null,
      containsFocus: activeElement === dialog || dialog.contains(activeElement),
      focusableCount: focusableElements.length,
      labelledBy,
      describedBy,
      titleText: labelledBy ? document.getElementById(labelledBy)?.textContent?.trim() ?? "" : "",
      descriptionText: describedBy ? document.getElementById(describedBy)?.textContent?.trim() ?? "" : "",
    }
  }, focusableSelector)
}

async function seedKanaProgress(page, baseUrl) {
  await page.goto(baseUrl, { waitUntil: "networkidle" })
  await page.evaluate((storageKeys) => {
    const now = Date.now()
    localStorage.clear()
    localStorage.setItem(storageKeys.KANA_MASTERED, JSON.stringify(["a"]))
    localStorage.setItem(
      storageKeys.SRS_KANA,
      JSON.stringify({ a: { box: 1, dueAt: now + 60_000, createdAt: now - 1000, right: 0, wrong: 0 } })
    )
  }, E2E_STORAGE_KEYS)
}

export async function verifyConfirmDialogKeyboardFlow(page, baseUrl) {
  await seedKanaProgress(page, baseUrl)
  await page.goto(`${baseUrl}/kana`, { waitUntil: "networkidle" })

  const trigger = page.getByTestId("kana-clear-progress")
  await trigger.focus()
  await trigger.click()
  await page.getByRole("dialog").waitFor({ state: "visible" })
  await page.waitForFunction(() => document.activeElement?.getAttribute("role") === "dialog")

  const initial = await readDialogFocusState(page)
  assert.equal(initial.hasDialog, true, "confirm dialog should open inside the shared modal")
  assert.equal(initial.containsFocus, true, "confirm dialog should receive focus on open")
  assert.ok(initial.labelledBy, "confirm dialog should expose an accessible title")
  assert.ok(initial.describedBy, "confirm dialog should expose an accessible description")
  assert.ok(initial.titleText.length > 0, "confirm dialog title should be readable")
  assert.ok(initial.descriptionText.length > 0, "confirm dialog description should be readable")
  assert.ok(initial.focusableCount >= 3, "confirm dialog should include close, cancel, and confirm controls")

  await page.keyboard.press("Shift+Tab")
  const wrappedBackward = await readDialogFocusState(page)
  assert.equal(wrappedBackward.containsFocus, true, "Shift+Tab should keep focus inside the confirm dialog")
  assert.equal(
    wrappedBackward.activeIndex,
    initial.focusableCount - 1,
    "Shift+Tab from the dialog should wrap to the last confirm dialog control"
  )

  await page.keyboard.press("Tab")
  const wrappedForward = await readDialogFocusState(page)
  assert.equal(wrappedForward.containsFocus, true, "Tab should keep focus inside the confirm dialog")
  assert.equal(wrappedForward.activeIndex, 0, "Tab from the last confirm dialog control should wrap to the first control")

  await page.keyboard.press("Escape")
  await page.getByRole("dialog").waitFor({ state: "hidden" })
  await page.waitForFunction(() => document.activeElement?.getAttribute("data-testid") === "kana-clear-progress")

  const afterEscapeMastered = await readJsonStorage(page, E2E_STORAGE_KEYS.KANA_MASTERED)
  const afterEscapeSrs = await readJsonStorage(page, E2E_STORAGE_KEYS.SRS_KANA)
  assert.ok(
    Array.isArray(afterEscapeMastered) && afterEscapeMastered.includes("a"),
    "confirm dialog Escape should cancel without clearing kana progress"
  )
  assert.ok(afterEscapeSrs?.a?.dueAt, "confirm dialog Escape should preserve kana SRS state")
}
