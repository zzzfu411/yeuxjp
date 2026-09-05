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
  // On detail routes the open modal intentionally isolates the background.
  if (await page.getByRole("dialog").count()) return
  await page.getByRole("button", { name: "打开导航菜单" }).click()
  const navigation = page.getByRole("navigation", { name: "移动导航" })
  await navigation.locator('a[aria-current="page"]').waitFor({ state: "visible" })
  assert.ok(await navigation.locator('a[aria-current="page"]').isVisible(), label + " should show the current page in the menu")
  await page.keyboard.press("Escape")
  await page.getByRole("dialog").waitFor({ state: "hidden" })
}

async function assertCoverCopyBelowNavbar(page, label) {
  const state = await page.evaluate(() => {
    const header = document.querySelector(".paper-nav")
    const eyebrow = document.querySelector(".vn-scene-intro")
    const title = document.querySelector("#home-cover-title")
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
  await page.locator(".vocab-flashcard").first().waitFor({ state: "visible" })
  const cards = await page.locator(".vocab-flashcard").count()
  assert.ok(cards > 0 && cards <= 24, label + " should mount at most one page of vocabulary")
  assert.ok(await page.locator("*").count() < 3500, label + " DOM should remain bounded")
  await page.evaluate(() => window.scrollTo({ top: 900, behavior: "instant" }))
  const toolbar = page.locator('section[aria-label="词汇筛选"]')
  assert.equal(await toolbar.evaluate(el => getComputedStyle(el).position), "static", "Mobile filters should scroll away so the cards keep the screen")
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

    assert.equal(await mobilePage.getByTestId("nav-start-learning").isVisible(), false)
    await mobilePage.getByRole("button", { name: "打开导航菜单" }).click()
    await mobilePage.getByRole("navigation", { name: "移动导航" }).getByRole("link", { name: "学习路径" }).click()
    await mobilePage.waitForURL(/\/path$/)
    await mobilePage.getByTestId("path-next-learning").waitFor({ state: "visible" })
    assert.ok(await mobilePage.getByText("已完成课程", { exact: true }).isVisible(), "mobile path should show course progress")
    assert.ok(await mobilePage.getByText("入门词汇", { exact: true }).isVisible(), "mobile path should show starter vocabulary progress")
    await assertNoHorizontalOverflow(mobilePage, "mobile path route after header CTA")

    await mobilePage.getByTestId("speech-controls-open").click()
    await mobilePage.getByRole("dialog").waitFor({ state: "visible" })
    const speechDialogStacking = await mobilePage.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"][aria-modal="true"]')
      const overlay = dialog?.parentElement
      const nav = document.querySelector(".paper-nav")
      const labelledBy = dialog?.getAttribute("aria-labelledby")
      return {
        name: labelledBy ? document.getElementById(labelledBy)?.textContent?.trim() ?? "" : "",
        dialogInNav: Boolean(nav && dialog && nav.contains(dialog)),
        overlayParentIsBody: overlay?.parentElement === document.body,
        overlayZ: overlay ? Number(getComputedStyle(overlay).zIndex) : NaN,
        navZ: nav ? Number(getComputedStyle(nav).zIndex) : NaN,
      }
    })
    const speechDialogName = speechDialogStacking.name
    assert.ok(speechDialogName.length > 0, "mobile speech settings dialog should have an accessible name")
    assert.equal(speechDialogStacking.dialogInNav, false, "speech settings dialog should escape the navbar stacking context")
    assert.equal(speechDialogStacking.overlayParentIsBody, true, "speech settings overlay should portal to document.body")
    assert.ok(
      speechDialogStacking.overlayZ > speechDialogStacking.navZ,
      `speech settings overlay should stack above navigation: overlay=${speechDialogStacking.overlayZ}, nav=${speechDialogStacking.navZ}`
    )
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

    // A short modal scrolls the focused toggle into view before the stroke
    // animation mounts. The animation surface should remain discoverable after
    // that click rather than being left above the modal viewport.
    await mobilePage.setViewportSize({ width: 280, height: 300 })
    await mobilePage.goto(`${baseUrl}/kana`, { waitUntil: "networkidle" })
    await mobilePage.getByTestId("kana-card-a").click()
    await mobilePage.getByRole("dialog").waitFor({ state: "visible" })
    await mobilePage.getByTestId("kana-stroke-toggle").waitFor({ state: "visible" })
    await mobilePage.getByTestId("kana-stroke-toggle").click()
    await mobilePage.getByTestId("kana-stroke-progress").waitFor({ state: "visible" })
    await mobilePage.waitForFunction(() => {
      const scroller = document.querySelector('[role="dialog"] .overflow-y-auto')
      const surface = document.querySelector('[role="dialog"] .kana-animcjk-wrapper')
      if (!scroller || !surface) return false

      const scrollerRect = scroller.getBoundingClientRect()
      const surfaceRect = surface.getBoundingClientRect()
      return scroller.scrollTop <= 1 &&
        surfaceRect.bottom > scrollerRect.top &&
        surfaceRect.top < scrollerRect.bottom
    })
    await mobilePage.keyboard.press("Escape")
    await mobilePage.getByRole("dialog").waitFor({ state: "hidden" })
    await mobilePage.setViewportSize({ width: 390, height: 844 })

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
    await mobilePage.getByRole("heading", { name: "每天一课，循序学习" }).waitFor({ state: "visible" })
    await assertNoHorizontalOverflow(mobilePage, "narrow path route")
    await mobilePage.goto(`${baseUrl}/semantics`, { waitUntil: "networkidle" })
    await mobilePage.getByRole("heading", { name: /语义辨析/ }).waitFor({ state: "visible" })
    await mobilePage.locator('a[href="/semantics/s-shiru-wakaru"]').waitFor({ state: "visible" })
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
    await mobilePage.locator("#cat-food").waitFor({ state: "visible" })
    assert.ok(await mobilePage.locator(".vocab-flashcard").count() <= 24)
    assert.ok(mobilePage.url().includes("category=food"), "category selection should survive reload")

  } finally {
    await mobileContext.close()
  }
}
