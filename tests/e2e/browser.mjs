import assert from "node:assert/strict"
import {
  createServerController,
  importPlaywrightOrSkip,
  isE2ERequired,
  readJsonStorage,
  reuseOrStartDevServer,
  skipOptionalPlaywrightRuntimeError,
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
const seionHiraganaToRomaji = {
  あ: "a",
  い: "i",
  う: "u",
  え: "e",
  お: "o",
  か: "ka",
  き: "ki",
  く: "ku",
  け: "ke",
  こ: "ko",
  さ: "sa",
  し: "shi",
  す: "su",
  せ: "se",
  そ: "so",
  た: "ta",
  ち: "chi",
  つ: "tsu",
  て: "te",
  と: "to",
  な: "na",
  に: "ni",
  ぬ: "nu",
  ね: "ne",
  の: "no",
  は: "ha",
  ひ: "hi",
  ふ: "fu",
  へ: "he",
  ほ: "ho",
  ま: "ma",
  み: "mi",
  む: "mu",
  め: "me",
  も: "mo",
  や: "ya",
  ゆ: "yu",
  よ: "yo",
  ら: "ra",
  り: "ri",
  る: "ru",
  れ: "re",
  ろ: "ro",
  わ: "wa",
  を: "wo",
  ん: "n",
}

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
let mobileContext = null
let failure = null

try {
  const { chromium } = await importPlaywrightOrSkip({
    required: browserE2ERequired,
    label: "Browser E2E",
    skipMessage: "Browser E2E skipped: Playwright is not installed. Run `npm ci --prefix web`, then `npm run e2e:install --prefix web` before the required browser E2E.",
    errorMessage: "Browser E2E requires Playwright. Run `npm ci --prefix web`, then `npm run e2e:install --prefix web`, or set E2E_BASE_URL and run in an environment with Playwright available.",
  })
  await ensureServer()
  browser = await chromium.launch({ headless: true })
  context = await browser.newContext({ acceptDownloads: true, viewport: { width: 1280, height: 900 } })
  const page = await context.newPage()

  await page.goto(baseUrl, { waitUntil: "networkidle" })
  await assert.doesNotReject(() => page.getByTestId("home-start-learning").click())
  await page.waitForURL(/\/learn\//)
  await page.getByTestId("lesson-next").click()
  await page.waitForFunction(() => {
    const progress = JSON.parse(localStorage.getItem("yasashi.learning.lessons.v1") ?? "{}")
    return progress?.["day-1-a-row-hello"]?.lastStepId === "hello-example"
  })
  const lessonProgress = await readJsonStorage(page, "yasashi.learning.lessons.v1")
  assert.equal(
    lessonProgress?.["day-1-a-row-hello"]?.currentStepIndex,
    1,
    "lesson navigation should persist the current step index"
  )
  assert.equal(
    lessonProgress?.["day-1-a-row-hello"]?.lastStepId,
    "hello-example",
    "lesson navigation should persist the current step id"
  )
  await page.reload({ waitUntil: "networkidle" })
  await page.getByTestId("lesson-next").click()
  await page.waitForFunction(() => {
    const progress = JSON.parse(localStorage.getItem("yasashi.learning.lessons.v1") ?? "{}")
    return progress?.["day-1-a-row-hello"]?.lastStepId === "recognize-a"
  })
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
  await page.getByTestId("kana-stroke-board").waitFor({ state: "visible" })
  await page.getByTestId("kana-mastery-toggle").click()
  await page.waitForFunction(() => {
    const mastered = JSON.parse(localStorage.getItem("yasashi.kana.mastered.v1") ?? "[]")
    const srs = JSON.parse(localStorage.getItem("yasashi.srs.kana.v1") ?? "{}")
    return Array.isArray(mastered) && mastered.includes("a") && !!srs?.a?.dueAt
  })
  const masteredKana = await readJsonStorage(page, "yasashi.kana.mastered.v1")
  assert.ok(Array.isArray(masteredKana) && masteredKana.includes("a"), "kana mastery toggle should persist kana a")
  const masteredKanaSrs = await readJsonStorage(page, "yasashi.srs.kana.v1")
  assert.ok(masteredKanaSrs?.a?.dueAt, "kana mastery toggle should enroll kana a for SRS review")

  await page.goto(`${baseUrl}/vocabulary`, { waitUntil: "networkidle" })
  await page.getByTestId("vocabulary-search").fill("みせ")
  await page.getByText("みせ").first().waitFor({ state: "visible" })
  await page.getByTestId("vocabulary-expand-sur-n-35").click()
  await page.getByTestId("vocabulary-focus-card").click()
  await page.getByTestId("vocabulary-learned-toggle").click()
  await page.waitForFunction(() => {
    const learned = JSON.parse(localStorage.getItem("yasashi.vocab.learned.v1") ?? "[]")
    const srs = JSON.parse(localStorage.getItem("yasashi.srs.vocab.v1") ?? "{}")
    return Array.isArray(learned) && learned.includes("sur-n-35") && !!srs?.["sur-n-35"]?.dueAt
  })
  const learnedVocab = await readJsonStorage(page, "yasashi.vocab.learned.v1")
  assert.ok(Array.isArray(learnedVocab) && learnedVocab.includes("sur-n-35"), "vocabulary learned toggle should persist the selected vocabulary id")
  const vocabSrs = await readJsonStorage(page, "yasashi.srs.vocab.v1")
  assert.ok(vocabSrs?.["sur-n-35"]?.dueAt, "vocabulary learned toggle should enroll the selected vocabulary for SRS review")
  await page.goto(`${baseUrl}/vocabulary`, { waitUntil: "networkidle" })
  await page.getByTestId("vocabulary-level-daily").click()
  await page.getByTestId("vocabulary-search").fill("Yakusoku")
  await page.getByText("約束").first().waitFor({ state: "visible" })
  await page.getByTestId("vocabulary-level-fluent").click()
  await page.getByTestId("vocabulary-search").fill("Gainen")
  await page.getByText("概念").first().waitFor({ state: "visible" })

  await page.goto(`${baseUrl}/quiz`, { waitUntil: "networkidle" })
  await page.getByTestId("quiz-mode-hiragana-romaji").click()
  await page.getByTestId("quiz-question-text").waitFor({ state: "visible" })
  assert.ok(await page.getByText(/得分:/).isVisible())
  const quizPrompt = (await page.getByTestId("quiz-question-text").innerText()).trim()
  const expectedAnswer = seionHiraganaToRomaji[quizPrompt]
  assert.ok(expectedAnswer, `quiz prompt should be a known seion kana, got ${quizPrompt}`)
  const wrongOption = await page.evaluate((correctAnswer) => {
    const option = Array.from(document.querySelectorAll('[data-testid^="quiz-answer-option-"]'))
      .find((button) => button.textContent?.trim() !== correctAnswer)
    return option?.getAttribute("data-testid")
  }, expectedAnswer)
  assert.ok(wrongOption, "hiragana quiz should expose at least one wrong answer option")
  await page.getByTestId(wrongOption).click()
  await page.waitForFunction(() => {
    const mistakes = JSON.parse(localStorage.getItem("yasashi.mistakes.v1") ?? "[]")
    return Array.isArray(mistakes) && mistakes.length > 0
  })
  const mistakes = await readJsonStorage(page, "yasashi.mistakes.v1")
  assert.ok(Array.isArray(mistakes), "wrong quiz answer should write mistake notebook")
  const recordedQuizMistake = mistakes.find((item) =>
    item.type === "hiragana-romaji" &&
    item.questionText === quizPrompt &&
    item.correctAnswer === expectedAnswer &&
    item.wrongCount >= 1
  )
  assert.ok(recordedQuizMistake, "wrong quiz answer should record the current kana prompt in mistakes")
  await page.goto(`${baseUrl}/review`, { waitUntil: "networkidle" })
  await page.getByTestId("recent-mistakes").waitFor({ state: "visible" })
  await page.getByTestId(`recent-mistake-${recordedQuizMistake.id}`).waitFor({ state: "visible" })
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
  await page.getByTestId("review-answer-a").click()
  await page.waitForFunction(() => {
    const srs = JSON.parse(localStorage.getItem("yasashi.srs.kana.v1") ?? "{}")
    const practice = JSON.parse(localStorage.getItem("yasashi.learning.practice.v1") ?? "[]")
    return srs?.a?.box > 1 &&
      srs?.a?.right >= 1 &&
      srs?.a?.dueAt > Date.now() &&
      Array.isArray(practice) &&
      practice.some((item) =>
        item.itemId === "a" &&
        item.itemType === "kana" &&
        item.mode === "recognition" &&
        item.correct === true
      )
  })
  const reviewedKanaSrs = await readJsonStorage(page, "yasashi.srs.kana.v1")
  assert.ok(reviewedKanaSrs?.a?.box > 1, "correct review answer should advance kana SRS box")
  assert.ok(reviewedKanaSrs?.a?.right >= 1, "correct review answer should increment SRS right count")
  const reviewPractice = await readJsonStorage(page, "yasashi.learning.practice.v1")
  assert.ok(
    Array.isArray(reviewPractice) &&
      reviewPractice.some((item) =>
        item.itemId === "a" &&
        item.itemType === "kana" &&
        item.mode === "recognition" &&
        item.correct === true
      ),
    "correct review answer should write practice history"
  )

  await seedLearningDataBackupState(page)
  await page.goto(`${baseUrl}/review`, { waitUntil: "networkidle" })
  await page.getByTestId("learning-data-panel").waitFor({ state: "visible" })
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByTestId("learning-data-export").click(),
  ])
  assert.match(download.suggestedFilename(), /^yasashi-learning-backup-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}\.json$/)
  const backupPath = await download.path()
  assert.ok(backupPath, "learning data export should create a downloadable backup file")

  const invalidFileChooserPromise = page.waitForEvent("filechooser")
  await page.getByTestId("learning-data-import").click()
  const invalidFileChooser = await invalidFileChooserPromise
  await invalidFileChooser.setFiles({
    name: "invalid-yasashi-backup.json",
    mimeType: "application/json",
    buffer: Buffer.from("{not-valid-json"),
  })
  await page.waitForFunction(() =>
    document.querySelector('[data-testid="learning-data-notice"]')?.getAttribute("data-tone") === "error"
  )
  assert.equal(await page.getByTestId("learning-data-notice").getAttribute("data-tone"), "error")
  assert.equal(
    (await readJsonStorage(page, "yasashi.learning.profile.v1"))?.goal,
    "balanced",
    "invalid learning data import should not overwrite the current profile"
  )
  assert.ok(
    (await readJsonStorage(page, "yasashi.mistakes.v1"))?.some((item) => item.id === "kana:a:hiragana-romaji"),
    "invalid learning data import should not overwrite the mistake notebook"
  )
  assert.ok(
    (await readJsonStorage(page, "yasashi.srs.mistakes.v1"))?.["kana:a:hiragana-romaji"]?.dueAt,
    "invalid learning data import should not overwrite mistake SRS state"
  )

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

  mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  })
  const mobilePage = await mobileContext.newPage()
  await mobilePage.goto(baseUrl, { waitUntil: "networkidle" })
  await mobilePage.getByTestId("home-start-learning").waitFor({ state: "visible" })
  await mobilePage.goto(`${baseUrl}/kana`, { waitUntil: "networkidle" })
  await mobilePage.getByTestId("kana-card-a").waitFor({ state: "visible" })
  await mobilePage.goto(`${baseUrl}/quiz`, { waitUntil: "networkidle" })
  await mobilePage.getByTestId("quiz-mode-hiragana-romaji").waitFor({ state: "visible" })
  await mobilePage.goto(`${baseUrl}/review`, { waitUntil: "networkidle" })
  await mobilePage.getByTestId("review-today-empty").waitFor({ state: "visible" })

  console.log(`Browser E2E checks passed at ${baseUrl}`)
} catch (error) {
  if (
    skipOptionalPlaywrightRuntimeError({
      error,
      required: browserE2ERequired,
      skipMessage:
        "Browser E2E skipped: Playwright browser binaries are not installed. Run `npm run e2e:install --prefix web` or use `npm run e2e:browser:required --prefix web` in a provisioned environment.",
    })
  ) {
    failure = null
  } else {
    console.error(serverController.output)
    failure = error
  }
} finally {
  await mobileContext?.close()
  await context?.close()
  await browser?.close()
  serverController.stop()
}

if (failure) {
  console.error(failure)
  process.exit(1)
} else {
  process.exit(0)
}
