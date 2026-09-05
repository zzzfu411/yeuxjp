import assert from "node:assert/strict"

import { rapidClick, readJsonStorage } from "./harness.mjs"
import { E2E_STORAGE_KEYS } from "./storage-keys.mjs"

async function verifyLessonGeneratedReviewQueue(page, baseUrl) {
  await page.goto(`${baseUrl}/review`, { waitUntil: "networkidle" })
  await page.getByTestId("review-scheduled-empty-state").waitFor({ state: "visible" })
  await page.getByTestId("review-today-empty").waitFor({ state: "visible" })
  assert.equal(
    await page.getByTestId("review-start-kana").isDisabled(),
    true,
    "lesson-generated SRS should be scheduled before it is due"
  )
  const scheduledKanaSrs = await readJsonStorage(page, E2E_STORAGE_KEYS.SRS_KANA)
  assert.ok(
    scheduledKanaSrs?.["hiragana:a"]?.dueAt > Date.now(),
    "lesson-generated kana SRS should have a future due date before review"
  )

  await page.evaluate((storageKeys) => {
    const now = Date.now()
    const srs = JSON.parse(localStorage.getItem(storageKeys.SRS_KANA) ?? "{}")
    if (!srs["hiragana:a"]) throw new Error("Expected lesson-generated kana SRS for hiragana:a")
    srs["hiragana:a"].dueAt = now - 1
    localStorage.setItem(storageKeys.SRS_KANA, JSON.stringify(srs))
  }, E2E_STORAGE_KEYS)

  await page.goto(`${baseUrl}/review`, { waitUntil: "networkidle" })
  await page.getByTestId("review-due-state").waitFor({ state: "visible" })
  await page.getByTestId("review-today-due").waitFor({ state: "visible" })
  await page.getByTestId("review-start-kana").click()
  await page.getByTestId("review-answer-a").waitFor({ state: "visible" })
  await page.getByTestId("review-answer-a").click()
  await page.waitForFunction((storageKeys) => {
    const srs = JSON.parse(localStorage.getItem(storageKeys.SRS_KANA) ?? "{}")
    const practice = JSON.parse(localStorage.getItem(storageKeys.PRACTICE_RESULTS) ?? "[]")
    return srs?.["hiragana:a"]?.box > 1 &&
      srs?.["hiragana:a"]?.right >= 1 &&
      srs?.["hiragana:a"]?.dueAt > Date.now() &&
      Array.isArray(practice) &&
      practice.some((item) =>
        item.itemId === "hiragana:a" &&
        item.itemType === "kana" &&
        item.mode === "recognition" &&
        item.correct === true &&
        item.lessonId === undefined
      )
  }, E2E_STORAGE_KEYS)
  const reviewedKanaSrs = await readJsonStorage(page, E2E_STORAGE_KEYS.SRS_KANA)
  assert.ok(reviewedKanaSrs?.["hiragana:a"]?.box > 1, "reviewing lesson-generated SRS should advance kana box")
  assert.ok(reviewedKanaSrs?.["hiragana:a"]?.right >= 1, "reviewing lesson-generated SRS should increment right count")
}

export async function verifyLessonFlow(page, baseUrl) {
  await page.goto(baseUrl, { waitUntil: "networkidle" })
  await page.evaluate(() => localStorage.clear())
  await page.goto(baseUrl, { waitUntil: "networkidle" })
  await page.getByTestId("home-edit-profile").click()
  await page.getByTestId("onboarding-goal-travel").click()
  await page.getByTestId("onboarding-some").click()
  await page.getByTestId("onboarding-always").click()
  await page.getByTestId("onboarding-minutes").focus()
  await page.keyboard.press("ArrowRight")
  await page.getByTestId("onboarding-save").click()
  await page.getByRole("dialog").waitFor({ state: "hidden" })
  await page.getByTestId("home-start-learning").waitFor({ state: "visible" })
  assert.match(
    await page.getByText("课程", { exact: true }).locator("xpath=..").innerText(),
    /0\/175/,
    "home should show course progress separately from vocabulary mastery"
  )
  assert.match(
    await page.getByText("入门词", { exact: true }).locator("xpath=..").innerText(),
    /0\/544/,
    "home should show survival vocabulary mastery separately from course progress"
  )
  const savedProfile = await readJsonStorage(page, E2E_STORAGE_KEYS.USER_PROFILE)
  assert.equal(savedProfile?.goal, "travel", "onboarding should persist the selected learning goal")
  assert.equal(savedProfile?.kanaLevel, "some", "onboarding should persist the selected kana level")
  assert.equal(savedProfile?.romajiMode, "always", "onboarding should persist the selected romaji mode")
  assert.equal(savedProfile?.minutesPerDay, 15, "onboarding should persist the selected daily minutes")
  await assert.doesNotReject(() => page.getByTestId("home-start-learning").click())
  await page.waitForURL(/\/learn\//)
  await page.getByTestId("lesson-next").click()
  await page.waitForFunction((key) => {
    const progress = JSON.parse(localStorage.getItem(key) ?? "{}")
    return progress?.["day-1-a-row-hello"]?.lastStepId === "hello-example"
  }, E2E_STORAGE_KEYS.LESSON_PROGRESS)
  const lessonProgress = await readJsonStorage(page, E2E_STORAGE_KEYS.LESSON_PROGRESS)
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
  await page.waitForFunction((key) => {
    const progress = JSON.parse(localStorage.getItem(key) ?? "{}")
    return progress?.["day-1-a-row-hello"]?.lastStepId === "recognize-a"
  }, E2E_STORAGE_KEYS.LESSON_PROGRESS)
  await page.getByTestId("lesson-answer-a").waitFor({ state: "visible" })
  await rapidClick(page.getByTestId("lesson-answer-a"))
  await page.getByTestId("lesson-next").and(page.locator(":enabled")).waitFor({ state: "visible" })
  assert.ok(await page.getByTestId("lesson-next").isEnabled())

  const lessonPractice = await readJsonStorage(page, E2E_STORAGE_KEYS.PRACTICE_RESULTS)
  assert.ok(Array.isArray(lessonPractice), "lesson answer should write practice history")
  assert.ok(
    lessonPractice.some((item) =>
      item.lessonId === "day-1-a-row-hello" &&
      item.itemId === "hiragana:a" &&
      item.itemType === "kana" &&
      item.mode === "recognition" &&
      item.correct === true
    ),
    "lesson answer should record the kana recognition result"
  )
  const itemProgress = await readJsonStorage(page, E2E_STORAGE_KEYS.ITEM_PROGRESS)
  assert.equal(itemProgress?.["hiragana:a"]?.itemType, "kana", "lesson answer should update item progress")
  assert.equal(itemProgress?.["hiragana:a"]?.attempts, 1, "lesson answer should increment item attempts")
  assert.equal(
    lessonPractice.filter((item) =>
      item.lessonId === "day-1-a-row-hello" &&
      item.lessonStepId === "recognize-a" &&
      item.itemId === "hiragana:a"
    ).length,
    1,
    "rapid lesson answer clicks should write one practice result"
  )
  assert.equal(itemProgress?.["hiragana:a"]?.correct, 1, "lesson answer should increment correct count")
  const kanaSrs = await readJsonStorage(page, E2E_STORAGE_KEYS.SRS_KANA)
  assert.ok(kanaSrs?.["hiragana:a"]?.dueAt, "correct kana lesson answer should enroll SRS")
  const correctLessonResultCount = lessonPractice.filter((item) =>
    item.lessonId === "day-1-a-row-hello" && item.lessonStepId === "recognize-a"
  ).length
  const correctKanaSrsBeforeRefresh = kanaSrs?.["hiragana:a"]

  await page.reload({ waitUntil: "networkidle" })
  await page.waitForFunction(() => {
    const answer = document.querySelector('[data-testid="lesson-answer-a"]')
    const next = document.querySelector('[data-testid="lesson-next"]')
    return answer?.getAttribute("aria-pressed") === "true" && answer.disabled && next && !next.disabled
  })
  assert.equal(
    await page.getByTestId("lesson-answer-a").getAttribute("aria-pressed"),
    "true",
    "refresh should restore the latest correct lesson answer"
  )
  assert.ok(await page.getByTestId("lesson-next").isEnabled(), "answered lesson step should remain continuable after refresh")
  await page.getByTestId("lesson-next").click()

  const practiceAfterCorrectRefresh = await readJsonStorage(page, E2E_STORAGE_KEYS.PRACTICE_RESULTS)
  const itemProgressAfterCorrectRefresh = await readJsonStorage(page, E2E_STORAGE_KEYS.ITEM_PROGRESS)
  const kanaSrsAfterCorrectRefresh = await readJsonStorage(page, E2E_STORAGE_KEYS.SRS_KANA)
  assert.equal(
    practiceAfterCorrectRefresh.filter((item) =>
      item.lessonId === "day-1-a-row-hello" && item.lessonStepId === "recognize-a"
    ).length,
    correctLessonResultCount,
    "refreshing an answered lesson step should not duplicate practice history"
  )
  assert.equal(
    itemProgressAfterCorrectRefresh?.["hiragana:a"]?.attempts,
    1,
    "refreshing an answered lesson step should not duplicate item attempts"
  )
  assert.deepEqual(
    kanaSrsAfterCorrectRefresh?.["hiragana:a"],
    correctKanaSrsBeforeRefresh,
    "refreshing an answered lesson step should not grade kana SRS again"
  )
  await page.getByTestId("lesson-answer-お").waitFor({ state: "visible" })
  await page.getByTestId("lesson-answer-お").click()
  await page.getByTestId("lesson-next").click()
  await page.getByTestId("lesson-typing-input").fill("こんにちは")
  await page.getByTestId("lesson-submit-typing").click()
  await page.getByTestId("lesson-next").click()
  await page.getByTestId("lesson-next").click()
  await page.getByTestId("lesson-completed-summary").waitFor({ state: "visible" })
  const completedSummary = page.getByTestId("lesson-completed-summary")
  assert.match(
    await completedSummary.innerText(),
    /本课词汇掌握/,
    "completed lesson recap should show this lesson's vocabulary mastery"
  )
  await completedSummary.getByText("こんにちは").waitFor({ state: "visible" })
  assert.ok(
    await completedSummary.getByRole("link", { name: /用闪卡把本课词评成记住/ }).isVisible(),
    "completed lesson recap should send learners to vocabulary flashcards"
  )
  const completedLessonProgress = await readJsonStorage(page, E2E_STORAGE_KEYS.LESSON_PROGRESS)
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
  assert.match(
    await page.getByText("课程", { exact: true }).locator("xpath=..").innerText(),
    /1\/175/,
    "home course progress should increment after completing day 1"
  )
  assert.equal(
    await page.getByTestId("home-start-learning").getAttribute("href"),
    "/learn/day-2-ka-row-thanks",
    "home start learning should recommend the next unlocked lesson after completing day 1"
  )
  await page.getByTestId("home-edit-profile").click()
  await page.getByTestId("onboarding-hidden").click()
  await page.getByTestId("onboarding-save").click()
  await page.getByRole("dialog").waitFor({ state: "hidden" })
  await page.getByTestId("home-edit-profile").waitFor({ state: "visible" })
  const editedProfile = await readJsonStorage(page, E2E_STORAGE_KEYS.USER_PROFILE)
  assert.equal(editedProfile?.romajiMode, "hidden", "home profile editor should persist a later romaji change")
  assert.equal(editedProfile?.goal, "travel", "home profile editor should keep the existing learning goal")
  await page.goto(`${baseUrl}/path`, { waitUntil: "networkidle" })
  assert.equal(
    await page.getByTestId("path-next-learning").getAttribute("href"),
    "/learn/day-2-ka-row-thanks",
    "path next step should recommend the next unlocked lesson after completing day 1"
  )
  assert.match(
    await page.getByText("已完成课程", { exact: true }).locator("xpath=..").innerText(),
    /1\/175/,
    "path should show course progress separately from vocabulary mastery"
  )
  assert.match(
    await page.getByText("入门词汇", { exact: true }).locator("xpath=..").innerText(),
    /0\/544/,
    "path should show survival vocabulary mastery separately from course progress"
  )
  await verifyLessonGeneratedReviewQueue(page, baseUrl)

  await page.evaluate(() => localStorage.clear())
  await page.goto(`${baseUrl}/learn/day-2-ka-row-thanks`, { waitUntil: "networkidle" })
  await page.getByTestId("lesson-locked-preview").waitFor({ state: "visible" })
  await page.getByTestId("lesson-next").click()
  await page.getByTestId("lesson-next").click()
  await page.getByTestId("lesson-answer-ka").waitFor({ state: "visible" })
  assert.ok(await page.getByTestId("lesson-answer-ka").isDisabled(), "locked lesson preview should disable practice answers")
  assert.equal(
    await page.evaluate((key) => localStorage.getItem(key), E2E_STORAGE_KEYS.LESSON_PROGRESS),
    null,
    "locked lesson preview should not start lesson progress"
  )
  assert.equal(
    await page.evaluate((key) => localStorage.getItem(key), E2E_STORAGE_KEYS.PRACTICE_RESULTS),
    null,
    "locked lesson preview should not record practice history"
  )
  assert.equal(
    await page.evaluate((key) => localStorage.getItem(key), E2E_STORAGE_KEYS.SRS_KANA),
    null,
    "locked lesson preview should not enroll SRS"
  )

  await page.evaluate(() => localStorage.clear())
  await page.goto(`${baseUrl}/learn/day-1-a-row-hello`, { waitUntil: "networkidle" })
  await page.getByTestId("lesson-next").click()
  await page.getByTestId("lesson-next").click()
  await page.getByTestId("lesson-answer-i").waitFor({ state: "visible" })
  await page.getByTestId("lesson-answer-i").click()
  await page.waitForFunction((storageKeys) => {
    const practice = JSON.parse(localStorage.getItem(storageKeys.PRACTICE_RESULTS) ?? "[]")
    const mistakes = JSON.parse(localStorage.getItem(storageKeys.MISTAKES) ?? "[]")
    return Array.isArray(practice) &&
      practice.some((item) =>
        item.lessonId === "day-1-a-row-hello" &&
        item.lessonStepId === "recognize-a" &&
        item.itemId === "hiragana:a" &&
        item.itemType === "kana" &&
        item.mode === "recognition" &&
        item.correct === false &&
        item.answer === "i"
      ) &&
      Array.isArray(mistakes) &&
      mistakes.some((item) =>
        item.type === "lesson:multipleChoice" &&
        item.correctAnswer === "a" &&
        item.lastWrongAnswer === "i" &&
        item.wrongCount >= 1
      )
  }, E2E_STORAGE_KEYS)
  const wrongLessonPractice = await readJsonStorage(page, E2E_STORAGE_KEYS.PRACTICE_RESULTS)
  assert.ok(
    Array.isArray(wrongLessonPractice) &&
      wrongLessonPractice.some((item) =>
        item.lessonId === "day-1-a-row-hello" &&
        item.lessonStepId === "recognize-a" &&
        item.itemId === "hiragana:a" &&
        item.correct === false &&
        item.answer === "i"
      ),
    "wrong lesson answer should write failed practice history"
  )
  const wrongLessonMistakes = await readJsonStorage(page, E2E_STORAGE_KEYS.MISTAKES)
  assert.ok(
    Array.isArray(wrongLessonMistakes) &&
      wrongLessonMistakes.some((item) =>
        item.type === "lesson:multipleChoice" &&
        item.correctAnswer === "a" &&
        item.lastWrongAnswer === "i" &&
        item.wrongCount >= 1
      ),
    "wrong lesson answer should enter the mistake notebook"
  )
  assert.equal(
    await page.evaluate((key) => localStorage.getItem(key), E2E_STORAGE_KEYS.SRS_KANA),
    null,
    "wrong lesson answer should not enroll kana SRS"
  )
  const wrongItemProgressBeforeRefresh = await readJsonStorage(page, E2E_STORAGE_KEYS.ITEM_PROGRESS)
  const wrongMistakeSrsBeforeRefresh = await readJsonStorage(page, E2E_STORAGE_KEYS.SRS_MISTAKES)
  const wrongLessonResultCount = wrongLessonPractice.filter((item) =>
    item.lessonId === "day-1-a-row-hello" && item.lessonStepId === "recognize-a"
  ).length
  const wrongMistakeBeforeRefresh = wrongLessonMistakes.find((item) =>
    item.type === "lesson:multipleChoice" && item.correctAnswer === "a"
  )
  assert.ok(wrongMistakeBeforeRefresh, "wrong lesson answer should expose its persisted mistake before refresh")
  assert.ok(wrongMistakeSrsBeforeRefresh?.[wrongMistakeBeforeRefresh.id], "wrong lesson answer should enroll mistake SRS")

  await page.reload({ waitUntil: "networkidle" })
  await page.waitForFunction(() => {
    const answer = document.querySelector('[data-testid="lesson-answer-i"]')
    const next = document.querySelector('[data-testid="lesson-next"]')
    return answer?.getAttribute("aria-pressed") === "true" && answer.disabled && next && !next.disabled
  })
  assert.equal(
    await page.getByTestId("lesson-answer-i").getAttribute("aria-pressed"),
    "true",
    "refresh should restore the latest wrong lesson answer"
  )
  assert.ok(await page.getByTestId("lesson-next").isEnabled(), "wrong answered lesson step should remain continuable after refresh")
  await page.getByTestId("lesson-next").click()

  const wrongPracticeAfterRefresh = await readJsonStorage(page, E2E_STORAGE_KEYS.PRACTICE_RESULTS)
  const wrongItemProgressAfterRefresh = await readJsonStorage(page, E2E_STORAGE_KEYS.ITEM_PROGRESS)
  const wrongMistakesAfterRefresh = await readJsonStorage(page, E2E_STORAGE_KEYS.MISTAKES)
  const wrongMistakeSrsAfterRefresh = await readJsonStorage(page, E2E_STORAGE_KEYS.SRS_MISTAKES)
  const wrongMistakeAfterRefresh = wrongMistakesAfterRefresh.find((item) => item.id === wrongMistakeBeforeRefresh.id)
  assert.equal(
    wrongPracticeAfterRefresh.filter((item) =>
      item.lessonId === "day-1-a-row-hello" && item.lessonStepId === "recognize-a"
    ).length,
    wrongLessonResultCount,
    "refreshing a wrong answered lesson step should not duplicate practice history"
  )
  assert.equal(
    wrongItemProgressAfterRefresh?.["hiragana:a"]?.attempts,
    wrongItemProgressBeforeRefresh?.["hiragana:a"]?.attempts,
    "refreshing a wrong answered lesson step should not duplicate item attempts"
  )
  assert.equal(
    wrongMistakeAfterRefresh?.wrongCount,
    wrongMistakeBeforeRefresh.wrongCount,
    "refreshing a wrong answered lesson step should not increment mistake count"
  )
  assert.deepEqual(
    wrongMistakeSrsAfterRefresh,
    wrongMistakeSrsBeforeRefresh,
    "refreshing a wrong answered lesson step should not grade mistake SRS again"
  )

  await page.evaluate((storageKeys) => {
    const now = Date.now()
    const completedLessonIds = [
      "day-1-a-row-hello",
      "day-2-ka-row-thanks",
      "day-3-sa-ta-row-sumimasen",
    ]
    localStorage.clear()
    localStorage.setItem(
      storageKeys.LESSON_PROGRESS,
      JSON.stringify(Object.fromEntries(completedLessonIds.map((lessonId, index) => [
        lessonId,
        {
          lessonId,
          status: "completed",
          startedAt: now - 10_000 + index,
          completedAt: now - 5000 + index,
          score: 100,
          currentStepIndex: 5,
          lastStepId: "summary",
          updatedAt: now - 5000 + index,
        },
      ])))
    )
  }, E2E_STORAGE_KEYS)
  await page.goto(`${baseUrl}/learn/day-4-na-ha-ma-intro-sentence`, { waitUntil: "networkidle" })
  const ha = String.fromCodePoint(0x306f)
  const ra = "ra"
  await page.getByTestId("lesson-next").click()
  await page.getByTestId("lesson-next").click()
  await page.getByTestId(`lesson-answer-${ha}`).waitFor({ state: "visible" })
  await page.getByTestId(`lesson-answer-${ha}`).click()
  await page.getByTestId("lesson-next").click()

  await page.getByTestId(`lesson-answer-${ra}`).waitFor({ state: "visible" })
  await page.getByTestId(`lesson-answer-${ra}`).click()
  await page.getByTestId("lesson-next").click()

  await page.getByTestId("lesson-sentence-chunk-1").click()
  await page.getByTestId("lesson-sentence-chunk-3").click()
  await page.getByTestId("lesson-sentence-chunk-2").click()
  await page.getByTestId("lesson-sentence-chunk-0").click()
  await page.getByTestId("lesson-submit-sentence").click()
  await page.getByTestId("lesson-next").click()
  await page.getByTestId("lesson-typing-input").fill(ha)
  await page.getByTestId("lesson-submit-typing").click()
  await page.waitForFunction((storageKeys) => {
    const practice = JSON.parse(localStorage.getItem(storageKeys.PRACTICE_RESULTS) ?? "[]")
    const kanaSrs = JSON.parse(localStorage.getItem(storageKeys.SRS_KANA) ?? "{}")
    return Array.isArray(practice) &&
      practice.some((item) =>
        item.lessonId === "day-4-na-ha-ma-intro-sentence" &&
        item.lessonStepId === "build-intro" &&
        item.itemId === "sentence-intro-student" &&
        item.itemType === "sentence" &&
        item.mode === "production" &&
        item.correct === true
      ) &&
      practice.some((item) =>
        item.lessonId === "day-4-na-ha-ma-intro-sentence" &&
        item.lessonStepId === "dictation-ha" &&
        item.itemId === "hiragana:ha" &&
        item.itemType === "kana" &&
        item.mode === "listening" &&
        item.correct === true
      ) &&
      !!kanaSrs?.["hiragana:ha"]?.dueAt
  }, E2E_STORAGE_KEYS)
  const day4Practice = await readJsonStorage(page, E2E_STORAGE_KEYS.PRACTICE_RESULTS)
  assert.ok(
    Array.isArray(day4Practice) &&
      day4Practice.some((item) =>
        item.lessonStepId === "build-intro" &&
        item.itemId === "sentence-intro-student" &&
        item.itemType === "sentence" &&
        item.mode === "production" &&
        item.correct === true
      ),
    "sentence build lesson step should write sentence production practice"
  )
  assert.ok(
    Array.isArray(day4Practice) &&
      day4Practice.some((item) =>
        item.lessonStepId === "dictation-ha" &&
        item.itemId === "hiragana:ha" &&
        item.itemType === "kana" &&
        item.mode === "listening" &&
        item.correct === true
      ),
    "dictation lesson step should write kana listening practice"
  )
  const day4KanaSrs = await readJsonStorage(page, E2E_STORAGE_KEYS.SRS_KANA)
  assert.ok(day4KanaSrs?.["hiragana:ha"]?.dueAt, "correct dictation lesson answer should enroll kana ha for SRS")

  await page.evaluate(() => localStorage.clear())
}
