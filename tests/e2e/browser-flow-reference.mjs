import assert from "node:assert/strict"
import { E2E_STORAGE_KEYS } from "./storage-keys.mjs"

export async function verifyReferenceKeyboardFlow(page, baseUrl) {
  await page.goto(`${baseUrl}/grammar`, { waitUntil: "networkidle" })

  await page.getByTestId("grammar-point-n5-wa").focus()
  await page.keyboard.press("Enter")
  await page.getByRole("dialog").waitFor({ state: "visible" })
  await page.waitForFunction(() => document.activeElement?.getAttribute("role") === "dialog")
  const position = page.getByTestId("grammar-modal-position")
  await position.waitFor({ state: "visible" })
  assert.match(await position.innerText(), /^1 \/ \d+$/)

  await page.keyboard.press("ArrowRight")
  await page.waitForFunction(() => {
    const text = document.querySelector('[data-testid="grammar-modal-position"]')?.textContent?.trim() ?? ""
    return /^2 \/ \d+$/.test(text)
  })

  await page.getByTestId("grammar-modal-next").focus()
  const focusedPosition = await position.innerText()
  await page.keyboard.press("ArrowRight")
  assert.equal(
    await position.innerText(),
    focusedPosition,
    "focused grammar modal controls should ignore global ArrowRight navigation"
  )

  await page.getByTestId("grammar-modal-prev").click()
  await page.waitForFunction(() => {
    const text = document.querySelector('[data-testid="grammar-modal-position"]')?.textContent?.trim() ?? ""
    return /^1 \/ \d+$/.test(text)
  })

  await page.getByTestId("grammar-practice-start").click()
  await page.getByTestId("grammar-practice-answer-1").click()
  await page.getByTestId("grammar-practice-feedback").waitFor({ state: "visible" })

  const grammarPracticeState = await page.evaluate((storageKeys) => {
    const practice = JSON.parse(localStorage.getItem(storageKeys.PRACTICE_RESULTS) ?? "[]")
    const mistakes = JSON.parse(localStorage.getItem(storageKeys.MISTAKES) ?? "[]")
    return {
      result: practice.filter((item) => item.itemId === "n5-wa" && item.itemType === "grammar").at(-1),
      mistake: mistakes.find((item) => item.id === "grammar-practice:n5-wa:topic-particle"),
    }
  }, E2E_STORAGE_KEYS)

  assert.equal(grammarPracticeState.result?.mode, "recognition")
  assert.equal(grammarPracticeState.result?.correct, false)
  assert.equal(grammarPracticeState.result?.answer, "が")
  assert.equal(grammarPracticeState.mistake?.itemId, "n5-wa")
  assert.equal(grammarPracticeState.mistake?.itemType, "grammar")
  assert.equal(grammarPracticeState.mistake?.mode, "recognition")

  await page.getByTestId("grammar-practice-next").click()
  for (let remaining = 0; remaining < 8; remaining += 1) {
    if (await page.getByTestId("grammar-practice-summary").isVisible()) break
    await page.locator('[data-testid^="grammar-practice-answer-"]').first().click()
    await page.getByTestId("grammar-practice-feedback").waitFor({ state: "visible" })
    await page.getByTestId("grammar-practice-next").click()
  }
  await page.getByTestId("grammar-practice-summary").waitFor({ state: "visible" })

  await page.keyboard.press("Escape")
  await page.getByRole("dialog").waitFor({ state: "hidden" })
  assert.equal(
    await page.evaluate(() => document.activeElement?.getAttribute("data-testid")),
    "grammar-point-n5-wa",
    "closing a grammar modal should restore focus to the opened card"
  )

  await page.goto(`${baseUrl}/semantics?item=s-shiru-wakaru`, { waitUntil: "networkidle" })
  await page.waitForURL(/\/semantics\/s-shiru-wakaru$/)
  await page.getByRole("dialog").waitFor({ state: "visible" })

  await page.keyboard.press("ArrowRight")
  await page.waitForURL(/\/semantics\/s-miru-kinds$/)
  await page.getByRole("dialog").waitFor({ state: "visible" })

  await page.keyboard.press("Escape")
  await page.waitForURL(/\/semantics$/)
  await page.getByRole("dialog").waitFor({ state: "hidden" })

  await page.goto(`${baseUrl}/pragmatics/p-aisatsu-morning`, { waitUntil: "networkidle" })
  await page.getByRole("dialog").waitFor({ state: "visible" })

  await page.keyboard.press("Escape")
  await page.waitForURL(/\/pragmatics$/)
  await page.getByRole("dialog").waitFor({ state: "hidden" })
}
