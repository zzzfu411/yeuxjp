import assert from "node:assert/strict"
import {
  createServerController,
  importPlaywrightOrSkip,
  isE2ERequired,
  readJsonStorage,
  reuseOrStartDevServer,
} from "./harness.mjs"

const port = Number(process.env.E2E_PORT ?? 3210)
let baseUrl = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${port}`
const browserE2ERequired = isE2ERequired("E2E_BROWSER_REQUIRED")
const serverController = createServerController()

async function ensureServer() {
  baseUrl = await reuseOrStartDevServer({
    baseUrl,
    port,
    controller: serverController,
  })
}

async function seedReviewState(page) {
  await page.goto(baseUrl, { waitUntil: "networkidle" })
  await page.evaluate(() => {
    const now = Date.now()
    localStorage.setItem(
      "yasashi.srs.kana.v1",
      JSON.stringify({ a: { box: 1, dueAt: now - 1, createdAt: now - 1000, right: 0, wrong: 0 } })
    )
  })
}

let browser = null
let failure = null

try {
  const { chromium } = await importPlaywrightOrSkip({
    required: browserE2ERequired,
    label: "Browser E2E",
    skipMessage: "Browser E2E skipped: Playwright is not installed. Run `npm run e2e:browser:required --prefix web` when browser dependencies are available.",
    errorMessage: "Browser E2E requires Playwright. Install browser dependencies or set E2E_BASE_URL and run in an environment with Playwright available.",
  })
  await ensureServer()
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

  await page.goto(baseUrl, { waitUntil: "networkidle" })
  await assert.doesNotReject(() => page.getByTestId("home-start-learning").click())
  await page.waitForURL(/\/learn\//)
  await page.getByTestId("lesson-next").click()
  const lessonProgress = await readJsonStorage(page, "yasashi.learning.lessons.v1")
  assert.equal(
    lessonProgress?.["day-1-a-row-hello"]?.currentStepIndex,
    1,
    "lesson navigation should persist the current step index"
  )
  assert.equal(
    lessonProgress?.["day-1-a-row-hello"]?.lastStepId,
    "recognize-a",
    "lesson navigation should persist the current step id"
  )
  await page.reload({ waitUntil: "networkidle" })
  await page.getByTestId("lesson-answer-a").waitFor({ state: "visible" })
  await page.getByTestId("lesson-answer-a").click()
  assert.ok(await page.getByTestId("lesson-next").isEnabled())

  const lessonPractice = await readJsonStorage(page, "yasashi.learning.practice.v1")
  assert.ok(Array.isArray(lessonPractice), "lesson answer should write practice history")
  assert.ok(
    lessonPractice.some((item) =>
      item.lessonId === "day-1-a-row-hello" &&
      item.itemId === "a" &&
      item.itemType === "kana" &&
      item.mode === "recognition" &&
      item.correct === true
    ),
    "lesson answer should record the kana recognition result"
  )
  const itemProgress = await readJsonStorage(page, "yasashi.learning.items.v1")
  assert.equal(itemProgress?.a?.itemType, "kana", "lesson answer should update item progress")
  assert.equal(itemProgress?.a?.attempts, 1, "lesson answer should increment item attempts")
  assert.equal(itemProgress?.a?.correct, 1, "lesson answer should increment correct count")
  const kanaSrs = await readJsonStorage(page, "yasashi.srs.kana.v1")
  assert.ok(kanaSrs?.a?.dueAt, "correct kana lesson answer should enroll SRS")

  await page.goto(`${baseUrl}/kana`, { waitUntil: "networkidle" })
  await page.getByTestId("kana-card-a").click()
  await page.getByTestId("kana-stroke-toggle").click()
  assert.ok(await page.getByLabel(/Stroke order|笔顺/).isVisible())

  await page.goto(`${baseUrl}/vocabulary`, { waitUntil: "networkidle" })
  await page.getByTestId("vocabulary-search").fill("みせ")
  assert.ok(await page.getByText("みせ").first().isVisible())

  await page.goto(`${baseUrl}/quiz`, { waitUntil: "networkidle" })
  await page.evaluate(() => {
    Math.random = () => 0
  })
  await page.getByTestId("quiz-mode-hiragana-romaji").click()
  await page.waitForSelector("button")
  assert.ok(await page.getByText(/得分:/).isVisible())
  assert.ok(await page.getByText("あ").isVisible(), "fixed quiz random source should ask kana a")
  await page.getByTestId("quiz-answer-option-0").click()
  const mistakes = await readJsonStorage(page, "yasashi.mistakes.v1")
  assert.ok(Array.isArray(mistakes), "wrong quiz answer should write mistake notebook")
  assert.ok(
    mistakes.some((item) =>
      item.id === "kana:a:hiragana-romaji" &&
      item.type === "hiragana-romaji" &&
      item.correctAnswer === "a" &&
      item.wrongCount >= 1
    ),
    "wrong quiz answer should record kana a in mistakes"
  )

  await seedReviewState(page)
  await page.goto(`${baseUrl}/review`, { waitUntil: "networkidle" })
  await page.getByTestId("review-start-today").click()
  assert.ok(await page.getByTestId("review-remaining").isVisible())

  console.log(`Browser E2E checks passed at ${baseUrl}`)
} catch (error) {
  console.error(serverController.output)
  failure = error
} finally {
  await browser?.close()
  serverController.stop()
}

if (failure) {
  console.error(failure)
  process.exit(1)
}
