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
  } finally {
    await mobileContext.close()
  }
}
