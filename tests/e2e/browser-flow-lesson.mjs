import assert from "node:assert/strict"

import { readJsonStorage } from "./harness.mjs"
import { E2E_STORAGE_KEYS } from "./storage-keys.mjs"

export async function verifyLessonFlow(page, baseUrl) {
  await page.goto(baseUrl, { waitUntil: "networkidle" })
  await page.evaluate(() => localStorage.clear())
  await page.goto(baseUrl, { waitUntil: "networkidle" })
  await page.getByTestId("onboarding-goal-travel").click()
  await page.getByTestId("onboarding-some").click()
  await page.getByTestId("onboarding-always").click()
  await page.getByTestId("onboarding-minutes").focus()
  await page.keyboard.press("ArrowRight")
  await page.getByTestId("onboarding-save").click()
  await page.getByTestId("home-start-learning").waitFor({ state: "visible" })
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
  await page.getByTestId("lesson-answer-a").click()
  assert.ok(await page.getByTestId("lesson-next").isEnabled())

  const lessonPractice = await readJsonStorage(page, E2E_STORAGE_KEYS.PRACTICE_RESULTS)
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
  const itemProgress = await readJsonStorage(page, E2E_STORAGE_KEYS.ITEM_PROGRESS)
  assert.equal(itemProgress?.a?.itemType, "kana", "lesson answer should update item progress")
  assert.equal(itemProgress?.a?.attempts, 1, "lesson answer should increment item attempts")
  assert.equal(itemProgress?.a?.correct, 1, "lesson answer should increment correct count")
  const kanaSrs = await readJsonStorage(page, E2E_STORAGE_KEYS.SRS_KANA)
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
        item.itemId === "a" &&
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
        item.itemId === "a" &&
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
  await page.getByTestId("lesson-next").click()
  await page.getByTestId("lesson-next").click()
  await page.getByTestId(`lesson-answer-${ha}`).waitFor({ state: "visible" })
  await page.getByTestId(`lesson-answer-${ha}`).click()
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
        item.itemId === "ha" &&
        item.itemType === "kana" &&
        item.mode === "listening" &&
        item.correct === true
      ) &&
      !!kanaSrs?.ha?.dueAt
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
        item.itemId === "ha" &&
        item.itemType === "kana" &&
        item.mode === "listening" &&
        item.correct === true
      ),
    "dictation lesson step should write kana listening practice"
  )
  const day4KanaSrs = await readJsonStorage(page, E2E_STORAGE_KEYS.SRS_KANA)
  assert.ok(day4KanaSrs?.ha?.dueAt, "correct dictation lesson answer should enroll kana ha for SRS")

  await page.evaluate(() => localStorage.clear())
}
