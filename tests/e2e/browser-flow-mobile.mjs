import assert from "node:assert/strict"

import { readJsonStorage } from "./harness.mjs"
import { E2E_STORAGE_KEYS } from "./storage-keys.mjs"

async function assertNoHorizontalOverflow(page, label) {
  const size = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }))

  assert.ok(
    size.scrollWidth <= size.clientWidth + 1,
    `${label} should not overflow horizontally: scrollWidth=${size.scrollWidth}, clientWidth=${size.clientWidth}`
  )
}

export async function verifyMobileSmoke(browser, baseUrl, issueCollector = null) {
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    serviceWorkers: "block",
  })
  issueCollector?.attachContext(mobileContext)
  try {
    const mobilePage = await mobileContext.newPage()
    issueCollector?.attachPage(mobilePage)
    await mobilePage.goto(baseUrl, { waitUntil: "networkidle" })
    await mobilePage.getByTestId("home-start-learning").waitFor({ state: "visible" })

    await mobilePage.getByTestId("nav-start-learning").click()
    await mobilePage.waitForURL(/\/path$/)
    await mobilePage.getByTestId("path-next-learning").waitFor({ state: "visible" })
    assert.ok(await mobilePage.getByText("课表", { exact: true }).isVisible(), "mobile path should show course progress")
    assert.ok(await mobilePage.getByText("生存词", { exact: true }).isVisible(), "mobile path should show survival vocabulary progress")
    await assertNoHorizontalOverflow(mobilePage, "mobile path route after header CTA")

    await mobilePage.getByTestId("speech-controls-open").click()
    await mobilePage.getByRole("dialog").waitFor({ state: "visible" })
    const speechDialogName = await mobilePage.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"][aria-modal="true"]')
      const labelledBy = dialog?.getAttribute("aria-labelledby")
      return labelledBy ? document.getElementById(labelledBy)?.textContent?.trim() ?? "" : ""
    })
    assert.ok(speechDialogName.length > 0, "mobile speech settings dialog should have an accessible name")
    await mobilePage.getByTestId("speech-repeat-2").click()
    await mobilePage.waitForFunction((key) => {
      const prefs = JSON.parse(localStorage.getItem(key) ?? "{}")
      return prefs.repeat === 2
    }, E2E_STORAGE_KEYS.SPEECH_PREFS)
    assert.equal(
      (await readJsonStorage(mobilePage, E2E_STORAGE_KEYS.SPEECH_PREFS))?.repeat,
      2,
      "mobile speech settings should persist repeat changes"
    )
    await mobilePage.keyboard.press("Escape")
    await mobilePage.getByRole("dialog").waitFor({ state: "hidden" })

    await mobilePage.goto(`${baseUrl}/kana`, { waitUntil: "networkidle" })
    await mobilePage.getByTestId("kana-card-a").click()
    await mobilePage.getByRole("dialog").waitFor({ state: "visible" })
    await mobilePage.getByTestId("kana-stroke-toggle").waitFor({ state: "visible" })
    await assertNoHorizontalOverflow(mobilePage, "mobile kana detail modal")
    await mobilePage.keyboard.press("Escape")
    await mobilePage.getByRole("dialog").waitFor({ state: "hidden" })

    await mobilePage.goto(`${baseUrl}/quiz`, { waitUntil: "networkidle" })
    await mobilePage.getByTestId("quiz-mode-hiragana-romaji").waitFor({ state: "visible" })
    await mobilePage.getByTestId("quiz-mode-verb-conjugation").waitFor({ state: "visible" })
    assert.ok(
      await mobilePage.getByText("可能形、使役形").isVisible(),
      "mobile quiz should advertise potential and causative verb forms"
    )
    await mobilePage.goto(`${baseUrl}/review`, { waitUntil: "networkidle" })
    await mobilePage.getByTestId("review-today-empty").waitFor({ state: "visible" })
    await mobilePage.goto(`${baseUrl}/grammar`, { waitUntil: "networkidle" })
    await mobilePage.getByTestId("grammar-point-n5-wa").waitFor({ state: "visible" })
    await assertNoHorizontalOverflow(mobilePage, "mobile grammar route")
    await mobilePage.goto(`${baseUrl}/semantics/s-shiru-wakaru`, { waitUntil: "networkidle" })
    await mobilePage.getByText("Know (Data)").first().waitFor({ state: "visible" })
    await assertNoHorizontalOverflow(mobilePage, "mobile semantics detail route")
  } finally {
    await mobileContext.close()
  }
}
