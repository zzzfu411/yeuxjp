import assert from "node:assert/strict"

import { readJsonStorage } from "./harness.mjs"
import {
  assertQuizModeRecordsPractice,
  clickFirstQuizOptionAndReadPractice,
  openQuizMode,
  openQuizModeWithLearningState,
  quizVocabIdsByLevel,
  seedDueMistakeReviewState,
  seedMissingThenDueMistakeReviewState,
  seionHiraganaToRomaji,
  seionRomaji,
} from "./browser-fixtures.mjs"
import { E2E_STORAGE_KEYS } from "./storage-keys.mjs"

async function clickQuizScopeAndWaitForQuestionRefresh(page, testId) {
  await page.evaluate(() => {
    Math.random = () => 0
  })
  await page.getByTestId(testId).click()
  await page.waitForFunction((scopeTestId) => {
    return document.querySelector(`[data-testid="${scopeTestId}"]`)?.getAttribute("aria-pressed") === "true"
  }, testId)
  await page.locator('[data-testid^="quiz-answer-option-"]').first().waitFor({ state: "visible" })
  await page.waitForTimeout(50)
}

async function latestPracticeItem(page) {
  const practice = await clickFirstQuizOptionAndReadPractice(page)
  assert.ok(Array.isArray(practice), "quiz answer should record practice history")
  const latest = practice.at(-1)
  assert.ok(latest, "quiz practice history should contain the latest answer")
  return latest
}

async function verifyQuizScopeControls(page, baseUrl) {
  await openQuizMode(page, baseUrl, "hiragana-romaji")
  assert.equal(await page.getByTestId("quiz-kana-scope-seion").getAttribute("aria-pressed"), "true")
  const seionPractice = await latestPracticeItem(page)
  assert.equal(seionPractice.itemType, "kana")
  assert.ok(seionRomaji.includes(seionPractice.itemId), "seion kana scope should draw from canonical seion kana")

  await openQuizModeWithLearningState(page, baseUrl, "hiragana-romaji", { masteredKana: seionRomaji })
  await clickQuizScopeAndWaitForQuestionRefresh(page, "quiz-kana-scope-all")
  assert.equal(await page.getByTestId("quiz-kana-scope-all").getAttribute("aria-pressed"), "true")
  await clickQuizScopeAndWaitForQuestionRefresh(page, "quiz-only-unmastered-kana")
  assert.equal(await page.getByTestId("quiz-only-unmastered-kana").getAttribute("aria-pressed"), "true")
  const allUnmasteredPractice = await latestPracticeItem(page)
  assert.equal(allUnmasteredPractice.itemType, "kana")
  assert.ok(
    !seionRomaji.includes(allUnmasteredPractice.itemId),
    "all kana scope with seion mastered should draw from non-seion kana"
  )

  await openQuizMode(page, baseUrl, "meaning-vocab")
  assert.equal(await page.getByTestId("quiz-vocab-scope-survival").getAttribute("aria-pressed"), "true")
  const survivalPractice = await latestPracticeItem(page)
  assert.equal(survivalPractice.itemType, "vocab")
  assert.ok(survivalPractice.itemId.startsWith("sur-"), "survival vocabulary scope should draw survival ids")

  await openQuizMode(page, baseUrl, "meaning-vocab")
  await clickQuizScopeAndWaitForQuestionRefresh(page, "quiz-vocab-scope-daily")
  assert.equal(await page.getByTestId("quiz-vocab-scope-daily").getAttribute("aria-pressed"), "true")
  const dailyPractice = await latestPracticeItem(page)
  assert.equal(dailyPractice.itemType, "vocab")
  assert.ok(dailyPractice.itemId.startsWith("day-"), "daily vocabulary scope should draw daily ids")

  await openQuizMode(page, baseUrl, "meaning-vocab")
  await clickQuizScopeAndWaitForQuestionRefresh(page, "quiz-vocab-scope-fluent")
  assert.equal(await page.getByTestId("quiz-vocab-scope-fluent").getAttribute("aria-pressed"), "true")
  const fluentPractice = await latestPracticeItem(page)
  assert.equal(fluentPractice.itemType, "vocab")
  assert.ok(fluentPractice.itemId.startsWith("flu-"), "fluent vocabulary scope should draw fluent ids")

  const [onlyUnlearnedTarget] = quizVocabIdsByLevel.fluent
  const learnedExceptTarget = [
    ...quizVocabIdsByLevel.survival,
    ...quizVocabIdsByLevel.daily,
    ...quizVocabIdsByLevel.fluent.filter((id) => id !== onlyUnlearnedTarget),
  ]
  await openQuizModeWithLearningState(page, baseUrl, "meaning-vocab", { learnedVocab: learnedExceptTarget })
  await clickQuizScopeAndWaitForQuestionRefresh(page, "quiz-vocab-scope-all")
  assert.equal(await page.getByTestId("quiz-vocab-scope-all").getAttribute("aria-pressed"), "true")
  await clickQuizScopeAndWaitForQuestionRefresh(page, "quiz-only-unlearned-vocab")
  assert.equal(await page.getByTestId("quiz-only-unlearned-vocab").getAttribute("aria-pressed"), "true")
  const onlyUnlearnedPractice = await latestPracticeItem(page)
  assert.equal(
    onlyUnlearnedPractice.itemId,
    onlyUnlearnedTarget,
    "all vocabulary scope with one unlearned item should draw the remaining unlearned vocabulary id"
  )
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
  await page.waitForFunction((key) => {
    const mistakes = JSON.parse(localStorage.getItem(key) ?? "[]")
    return Array.isArray(mistakes) && mistakes.length > 0
  }, E2E_STORAGE_KEYS.MISTAKES)
  const mistakes = await readJsonStorage(page, E2E_STORAGE_KEYS.MISTAKES)
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
  await page.waitForFunction((storageKeys) => {
    const mistakes = JSON.parse(localStorage.getItem(storageKeys.MISTAKES) ?? "[]")
    const srs = JSON.parse(localStorage.getItem(storageKeys.SRS_MISTAKES) ?? "{}")
    const item = Array.isArray(mistakes) ? mistakes.find((mistake) => mistake.id === "e2e-mistake:kana-a") : null
    return item?.wrongCount === 2 && srs?.["e2e-mistake:kana-a"]?.box > 1
  }, E2E_STORAGE_KEYS)
  const retainedMistakes = await readJsonStorage(page, E2E_STORAGE_KEYS.MISTAKES)
  const retainedMistake = Array.isArray(retainedMistakes)
    ? retainedMistakes.find((item) => item.id === "e2e-mistake:kana-a")
    : null
  assert.equal(retainedMistake?.wrongCount, 2, "correct mistake review should retain the historical mistake count")
  const reviewedMistakeSrs = await readJsonStorage(page, E2E_STORAGE_KEYS.SRS_MISTAKES)
  assert.ok(
    reviewedMistakeSrs?.["e2e-mistake:kana-a"]?.box > 1,
    "correct mistake review should advance mistake SRS without deleting notebook history"
  )
  const correctMistakeReviewPractice = await readJsonStorage(page, E2E_STORAGE_KEYS.PRACTICE_RESULTS)
  assert.ok(
    Array.isArray(correctMistakeReviewPractice) &&
      correctMistakeReviewPractice.some((item) =>
        item.itemId === "a" &&
        item.itemType === "kana" &&
        item.mode === "recognition" &&
        item.correct === true
      ),
    "correct mistake review should write original item practice history"
  )

  await seedDueMistakeReviewState(page, baseUrl)
  await page.goto(`${baseUrl}/review`, { waitUntil: "networkidle" })
  await page.getByTestId("review-start-mistakes").click()
  await page.getByTestId("mistake-review-session").waitFor({ state: "visible" })
  await page.getByTestId("review-answer-i").click()
  await page.waitForFunction((storageKeys) => {
    const mistakes = JSON.parse(localStorage.getItem(storageKeys.MISTAKES) ?? "[]")
    const srs = JSON.parse(localStorage.getItem(storageKeys.SRS_MISTAKES) ?? "{}")
    const item = Array.isArray(mistakes) ? mistakes.find((mistake) => mistake.id === "e2e-mistake:kana-a") : null
    return item?.wrongCount === 3 &&
      srs?.["e2e-mistake:kana-a"]?.wrong === 3 &&
      srs?.["e2e-mistake:kana-a"]?.box === 0
  }, E2E_STORAGE_KEYS)
  const wrongRetainedMistakes = await readJsonStorage(page, E2E_STORAGE_KEYS.MISTAKES)
  const wrongRetainedMistake = Array.isArray(wrongRetainedMistakes)
    ? wrongRetainedMistakes.find((item) => item.id === "e2e-mistake:kana-a")
    : null
  assert.equal(wrongRetainedMistake?.wrongCount, 3, "wrong mistake review should increment notebook count once")
  const wrongReviewedMistakeSrs = await readJsonStorage(page, E2E_STORAGE_KEYS.SRS_MISTAKES)
  assert.equal(
    wrongReviewedMistakeSrs?.["e2e-mistake:kana-a"]?.wrong,
    3,
    "wrong mistake review should grade mistake SRS exactly once"
  )
  const wrongMistakeReviewPractice = await readJsonStorage(page, E2E_STORAGE_KEYS.PRACTICE_RESULTS)
  assert.ok(
    Array.isArray(wrongMistakeReviewPractice) &&
      wrongMistakeReviewPractice.some((item) =>
        item.itemId === "a" &&
        item.itemType === "kana" &&
        item.mode === "recognition" &&
        item.correct === false
      ),
    "wrong mistake review should write failed original item practice history"
  )

  await seedMissingThenDueMistakeReviewState(page, baseUrl)
  await page.goto(`${baseUrl}/review`, { waitUntil: "networkidle" })
  await page.getByTestId("review-start-mistakes").click()
  await page.getByTestId("mistake-review-session").waitFor({ state: "visible" })
  await page.getByTestId("review-answer-a").waitFor({ state: "visible" })

  const mistakeId = "e2e-mistake:kana-a"
  await seedDueMistakeReviewState(page, baseUrl)
  await page.goto(`${baseUrl}/review`, { waitUntil: "networkidle" })
  await page.getByTestId(`recent-mistake-remove-${mistakeId}`).click()
  await page.waitForFunction(({ storageKeys, id }) => {
    const mistakes = JSON.parse(localStorage.getItem(storageKeys.MISTAKES) ?? "[]")
    const srs = JSON.parse(localStorage.getItem(storageKeys.SRS_MISTAKES) ?? "{}")
    return Array.isArray(mistakes) && !mistakes.some((item) => item.id === id) && !srs?.[id]
  }, { storageKeys: E2E_STORAGE_KEYS, id: mistakeId })
  const afterRemoveMistakes = await readJsonStorage(page, E2E_STORAGE_KEYS.MISTAKES)
  assert.ok(
    Array.isArray(afterRemoveMistakes) && !afterRemoveMistakes.some((item) => item.id === mistakeId),
    "removing a recent mistake should delete it from the notebook"
  )
  const afterRemoveMistakeSrs = await readJsonStorage(page, E2E_STORAGE_KEYS.SRS_MISTAKES)
  assert.equal(afterRemoveMistakeSrs?.[mistakeId], undefined, "removing a recent mistake should delete its mistake SRS")

  await seedDueMistakeReviewState(page, baseUrl)
  await page.goto(`${baseUrl}/review`, { waitUntil: "networkidle" })
  await page.getByTestId("mistakes-clear").click()
  await page.getByTestId("mistakes-clear-dialog-cancel").click()
  await page.waitForFunction(({ storageKeys, id }) => {
    const mistakes = JSON.parse(localStorage.getItem(storageKeys.MISTAKES) ?? "[]")
    const srs = JSON.parse(localStorage.getItem(storageKeys.SRS_MISTAKES) ?? "{}")
    return Array.isArray(mistakes) && mistakes.some((item) => item.id === id) && !!srs?.[id]
  }, { storageKeys: E2E_STORAGE_KEYS, id: mistakeId })
  await page.getByTestId("mistakes-clear").click()
  await page.getByTestId("mistakes-clear-dialog-confirm").click()
  await page.waitForFunction((storageKeys) => {
    const mistakes = JSON.parse(localStorage.getItem(storageKeys.MISTAKES) ?? "[]")
    const srs = JSON.parse(localStorage.getItem(storageKeys.SRS_MISTAKES) ?? "{}")
    return Array.isArray(mistakes) && mistakes.length === 0 && Object.keys(srs).length === 0
  }, E2E_STORAGE_KEYS)
  await page.getByTestId("recent-mistakes").waitFor({ state: "hidden" })
  assert.equal(await page.getByTestId("review-start-mistakes").isDisabled(), true, "clearing mistakes should disable mistake review")

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

  await verifyQuizScopeControls(page, baseUrl)

  await page.goto(`${baseUrl}/quiz`, { waitUntil: "networkidle" })
  await page.evaluate(({ masteredIds, key }) => {
    localStorage.clear()
    localStorage.setItem(key, JSON.stringify(masteredIds))
  }, { masteredIds: seionRomaji, key: E2E_STORAGE_KEYS.KANA_MASTERED })
  await page.getByTestId("quiz-mode-hiragana-romaji").click()
  await page.getByTestId("quiz-only-unmastered-kana").click()
  await page.getByTestId("quiz-empty-state").waitFor({ state: "visible" })
}
