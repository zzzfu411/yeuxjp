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

async function assertActiveNavLinkVisible(page, label) {
  const state = await page.evaluate(() => {
    const nav = document.querySelector("nav")
    const activeLink = nav?.querySelector('a[aria-current="page"]')
    if (!nav || !activeLink) return null

    const navRect = nav.getBoundingClientRect()
    const linkRect = activeLink.getBoundingClientRect()
    return {
      text: activeLink.textContent?.trim() ?? "",
      visible: linkRect.left >= navRect.left - 1 && linkRect.right <= navRect.right + 1,
    }
  })

  assert.ok(state, `${label} should expose an active navigation link`)
  assert.ok(state.visible, `${label} active navigation link should be visible: ${state.text}`)
}

async function assertCoverCopyBelowNavbar(page, label) {
  const state = await page.evaluate(() => {
    const header = document.querySelector(".paper-nav")
    const eyebrow = document.querySelector(".paper-cover .eyebrow")
    const title = document.querySelector(".paper-cover h1")
    if (!header || !eyebrow || !title) return null

    const headerBottom = header.getBoundingClientRect().bottom
    return {
      headerBottom,
      eyebrowTop: eyebrow.getBoundingClientRect().top,
      titleTop: title.getBoundingClientRect().top,
    }
  })

  assert.ok(state, `${label} should render cover copy and navbar`)
  assert.ok(
    state.eyebrowTop >= state.headerBottom - 1 && state.titleTop >= state.headerBottom - 1,
    `${label} cover copy should clear the fixed navbar: eyebrow=${state.eyebrowTop}, title=${state.titleTop}, navbar=${state.headerBottom}`
  )
}

async function assertVocabularyToolbarPinned(page, label) {
  await page.waitForFunction(() => document.documentElement.scrollHeight > window.innerHeight + 1200)
  await page.evaluate(() => window.scrollTo({ top: 900, behavior: "instant" }))
  await page.waitForFunction(() => window.scrollY >= 899)

  const state = await page.evaluate(() => {
    const header = document.querySelector(".paper-nav")
    const toolbar = document.querySelector('section[aria-label="词汇筛选"]')
    if (!header || !toolbar) return null

    return {
      headerBottom: header.getBoundingClientRect().bottom,
      toolbarTop: toolbar.getBoundingClientRect().top,
    }
  })

  assert.ok(state, `${label} should render a vocabulary toolbar and navbar`)
  assert.ok(
    state.toolbarTop >= state.headerBottom - 1 && state.toolbarTop <= state.headerBottom + 12,
    `${label} vocabulary toolbar should stay pinned below the navbar: toolbar=${state.toolbarTop}, navbar=${state.headerBottom}`
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
    await assertActiveNavLinkVisible(mobilePage, "mobile quiz")
    assert.ok(
      await mobilePage.getByText("可能形、使役形").isVisible(),
      "mobile quiz should advertise potential and causative verb forms"
    )
    await mobilePage.goto(`${baseUrl}/review`, { waitUntil: "networkidle" })
    await mobilePage.getByTestId("review-today-empty").waitFor({ state: "visible" })
    await assertActiveNavLinkVisible(mobilePage, "mobile review")
    await mobilePage.goto(`${baseUrl}/grammar`, { waitUntil: "networkidle" })
    await mobilePage.getByTestId("grammar-point-n5-wa").waitFor({ state: "visible" })
    await assertActiveNavLinkVisible(mobilePage, "mobile grammar")
    await assertNoHorizontalOverflow(mobilePage, "mobile grammar route")
    await mobilePage.goto(`${baseUrl}/semantics/s-shiru-wakaru`, { waitUntil: "networkidle" })
    await mobilePage.getByText("Know (Data)").first().waitFor({ state: "visible" })
    await assertActiveNavLinkVisible(mobilePage, "mobile semantics detail")
    await assertNoHorizontalOverflow(mobilePage, "mobile semantics detail route")

    await mobilePage.goto(`${baseUrl}/vocabulary`, { waitUntil: "networkidle" })
    await mobilePage.getByTestId("vocabulary-search").waitFor({ state: "visible" })
    await assertVocabularyToolbarPinned(mobilePage, "mobile vocabulary")

    await mobilePage.setViewportSize({ width: 320, height: 300 })
    await mobilePage.goto(baseUrl, { waitUntil: "networkidle" })
    await mobilePage.locator("#home-cover-title").waitFor({ state: "visible" })
    await assertCoverCopyBelowNavbar(mobilePage, "short mobile home cover")

    await mobilePage.setViewportSize({ width: 280, height: 500 })
    await mobilePage.goto(`${baseUrl}/path`, { waitUntil: "networkidle" })
    await mobilePage.getByTestId("path-next-learning").waitFor({ state: "visible" })
    await mobilePage.getByRole("heading", { name: "一页一课，循序展卷" }).waitFor({ state: "visible" })
    await assertNoHorizontalOverflow(mobilePage, "narrow path route")
    await mobilePage.goto(`${baseUrl}/semantics`, { waitUntil: "networkidle" })
    await mobilePage.getByRole("heading", { name: /语义辨析/ }).waitFor({ state: "visible" })
    await mobilePage.locator(".paper-slip").first().waitFor({ state: "visible" })
    await assertNoHorizontalOverflow(mobilePage, "narrow semantics route")

    await mobilePage.setViewportSize({ width: 280, height: 300 })
    await mobilePage.goto(`${baseUrl}/grammar`, { waitUntil: "networkidle" })
    const narrowGrammarCard = mobilePage.getByTestId("grammar-point-n5-wa")
    await narrowGrammarCard.waitFor({ state: "visible" })
    await narrowGrammarCard.click()
    await mobilePage.getByRole("dialog").waitFor({ state: "visible" })
    await assertNoHorizontalOverflow(mobilePage, "short grammar modal")
    await mobilePage.keyboard.press("Escape")
    await mobilePage.getByRole("dialog").waitFor({ state: "hidden" })

    await mobilePage.goto(`${baseUrl}/vocabulary`, { waitUntil: "networkidle" })
    const narrowVocabularyExpand = mobilePage.locator('[data-testid^="vocabulary-expand-"]').first()
    await narrowVocabularyExpand.waitFor({ state: "visible" })
    await narrowVocabularyExpand.click()
    await mobilePage.getByRole("dialog").waitFor({ state: "visible" })
    await assertNoHorizontalOverflow(mobilePage, "short vocabulary modal")
    await mobilePage.keyboard.press("Escape")
    await mobilePage.getByRole("dialog").waitFor({ state: "hidden" })

    const narrowVocabularyCategory = mobilePage.getByRole("button", { name: "食物 (Food)", exact: true })
    await narrowVocabularyCategory.click()
    await mobilePage.waitForFunction(() => {
      const section = document.getElementById("cat-food")
      const header = document.querySelector(".paper-nav")
      if (!section || !header) return false
      const sectionTop = section.getBoundingClientRect().top
      const headerBottom = header.getBoundingClientRect().bottom
      return sectionTop >= headerBottom - 1 && sectionTop <= headerBottom + 32
    })
  } finally {
    await mobileContext.close()
  }
}
