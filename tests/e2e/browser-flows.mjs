import assert from "node:assert/strict"
import fs from "node:fs/promises"

import { readJsonStorage } from "./harness.mjs"
import {
  assertManagedLearningSnapshot,
  assertQuizModeRecordsPractice,
  managedLearningBackupKeys,
  openQuizMode,
  readManagedLearningBackupSnapshot,
  seedDueMistakeReviewState,
  seedLearningDataBackupState,
  seedReviewState,
  seionHiraganaToRomaji,
  seionRomaji,
} from "./browser-fixtures.mjs"

export async function verifyLessonFlow(page, baseUrl) {
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
  await page.goto(baseUrl, { waitUntil: "networkidle" })
  assert.equal(
    await page.getByTestId("home-start-learning").getAttribute("href"),
    "/learn/day-2-ka-row-thanks",
    "home start learning should recommend the next unlocked lesson after completing day 1"
  )
  await page.goto(`${baseUrl}/path`, { waitUntil: "networkidle" })
  assert.equal(
    await page.getByTestId("path-next-learning").getAttribute("href"),
    "/learn/day-2-ka-row-thanks",
    "path next step should recommend the next unlocked lesson after completing day 1"
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
}

export async function verifyInitialReviewEmptyState(page, baseUrl) {
  await page.goto(`${baseUrl}/review`, { waitUntil: "networkidle" })
  await page.getByTestId("review-empty-state").waitFor({ state: "visible" })
  await page.getByTestId("review-today-empty").waitFor({ state: "visible" })
}

export async function verifyKanaAndVocabularyFlow(page, baseUrl) {
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
}

export async function verifyQuizAndMistakeFlow(page, baseUrl) {
  await openQuizMode(page, baseUrl, "hiragana-romaji")
  await page.getByTestId("quiz-question-text").waitFor({ state: "visible" })
  assert.match(await page.getByTestId("quiz-score").innerText(), /0\/0\b/)
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

  await seedDueMistakeReviewState(page, baseUrl)
  await page.goto(`${baseUrl}/review`, { waitUntil: "networkidle" })
  await page.getByTestId("review-start-mistakes").click()
  await page.getByTestId("mistake-review-session").waitFor({ state: "visible" })
  await page.getByTestId("review-answer-a").click()
  await page.waitForFunction(() => {
    const mistakes = JSON.parse(localStorage.getItem("yasashi.mistakes.v1") ?? "[]")
    const srs = JSON.parse(localStorage.getItem("yasashi.srs.mistakes.v1") ?? "{}")
    const item = Array.isArray(mistakes) ? mistakes.find((mistake) => mistake.id === "e2e-mistake:kana-a") : null
    return item?.wrongCount === 2 && srs?.["e2e-mistake:kana-a"]?.box > 1
  })
  const retainedMistakes = await readJsonStorage(page, "yasashi.mistakes.v1")
  const retainedMistake = Array.isArray(retainedMistakes)
    ? retainedMistakes.find((item) => item.id === "e2e-mistake:kana-a")
    : null
  assert.equal(retainedMistake?.wrongCount, 2, "correct mistake review should retain the historical mistake count")
  const reviewedMistakeSrs = await readJsonStorage(page, "yasashi.srs.mistakes.v1")
  assert.ok(
    reviewedMistakeSrs?.["e2e-mistake:kana-a"]?.box > 1,
    "correct mistake review should advance mistake SRS without deleting notebook history"
  )

  await assertQuizModeRecordsPractice(page, baseUrl, {
    mode: "audio-kana",
    itemType: "kana",
    practiceMode: "listening",
  })
  await assertQuizModeRecordsPractice(page, baseUrl, {
    mode: "particle",
    itemType: "grammar",
    practiceMode: "recognition",
  })
  await assertQuizModeRecordsPractice(page, baseUrl, {
    mode: "verb-conjugation",
    itemType: "grammar",
    practiceMode: "production",
  })
  await assertQuizModeRecordsPractice(page, baseUrl, {
    mode: "audio-sokuon",
    itemType: "kana",
    practiceMode: "listening",
  })
  await assertQuizModeRecordsPractice(page, baseUrl, {
    mode: "audio-longvowel",
    itemType: "kana",
    practiceMode: "listening",
  })
  await assertQuizModeRecordsPractice(page, baseUrl, {
    mode: "meaning-vocab",
    itemType: "vocab",
    practiceMode: "meaning",
  })

  await page.goto(`${baseUrl}/quiz`, { waitUntil: "networkidle" })
  await page.evaluate((masteredIds) => {
    localStorage.clear()
    localStorage.setItem("yasashi.kana.mastered.v1", JSON.stringify(masteredIds))
  }, seionRomaji)
  await page.getByTestId("quiz-mode-hiragana-romaji").click()
  await page.getByTestId("quiz-only-unmastered-kana").click()
  await page.getByTestId("quiz-empty-state").waitFor({ state: "visible" })
}

export async function verifyDueReviewFlow(page, baseUrl) {
  await seedReviewState(page, baseUrl)
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
}

export async function verifyLearningDataFlow(page, baseUrl) {
  await seedLearningDataBackupState(page, baseUrl)
  const seededLearningBackupSnapshot = await readManagedLearningBackupSnapshot(page)
  await page.goto(`${baseUrl}/review`, { waitUntil: "networkidle" })
  await page.getByTestId("learning-data-panel").waitFor({ state: "visible" })
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByTestId("learning-data-export").click(),
  ])
  assert.match(download.suggestedFilename(), /^yasashi-learning-backup-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}\.json$/)
  const backupPath = await download.path()
  assert.ok(backupPath, "learning data export should create a downloadable backup file")
  const exportedBackup = JSON.parse(await fs.readFile(backupPath, "utf8"))
  assert.equal(exportedBackup.version, 1, "learning data export should use the current backup version")
  assertManagedLearningSnapshot(
    exportedBackup.entries,
    seededLearningBackupSnapshot,
    "learning data export should include every managed learning key"
  )

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
  assertManagedLearningSnapshot(
    await readManagedLearningBackupSnapshot(page),
    seededLearningBackupSnapshot,
    "invalid learning data import should not overwrite managed learning keys"
  )

  await page.getByTestId("learning-data-reset").click()
  await page.getByTestId("learning-data-reset").click()
  await page.waitForFunction((keys) => keys.every((key) => localStorage.getItem(key) === null), managedLearningBackupKeys)
  const resetSnapshot = await readManagedLearningBackupSnapshot(page)
  for (const key of managedLearningBackupKeys) {
    assert.equal(resetSnapshot[key], null, `learning data reset should clear managed learning key: ${key}`)
  }
  assert.equal(
    await page.evaluate(() => localStorage.getItem("yasashi.e2e.unmanaged")),
    "keep",
    "learning data reset should leave unmanaged browser state alone"
  )

  const fileChooserPromise = page.waitForEvent("filechooser")
  await page.getByTestId("learning-data-import").click()
  const fileChooser = await fileChooserPromise
  await fileChooser.setFiles(backupPath)
  await page.waitForFunction((keys) => keys.every((key) => localStorage.getItem(key) !== null), managedLearningBackupKeys)
  const restoredSnapshot = await readManagedLearningBackupSnapshot(page)
  assertManagedLearningSnapshot(
    restoredSnapshot,
    seededLearningBackupSnapshot,
    "learning data import should restore every managed learning key"
  )
  const restoredProfile = JSON.parse(restoredSnapshot["yasashi.learning.profile.v1"])
  assert.equal(restoredProfile?.goal, "balanced", "learning data import should restore the profile backup")
  const restoredMistakes = JSON.parse(restoredSnapshot["yasashi.mistakes.v1"])
  assert.ok(
    Array.isArray(restoredMistakes) && restoredMistakes.some((item) => item.id === "kana:a:hiragana-romaji"),
    "learning data import should restore the mistake notebook backup"
  )
  const restoredMistakeSrs = JSON.parse(restoredSnapshot["yasashi.srs.mistakes.v1"])
  assert.ok(
    restoredMistakeSrs?.["kana:a:hiragana-romaji"]?.dueAt,
    "learning data import should restore mistake SRS state"
  )
  assert.equal(
    await page.evaluate(() => localStorage.getItem("yasashi.e2e.unmanaged")),
    "keep",
    "learning data import should leave unmanaged browser state alone"
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
  } finally {
    await mobileContext.close()
  }
}
