import assert from "node:assert/strict"

import { readJsonStorage } from "./harness.mjs"
import {
  assertQuizModeRecordsPractice,
  clickFirstQuizOptionAndReadPractice,
  clickQuizOptionExceptValueAndReadPractice,
  clickQuizOptionByValueAndReadPractice,
  getVocabularyIdForPrompt,
  openQuizMode,
  openQuizModeWithFixedRandom,
  openQuizModeWithLearningState,
  quizVocabIdsByLevel,
  seedDueMistakeReviewState,
  seedMissingThenDueMistakeReviewState,
  seionHiraganaIds,
  seionHiraganaToRomaji,
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

async function verifyQuizGeneratedVocabularyReviewQueue(page, baseUrl) {
  await openQuizModeWithFixedRandom(page, baseUrl, "meaning-vocab")
  await page.getByTestId("quiz-question-text").waitFor({ state: "visible" })
  const prompt = (await page.getByTestId("quiz-question-text").innerText()).trim()
  const vocabId = getVocabularyIdForPrompt(prompt)
  assert.ok(vocabId, `meaning vocabulary quiz prompt should map back to a known vocabulary id, got ${prompt}`)

  const practice = await clickQuizOptionByValueAndReadPractice(page, vocabId)
  const latest = practice.at(-1)
  assert.ok(latest, "correct meaning vocabulary quiz answer should write practice history")
  assert.equal(latest.itemId, vocabId, "correct meaning vocabulary quiz answer should record the prompted vocabulary id")
  assert.equal(latest.itemType, "vocab", "correct meaning vocabulary quiz answer should record vocab item type")
  assert.equal(latest.mode, "meaning", "correct meaning vocabulary quiz answer should record meaning mode")
  assert.equal(latest.correct, true, "correct meaning vocabulary quiz answer should be marked correct")

  const itemProgress = await readJsonStorage(page, E2E_STORAGE_KEYS.ITEM_PROGRESS)
  assert.equal(itemProgress?.[vocabId]?.attempts, 1, "correct meaning vocabulary quiz answer should update item attempts")
  const scheduledVocabSrs = await readJsonStorage(page, E2E_STORAGE_KEYS.SRS_VOCAB)
  assert.ok(
    scheduledVocabSrs?.[vocabId]?.dueAt > Date.now(),
    "quiz-generated vocabulary SRS should have a future due date before review"
  )

  await page.goto(`${baseUrl}/review`, { waitUntil: "networkidle" })
  await page.getByTestId("review-scheduled-empty-state").waitFor({ state: "visible" })
  await page.getByTestId("review-today-empty").waitFor({ state: "visible" })
  assert.equal(
    await page.getByTestId("review-start-vocab").isDisabled(),
    true,
    "quiz-generated vocabulary SRS should be scheduled before it is due"
  )

  await page.evaluate(({ storageKeys, id }) => {
    const srs = JSON.parse(localStorage.getItem(storageKeys.SRS_VOCAB) ?? "{}")
    if (!srs[id]) throw new Error(`Expected quiz-generated vocabulary SRS for ${id}`)
    srs[id].dueAt = Date.now() - 1
    localStorage.setItem(storageKeys.SRS_VOCAB, JSON.stringify(srs))
  }, { storageKeys: E2E_STORAGE_KEYS, id: vocabId })

  await page.goto(`${baseUrl}/review`, { waitUntil: "networkidle" })
  await page.getByTestId("review-due-state").waitFor({ state: "visible" })
  await page.getByTestId("review-today-due").waitFor({ state: "visible" })
  await page.getByTestId("review-start-vocab").click()
  await page.getByTestId(`review-answer-${vocabId}`).waitFor({ state: "visible" })
  await page.getByTestId(`review-answer-${vocabId}`).click()
  await page.waitForFunction(({ storageKeys, id }) => {
    const srs = JSON.parse(localStorage.getItem(storageKeys.SRS_VOCAB) ?? "{}")
    const practice = JSON.parse(localStorage.getItem(storageKeys.PRACTICE_RESULTS) ?? "[]")
    return srs?.[id]?.box > 1 &&
      srs?.[id]?.right >= 1 &&
      srs?.[id]?.dueAt > Date.now() &&
      Array.isArray(practice) &&
      practice.some((item) =>
        item.lessonId === undefined &&
        item.itemId === id &&
        item.itemType === "vocab" &&
        item.mode === "meaning" &&
        item.correct === true
      )
  }, { storageKeys: E2E_STORAGE_KEYS, id: vocabId })
  const reviewedVocabSrs = await readJsonStorage(page, E2E_STORAGE_KEYS.SRS_VOCAB)
  assert.ok(reviewedVocabSrs?.[vocabId]?.box > 1, "reviewing quiz-generated vocabulary SRS should advance vocab box")
  assert.ok(
    reviewedVocabSrs?.[vocabId]?.right >= 1,
    "reviewing quiz-generated vocabulary SRS should increment right count"
  )
}

async function verifyVocabularyQuizMistakeReviewFlow(page, baseUrl) {
  await openQuizModeWithFixedRandom(page, baseUrl, "meaning-vocab")
  await page.getByTestId("quiz-question-text").waitFor({ state: "visible" })
  const prompt = (await page.getByTestId("quiz-question-text").innerText()).trim()
  const vocabId = getVocabularyIdForPrompt(prompt)
  assert.ok(vocabId, `meaning vocabulary quiz prompt should map back to a known vocabulary id, got ${prompt}`)

  const { wrongValue, practice } = await clickQuizOptionExceptValueAndReadPractice(page, vocabId)
  const latest = practice.at(-1)
  assert.ok(latest, "wrong meaning vocabulary quiz answer should write practice history")
  assert.equal(latest.itemId, vocabId, "wrong meaning vocabulary quiz answer should record the prompted vocabulary id")
  assert.equal(latest.itemType, "vocab", "wrong meaning vocabulary quiz answer should record vocab item type")
  assert.equal(latest.mode, "meaning", "wrong meaning vocabulary quiz answer should record meaning mode")
  assert.equal(latest.correct, false, "wrong meaning vocabulary quiz answer should be marked wrong")
  assert.equal(latest.answer, wrongValue, "wrong meaning vocabulary quiz answer should record the selected vocabulary id")

  await page.waitForFunction(({ storageKeys, id, answer }) => {
    const mistakes = JSON.parse(localStorage.getItem(storageKeys.MISTAKES) ?? "[]")
    const mistakeSrs = JSON.parse(localStorage.getItem(storageKeys.SRS_MISTAKES) ?? "{}")
    const item = Array.isArray(mistakes)
      ? mistakes.find((mistake) =>
        mistake.type === "meaning-vocab" &&
        mistake.itemId === id &&
        mistake.itemType === "vocab" &&
        mistake.mode === "meaning" &&
        mistake.correctAnswer === id &&
        mistake.lastWrongAnswer === answer &&
        mistake.wrongCount >= 1
      )
      : null
    return !!item && mistakeSrs?.[item.id]?.dueAt <= Date.now()
  }, { storageKeys: E2E_STORAGE_KEYS, id: vocabId, answer: wrongValue })
  const mistakes = await readJsonStorage(page, E2E_STORAGE_KEYS.MISTAKES)
  const recordedMistake = Array.isArray(mistakes)
    ? mistakes.find((item) =>
      item.type === "meaning-vocab" &&
      item.itemId === vocabId &&
      item.correctAnswer === vocabId &&
      item.lastWrongAnswer === wrongValue
    )
    : null
  assert.ok(recordedMistake, "wrong meaning vocabulary quiz answer should enter the mistake notebook")
  assert.equal(recordedMistake.itemType, "vocab", "vocabulary quiz mistakes should preserve vocab item type")
  assert.equal(recordedMistake.mode, "meaning", "vocabulary quiz mistakes should preserve meaning mode")

  await page.goto(`${baseUrl}/review`, { waitUntil: "networkidle" })
  await page.getByTestId("review-due-state").waitFor({ state: "visible" })
  await page.getByTestId("review-start-mistakes").click()
  await page.getByTestId("mistake-review-session").waitFor({ state: "visible" })
  await page.getByTestId(`review-answer-${vocabId}`).waitFor({ state: "visible" })
  await page.getByTestId(`review-answer-${vocabId}`).click()
  await page.waitForFunction(({ storageKeys, id, mistakeId }) => {
    const mistakeSrs = JSON.parse(localStorage.getItem(storageKeys.SRS_MISTAKES) ?? "{}")
    const practice = JSON.parse(localStorage.getItem(storageKeys.PRACTICE_RESULTS) ?? "[]")
    const mistakes = JSON.parse(localStorage.getItem(storageKeys.MISTAKES) ?? "[]")
    const mistake = Array.isArray(mistakes) ? mistakes.find((item) => item.id === mistakeId) : null
    return mistake?.wrongCount === 1 &&
      mistakeSrs?.[mistakeId]?.box >= 1 &&
      mistakeSrs?.[mistakeId]?.right >= 1 &&
      mistakeSrs?.[mistakeId]?.dueAt > Date.now() &&
      Array.isArray(practice) &&
      practice.some((item) =>
        item.lessonId === undefined &&
        item.itemId === id &&
        item.itemType === "vocab" &&
        item.mode === "meaning" &&
        item.correct === true
      )
  }, { storageKeys: E2E_STORAGE_KEYS, id: vocabId, mistakeId: recordedMistake.id })
  const reviewedMistakeSrs = await readJsonStorage(page, E2E_STORAGE_KEYS.SRS_MISTAKES)
  assert.ok(
    reviewedMistakeSrs?.[recordedMistake.id]?.right >= 1,
    "correct vocabulary mistake review should grade mistake SRS"
  )
  const retainedMistakes = await readJsonStorage(page, E2E_STORAGE_KEYS.MISTAKES)
  const retainedMistake = Array.isArray(retainedMistakes)
    ? retainedMistakes.find((item) => item.id === recordedMistake.id)
    : null
  assert.equal(retainedMistake?.wrongCount, 1, "correct vocabulary mistake review should retain notebook history")
}

async function verifyQuizScopeControls(page, baseUrl) {
  await openQuizMode(page, baseUrl, "hiragana-romaji")
  assert.equal(await page.getByTestId("quiz-kana-scope-seion").getAttribute("aria-pressed"), "true")
  const seionPractice = await latestPracticeItem(page)
  assert.equal(seionPractice.itemType, "kana")
  assert.ok(seionHiraganaIds.includes(seionPractice.itemId), "seion kana scope should draw from canonical seion kana")

  await openQuizModeWithLearningState(page, baseUrl, "hiragana-romaji", { masteredKana: seionHiraganaIds })
  await clickQuizScopeAndWaitForQuestionRefresh(page, "quiz-kana-scope-all")
  assert.equal(await page.getByTestId("quiz-kana-scope-all").getAttribute("aria-pressed"), "true")
  await clickQuizScopeAndWaitForQuestionRefresh(page, "quiz-only-unmastered-kana")
  assert.equal(await page.getByTestId("quiz-only-unmastered-kana").getAttribute("aria-pressed"), "true")
  const allUnmasteredPractice = await latestPracticeItem(page)
  assert.equal(allUnmasteredPractice.itemType, "kana")
  assert.ok(
    !seionHiraganaIds.includes(allUnmasteredPractice.itemId),
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

async function verifyFilteredVocabularyQuizTransitions(page, baseUrl) {
  const survivalVocabIds = quizVocabIdsByLevel.survival
  assert.ok(survivalVocabIds.length >= 4, "survival vocabulary should support four-option quiz questions")

  await openQuizModeWithLearningState(page, baseUrl, "meaning-vocab", {
    learnedVocab: survivalVocabIds,
  })
  await page.getByTestId("quiz-only-unlearned-vocab").click()
  await page.getByTestId("quiz-empty-state").waitFor({ state: "visible" })
  assert.equal(
    await page.locator('[data-testid^="quiz-answer-option-"]').count(),
    0,
    "all-learned vocabulary filters should show an empty state instead of falling back to the base pool"
  )

  const [lastUnlearnedVocabId] = survivalVocabIds
  const learnedExceptTarget = survivalVocabIds.filter((id) => id !== lastUnlearnedVocabId)
  await openQuizModeWithLearningState(page, baseUrl, "meaning-vocab", {
    learnedVocab: learnedExceptTarget,
  })
  await page.evaluate(({ storageKey, id }) => {
    localStorage.setItem(storageKey, JSON.stringify({
      [id]: {
        itemId: id,
        itemType: "vocab",
        recognition: 0,
        listening: 0,
        meaning: 30,
        recall: 0,
        production: 0,
        attempts: 1,
        correct: 1,
        updatedAt: Date.now(),
      },
    }))
    Math.random = () => 0
  }, { storageKey: E2E_STORAGE_KEYS.ITEM_PROGRESS, id: lastUnlearnedVocabId })
  await clickQuizScopeAndWaitForQuestionRefresh(page, "quiz-only-unlearned-vocab")

  const promptBeforeAnswer = (await page.getByTestId("quiz-question-text").innerText()).trim()
  assert.equal(
    getVocabularyIdForPrompt(promptBeforeAnswer),
    lastUnlearnedVocabId,
    "the filtered vocabulary quiz should show its last unlearned target"
  )

  await clickQuizOptionByValueAndReadPractice(page, lastUnlearnedVocabId)
  await page.waitForFunction(({ storageKey, id }) => {
    const items = JSON.parse(localStorage.getItem(storageKey) ?? "{}")
    return items?.[id]?.meaning >= 40
  }, { storageKey: E2E_STORAGE_KEYS.ITEM_PROGRESS, id: lastUnlearnedVocabId })
  await page.evaluate(() => new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve))
  }))

  assert.equal(
    (await page.getByTestId("quiz-question-text").innerText()).trim(),
    promptBeforeAnswer,
    "answer-driven learning.items updates should keep the answered question mounted"
  )
  const answeredOption = page.locator(`[data-answer-value="${lastUnlearnedVocabId}"]`)
  assert.equal(
    await answeredOption.getAttribute("data-feedback"),
    "correct",
    "answer feedback should remain visible after learning.items updates"
  )
  assert.equal(await answeredOption.isDisabled(), true, "the answered options should stay frozen")
  await page.getByTestId("quiz-answer-feedback").waitFor({ state: "attached" })
  await page.getByTestId("quiz-next-question").waitFor({ state: "visible" })
  assert.equal(await page.getByTestId("quiz-empty-state").count(), 0)

  await page.getByTestId("quiz-next-question").click()
  await page.getByTestId("quiz-empty-state").waitFor({ state: "visible" })
  assert.equal(
    await page.getByTestId("quiz-question-text").count(),
    0,
    "the exhausted filtered pool should advance only after the learner clicks next"
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
        item.itemId === "hiragana:a" &&
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
        item.itemId === "hiragana:a" &&
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
  await verifyQuizGeneratedVocabularyReviewQueue(page, baseUrl)
  await verifyVocabularyQuizMistakeReviewFlow(page, baseUrl)

  await verifyQuizScopeControls(page, baseUrl)
  await verifyFilteredVocabularyQuizTransitions(page, baseUrl)

  await page.goto(`${baseUrl}/quiz`, { waitUntil: "networkidle" })
  await page.evaluate(({ masteredIds, key }) => {
    localStorage.clear()
    localStorage.setItem(key, JSON.stringify(masteredIds))
  }, { masteredIds: seionHiraganaIds, key: E2E_STORAGE_KEYS.KANA_MASTERED })
  await page.getByTestId("quiz-mode-hiragana-romaji").click()
  await page.getByTestId("quiz-only-unmastered-kana").click()
  await page.getByTestId("quiz-empty-state").waitFor({ state: "visible" })
}
