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
const seionRomaji = [
  "a",
  "i",
  "u",
  "e",
  "o",
  "ka",
  "ki",
  "ku",
  "ke",
  "ko",
  "sa",
  "shi",
  "su",
  "se",
  "so",
  "ta",
  "chi",
  "tsu",
  "te",
  "to",
  "na",
  "ni",
  "nu",
  "ne",
  "no",
  "ha",
  "hi",
  "fu",
  "he",
  "ho",
  "ma",
  "mi",
  "mu",
  "me",
  "mo",
  "ya",
  "yu",
  "yo",
  "ra",
  "ri",
  "ru",
  "re",
  "ro",
  "wa",
  "wo",
  "n",
]

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

async function seedLearningDataBackupState(page) {
  await page.goto(baseUrl, { waitUntil: "networkidle" })
  await page.evaluate(() => {
    const now = Date.now()
    localStorage.clear()
    localStorage.setItem("yasashi.e2e.unmanaged", "keep")
    localStorage.setItem(
      "yasashi.learning.profile.v1",
      JSON.stringify({ goal: "balanced", dailyMinutes: 15, startedAt: now - 1000, updatedAt: now })
    )
    localStorage.setItem(
      "yasashi.mistakes.v1",
      JSON.stringify([
        {
          id: "kana:a:hiragana-romaji",
          type: "hiragana-romaji",
          prompt: "あ",
          correctAnswer: "a",
          wrongAnswer: "i",
          options: [
            { id: "a", text: "a" },
            { id: "i", text: "i" },
          ],
          wrongCount: 1,
          createdAt: now - 1000,
          lastWrongAt: now,
          meta: { itemId: "a", itemType: "kana" },
        },
      ])
    )
    localStorage.setItem(
      "yasashi.srs.mistakes.v1",
      JSON.stringify({
        "kana:a:hiragana-romaji": { box: 1, dueAt: now - 1, createdAt: now - 1000, right: 0, wrong: 1 },
      })
    )
  })
}

let browser = null
let context = null
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
  context = await browser.newContext({ acceptDownloads: true, viewport: { width: 1280, height: 900 } })
  const page = await context.newPage()

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
  await page.getByTestId("lesson-next").click()
  await page.getByTestId("lesson-answer-お").waitFor({ state: "visible" })
  await page.getByTestId("lesson-answer-お").click()
  await page.getByTestId("lesson-next").click()
  await page.getByTestId("lesson-typing-input").fill("こんにちは")
  await page.getByTestId("lesson-submit-typing").click()
  await page.getByTestId("lesson-next").click()
  await page.getByTestId("lesson-next").click()
  await page.getByTestId("lesson-completed-summary").waitFor({ state: "visible" })
  const completedLessonProgress = await readJsonStorage(page, "yasashi.learning.lessons.v1")
  assert.equal(
    completedLessonProgress?.["day-1-a-row-hello"]?.status,
    "completed",
    "finishing the first lesson should mark it completed"
  )
  assert.ok(await page.getByTestId("lesson-review-link").isVisible(), "completed lesson should recommend review")
  assert.equal(
    await page.getByTestId("lesson-next-lesson-link").getAttribute("href"),
    "/learn/day-2-ka-row-thanks",
    "completed first lesson should link to the next starter lesson"
  )

  await page.evaluate(() => localStorage.clear())
  await page.goto(`${baseUrl}/learn/day-2-ka-row-thanks`, { waitUntil: "networkidle" })
  await page.getByTestId("lesson-locked-preview").waitFor({ state: "visible" })
  await page.getByTestId("lesson-next").click()
  await page.getByTestId("lesson-answer-ka").waitFor({ state: "visible" })
  assert.ok(await page.getByTestId("lesson-answer-ka").isDisabled(), "locked lesson preview should disable practice answers")
  assert.equal(
    await page.evaluate(() => localStorage.getItem("yasashi.learning.lessons.v1")),
    null,
    "locked lesson preview should not start lesson progress"
  )
  assert.equal(
    await page.evaluate(() => localStorage.getItem("yasashi.learning.practice.v1")),
    null,
    "locked lesson preview should not record practice history"
  )
  assert.equal(
    await page.evaluate(() => localStorage.getItem("yasashi.srs.kana.v1")),
    null,
    "locked lesson preview should not enroll SRS"
  )

  await page.goto(`${baseUrl}/review`, { waitUntil: "networkidle" })
  await page.getByTestId("review-empty-state").waitFor({ state: "visible" })
  await page.getByTestId("review-today-empty").waitFor({ state: "visible" })

  await page.goto(`${baseUrl}/kana`, { waitUntil: "networkidle" })
  await page.getByTestId("kana-card-a").click()
  await page.getByTestId("kana-stroke-toggle").click()
  assert.ok(await page.getByLabel(/Stroke order|笔顺/).isVisible())

  await page.goto(`${baseUrl}/vocabulary`, { waitUntil: "networkidle" })
  await page.getByTestId("vocabulary-search").fill("みせ")
  assert.ok(await page.getByText("みせ").first().isVisible())
  await page.getByTestId("vocabulary-level-daily").click()
  await page.getByTestId("vocabulary-search").fill("Yakusoku")
  assert.ok(await page.getByText("約束").first().isVisible(), "daily vocabulary level should load its dynamic vocabulary chunk")
  await page.getByTestId("vocabulary-level-fluent").click()
  await page.getByTestId("vocabulary-search").fill("Gainen")
  assert.ok(await page.getByText("概念").first().isVisible(), "fluent vocabulary level should load its dynamic vocabulary chunk")

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
  await page.goto(`${baseUrl}/review`, { waitUntil: "networkidle" })
  await page.getByTestId("recent-mistakes").waitFor({ state: "visible" })
  await page.getByTestId("recent-mistake-kana:a:hiragana-romaji").waitFor({ state: "visible" })
  await page.getByTestId("review-start-mistakes").click()
  await page.getByTestId("mistake-review-session").waitFor({ state: "visible" })

  await page.goto(`${baseUrl}/quiz`, { waitUntil: "networkidle" })
  await page.evaluate((masteredIds) => {
    localStorage.clear()
    localStorage.setItem("yasashi.kana.mastered.v1", JSON.stringify(masteredIds))
  }, seionRomaji)
  await page.getByTestId("quiz-mode-hiragana-romaji").click()
  await page.getByTestId("quiz-only-unmastered-kana").click()
  await page.getByTestId("quiz-empty-state").waitFor({ state: "visible" })

  await seedReviewState(page)
  await page.goto(`${baseUrl}/review`, { waitUntil: "networkidle" })
  await page.getByTestId("review-due-state").waitFor({ state: "visible" })
  await page.getByTestId("review-today-due").waitFor({ state: "visible" })
  await page.getByTestId("review-start-today").click()
  assert.ok(await page.getByTestId("review-remaining").isVisible())

  await seedLearningDataBackupState(page)
  await page.goto(`${baseUrl}/review`, { waitUntil: "networkidle" })
  await page.getByTestId("learning-data-panel").waitFor({ state: "visible" })
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByTestId("learning-data-export").click(),
  ])
  assert.match(download.suggestedFilename(), /^yasashi-learning-backup-\d{4}-\d{2}-\d{2}\.json$/)
  const backupPath = await download.path()
  assert.ok(backupPath, "learning data export should create a downloadable backup file")

  await page.getByTestId("learning-data-reset").click()
  await page.getByTestId("learning-data-reset").click()
  await page.waitForFunction(() =>
    localStorage.getItem("yasashi.learning.profile.v1") === null &&
    localStorage.getItem("yasashi.mistakes.v1") === null &&
    localStorage.getItem("yasashi.srs.mistakes.v1") === null
  )
  assert.equal(
    await page.evaluate(() => localStorage.getItem("yasashi.e2e.unmanaged")),
    "keep",
    "learning data reset should leave unmanaged browser state alone"
  )

  const fileChooserPromise = page.waitForEvent("filechooser")
  await page.getByTestId("learning-data-import").click()
  const fileChooser = await fileChooserPromise
  await fileChooser.setFiles(backupPath)
  await page.waitForFunction(() =>
    localStorage.getItem("yasashi.learning.profile.v1") !== null &&
    localStorage.getItem("yasashi.mistakes.v1") !== null &&
    localStorage.getItem("yasashi.srs.mistakes.v1") !== null
  )
  const restoredProfile = await readJsonStorage(page, "yasashi.learning.profile.v1")
  assert.equal(restoredProfile?.goal, "balanced", "learning data import should restore the profile backup")
  const restoredMistakes = await readJsonStorage(page, "yasashi.mistakes.v1")
  assert.ok(
    Array.isArray(restoredMistakes) && restoredMistakes.some((item) => item.id === "kana:a:hiragana-romaji"),
    "learning data import should restore the mistake notebook backup"
  )
  const restoredMistakeSrs = await readJsonStorage(page, "yasashi.srs.mistakes.v1")
  assert.ok(
    restoredMistakeSrs?.["kana:a:hiragana-romaji"]?.dueAt,
    "learning data import should restore mistake SRS state"
  )
  assert.equal(
    await page.evaluate(() => localStorage.getItem("yasashi.e2e.unmanaged")),
    "keep",
    "learning data import should leave unmanaged browser state alone"
  )

  console.log(`Browser E2E checks passed at ${baseUrl}`)
} catch (error) {
  console.error(serverController.output)
  failure = error
} finally {
  await context?.close()
  await browser?.close()
  serverController.stop()
}

if (failure) {
  console.error(failure)
  process.exit(1)
}
