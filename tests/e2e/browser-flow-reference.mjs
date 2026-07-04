import assert from "node:assert/strict"

export async function verifyReferenceKeyboardFlow(page, baseUrl) {
  await page.goto(`${baseUrl}/grammar`, { waitUntil: "networkidle" })

  await page.getByTestId("grammar-point-n5-wa").focus()
  await page.keyboard.press("Enter")
  await page.getByRole("dialog").waitFor({ state: "visible" })
  await page.waitForFunction(() => document.activeElement?.getAttribute("role") === "dialog")
  await page.getByText(/1 \/ 25/).waitFor({ state: "visible" })

  await page.keyboard.press("ArrowRight")
  await page.getByText(/2 \/ 25/).waitFor({ state: "visible" })

  await page.getByTestId("grammar-modal-next").focus()
  await page.keyboard.press("ArrowRight")
  await page.getByText(/2 \/ 25/).waitFor({ state: "visible" })
  assert.equal(
    await page.getByText(/3 \/ 25/).isVisible(),
    false,
    "focused grammar modal controls should ignore global ArrowRight navigation"
  )

  await page.getByTestId("grammar-modal-prev").click()
  await page.getByText(/1 \/ 25/).waitFor({ state: "visible" })

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
