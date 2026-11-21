import assert from "node:assert/strict"
import { chromium } from "playwright"
const base = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3218"
const browser = await chromium.launch({ headless: true })
try {
  const page = await browser.newPage({ serviceWorkers: "block", viewport: { width: 390, height: 844 } })
  const errors = []
  page.on("pageerror", error => errors.push(error.message))
  await page.goto(base, { waitUntil: "networkidle" })
  const mainHref = await page.getByTestId("home-start-learning").getAttribute("href")
  const firstTasks = new Set()
  for (const goal of ["travel", "media", "jlpt", "balanced"]) {
    await page.getByTestId("home-edit-profile").click()
    await page.getByTestId(`onboarding-goal-${goal}`).click()
    if (goal === "jlpt") {
      await page.getByRole("combobox", { name: "目标等级", exact: true }).selectOption("N2")
      await page.getByRole("combobox", { name: "当前基础（自评）", exact: true }).selectOption("N3")
    }
    await page.getByTestId("onboarding-save").click()
    await page.getByRole("dialog").waitFor({ state: "hidden" })
    const section = page.getByTestId("goal-practice")
    await section.locator(`[data-goal-task^="${goal}-"]`).first().waitFor()
    const tasks = await section.locator("[data-goal-task]").evaluateAll(nodes => nodes.map(node => node.dataset.goalTask))
    assert.equal(tasks.length, 3)
    firstTasks.add(tasks[0])
    assert.equal(await page.getByTestId("home-start-learning").getAttribute("href"), mainHref)
    if (goal === "jlpt") {
      assert.match(await section.innerText(), /JLPT N2 准备/)
      assert.match(await section.innerText(), /自评 N3/)
      assert.match(await section.locator("a").first().getAttribute("href"), /^\/practice\/jlpt-/)
    }
    const links = await section.locator("a").evaluateAll(nodes => nodes.map(node => node.getAttribute("href")))
    for (const href of links) assert.equal((await page.request.get(`${base}${href}`)).status(), 200, href)
    await section.locator("a").first().click()
    await page.waitForLoadState("networkidle")
    assert.ok(await page.locator("h1").count())
    await page.getByTestId("written-work").waitFor()
    if (goal === "jlpt") assert.ok(await page.locator('a[href*="level=N3"]').count())
    await page.goto(`${base}/path`, { waitUntil: "networkidle" })
    assert.deepEqual(await page.getByTestId("goal-practice").locator("[data-goal-task]").evaluateAll(nodes => nodes.map(node => node.dataset.goalTask)), tasks)
    await page.goto(base, { waitUntil: "networkidle" })
    assert.equal(await page.getByTestId("goal-practice").locator("[data-goal-task]").first().getAttribute("data-goal-task"), tasks[0])
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false)
  }
  assert.equal(firstTasks.size, 4)
  await page.getByTestId("home-edit-profile").click()
  await page.getByTestId("onboarding-goal-media").click()
  await page.getByTestId("onboarding-save").click()
  await page.getByRole("dialog").waitFor({ state: "hidden" })
  const mediaTasks = new Set()
  for (const level of ["N5", "N4", "N3", "N2"]) {
    await page.getByRole("group", { name: "动漫情境难度" }).getByRole("button", { name: level, exact: true }).click()
    assert.match(await page.getByTestId("goal-practice").innerText(), new RegExp(`动漫理解 · ${level}`))
    const links = await page.getByTestId("goal-practice").locator("a").evaluateAll(nodes => nodes.map(node => node.getAttribute("href")))
    assert.equal(links.length, 3)
    for (const href of links) { mediaTasks.add(href); assert.equal((await page.request.get(`${base}${href}`)).status(), 200, href) }
    assert.equal(await page.getByTestId("home-start-learning").getAttribute("href"), mainHref)
  }
  assert.equal(mediaTasks.size, 12)
  await page.getByTestId("home-edit-profile").click()
  await page.getByTestId("onboarding-goal-jlpt").click()
  assert.equal(await page.getByRole("combobox", { name: "目标等级", exact: true }).inputValue(), "N2")
  assert.equal(await page.getByRole("combobox", { name: "当前基础（自评）", exact: true }).inputValue(), "N3")
  assert.deepEqual(errors, [])
  console.log("Goal practice passed: four distinct plans, real resource navigation, target/base persistence, consistent home/path and unchanged main course.")
} finally { await browser.close() }
