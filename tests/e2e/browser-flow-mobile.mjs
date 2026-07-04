import assert from "node:assert/strict"

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

export async function verifyMobileSmoke(browser, baseUrl) {
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  })
  try {
    const mobilePage = await mobileContext.newPage()
    await mobilePage.goto(baseUrl, { waitUntil: "networkidle" })
    await mobilePage.getByTestId("home-start-learning").waitFor({ state: "visible" })
    await mobilePage.goto(`${baseUrl}/kana`, { waitUntil: "networkidle" })
    await mobilePage.getByTestId("kana-card-a").waitFor({ state: "visible" })
    await mobilePage.goto(`${baseUrl}/quiz`, { waitUntil: "networkidle" })
    await mobilePage.getByTestId("quiz-mode-hiragana-romaji").waitFor({ state: "visible" })
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
