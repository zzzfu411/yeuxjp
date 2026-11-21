import assert from "node:assert/strict"
import fs from "node:fs"
import { chromium } from "playwright"
import { loadTsModule } from "../tests/unit/load-ts-module.mjs"

const { STARTER_LESSONS } = await loadTsModule("src/data/lessons.ts")
const { getLessonStepVersion, getLessonStepVersions } = await loadTsModule("src/lib/lesson-content-fingerprint.ts")
const { lessonStepToQuestion } = await loadTsModule("src/lib/lesson-session.ts")
const { makeQuestionResult, questionToMistakeInput, isQuestionAnswerCorrect } = await loadTsModule("src/lib/questions.ts")
const { normalizeMistakeList, buildMistakeId } = await loadTsModule("src/lib/mistake-notebook-model.ts")
const { enrollKnowledgeCard, isCurrentKnowledgeCard } = await loadTsModule("src/lib/knowledge-review-model.ts")
const { getModeMastery } = await loadTsModule("src/lib/assessment-evidence.ts")
const { STORAGE_KEYS } = await loadTsModule("src/lib/storage-keys.ts")
const audit = JSON.parse(fs.readFileSync(new URL("../tests/unit/sentence-build-audit-2026-09-10.json", import.meta.url), "utf8"))
const entry = audit.changed.find(r => r.before.id === "d63-build-kari")
const lesson = STARTER_LESSONS.find(l => l.id === entry.lessonId)
const step = lesson.steps.find(s => s.id === entry.before.id)
const previousLesson = { ...lesson, steps: lesson.steps.map(s => s.id === step.id ? entry.before : s) }
const oldAnswer = { answer: entry.before.answer, correct: true, createdAt: 100, questionVersion: getLessonStepVersion(entry.before) }
const stored = { lessonId: lesson.id, status: "completed", startedAt: 10, completedAt: 200, score: 75,
  completedStepVersions: getLessonStepVersions(previousLesson),
  stepAnswers: Object.fromEntries(lesson.steps.filter(s => "itemId" in s).map(s => [s.id, s.id === step.id ? oldAnswer : {
    answer: s.answer, correct: true, createdAt: 100, questionVersion: getLessonStepVersion(s),
  }])),
}
const oldQuestion = lessonStepToQuestion(entry.before)
const input = questionToMistakeInput(makeQuestionResult(oldQuestion, step.answer, 100))
assert.ok(input)
const oldMistakes = normalizeMistakeList([{ ...input, id: buildMistakeId(input), lastWrongAnswer: step.answer, wrongCount: 2, createdAt: 100, lastWrongAt: 100 }], 100)
const oldCards = enrollKnowledgeCard({}, oldQuestion, 100)
const oldItem = { itemId: step.itemId, itemType: step.itemType, recognition: 0, listening: 0, meaning: 0, recall: 100, production: 0,
  attempts: 6, correct: 6, updatedAt: 100, assessedModes: ["recall"], assessmentEvidence: { recall: { score: 100, attempts: 6, correct: 6 } } }
function order(chunks, answer, selected = []) {
  if (selected.length === chunks.length) return !answer ? selected : null
  for (let i = 0; i < chunks.length; i++) {
    if (selected.includes(i) || !answer.startsWith(chunks[i])) continue
    const result = order(chunks, answer.slice(chunks[i].length), [...selected, i])
    if (result) return result
  }
  return null
}
const base = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3218"
const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({ serviceWorkers: "block", viewport: { width: 390, height: 844 } })
  const page = await context.newPage()
  const errors = []
  page.on("pageerror", e => errors.push(e.message))
  await page.goto(base, { waitUntil: "networkidle" })
  await page.evaluate(({ keys, prior, stored, oldMistakes, oldCards, oldItem }) => {
    localStorage.setItem(keys.LESSON_PROGRESS, JSON.stringify({ ...Object.fromEntries(prior.map(id => [id, { lessonId: id, status: "completed", startedAt: 10, completedAt: 20 }])), [stored.lessonId]: stored }))
    localStorage.setItem(keys.MISTAKES, JSON.stringify(oldMistakes))
    localStorage.setItem(keys.SRS_MISTAKES, JSON.stringify({ [oldMistakes[0].id]: { box: 0, dueAt: 1, createdAt: 100, right: 0, wrong: 2 } }))
    localStorage.setItem(keys.KNOWLEDGE_REVIEWS, JSON.stringify(oldCards))
    localStorage.setItem(keys.ITEM_PROGRESS, JSON.stringify({ [oldItem.itemId]: oldItem }))
  }, { keys: STORAGE_KEYS, prior: STARTER_LESSONS.filter(l => l.order < lesson.order).map(l => l.id), stored, oldMistakes, oldCards, oldItem })
  await page.goto(`${base}/review`, { waitUntil: "networkidle" })
  await page.getByTestId("review-empty-state").waitFor()
  assert.equal(await page.getByTestId("review-due-state").count(), 0, "retired questions cannot count as due")
  const archive = page.getByTestId("retired-mistakes")
  await archive.locator("summary").click()
  assert.match(await archive.innerText(), /课程题目已修订/)
  console.log("Old sentence and mistake are retired.")
  await page.goto(`${base}/learn/${lesson.id}`, { waitUntil: "networkidle" })
  await page.getByTestId("lesson-resume-updates").click()
  await page.getByTestId("lesson-submit-sentence").waitFor()
  await page.reload({ waitUntil: "networkidle" })
  assert.equal(await page.getByTestId("lesson-submit-sentence").isDisabled(), true)
  assert.equal(await page.getByText("也接受的表达", { exact: false }).count(), 0, "no answer list before submission")
  const alternate = step.acceptedAnswers[0]
  for (const index of order(step.chunks, alternate)) await page.getByTestId(`lesson-sentence-chunk-${index}`).click()
  await page.getByTestId("lesson-submit-sentence").click()
  await page.getByText("答对了", { exact: true }).waitFor()
  await page.getByText("也接受的表达（1）", { exact: true }).click()
  assert.ok((await page.locator("li").allTextContents()).includes(alternate))
  await page.reload({ waitUntil: "networkidle" })
  await page.getByText("答对了", { exact: true }).waitFor()
  const savedItem = await page.evaluate(({ keys, id }) => JSON.parse(localStorage.getItem(keys.ITEM_PROGRESS))[id], { keys: STORAGE_KEYS, id: step.itemId })
  assert.equal(getModeMastery(savedItem, "recall"), 18)
  assert.equal(savedItem.assessmentEvidence.recall.attempts, 7)
  console.log("Alternate order accepted and persisted with current evidence.")
  await page.getByTestId("lesson-next").click()
  await page.getByRole("button", { name: "完成课程", exact: true }).click()
  await page.getByTestId("lesson-completed-summary").waitFor()
  const saved = await page.evaluate(({ keys, id }) => ({ lesson: JSON.parse(localStorage.getItem(keys.LESSON_PROGRESS))[id], mistakes: JSON.parse(localStorage.getItem(keys.MISTAKES)), cards: JSON.parse(localStorage.getItem(keys.KNOWLEDGE_REVIEWS)) }), { keys: STORAGE_KEYS, id: lesson.id })
  assert.equal(saved.lesson.completedAt, 200)
  assert.equal(saved.lesson.score, 75)
  assert.equal(saved.lesson.stepAnswers[step.id].answer, alternate)
  assert.deepEqual(saved.lesson.supersededAnswers[`${step.id}@${oldAnswer.questionVersion}`], oldAnswer)
  assert.equal(JSON.stringify(saved.mistakes), JSON.stringify(oldMistakes), "original serialized mistake records are preserved")
  assert.equal(Object.values(saved.cards).filter(isCurrentKnowledgeCard).length, 1)
  assert.equal(Object.values(saved.cards).length, 2)
  await page.evaluate(key => {
    const cards = JSON.parse(localStorage.getItem(key))
    for (const card of Object.values(cards)) card.srs.dueAt = 1
    localStorage.setItem(key, JSON.stringify(cards))
  }, STORAGE_KEYS.KNOWLEDGE_REVIEWS)
  await page.goto(`${base}/review`, { waitUntil: "networkidle" })
  assert.match(await page.getByTestId("review-due-state").innerText(), /1 张到期/)
  await page.getByTestId("review-start-today").click()
  await page.getByTestId("review-submit-sentence").waitFor()
  const tray = (await page.locator('[data-testid^="review-chunk-"]').allTextContents()).join("")
  assert.equal(isQuestionAnswerCorrect(lessonStepToQuestion(step), tray), false)
  for (const index of order(step.chunks, step.answer)) await page.getByTestId(`review-chunk-${index}`).click()
  await page.getByTestId("review-submit-sentence").click()
  await page.getByText("也接受的表达（1）", { exact: true }).waitFor()
  await page.getByTestId("review-next").click()
  await page.getByTestId("review-complete-state").waitFor()
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false)
  const final = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), STORAGE_KEYS.KNOWLEDGE_REVIEWS)
  assert.equal(Object.values(final).find(isCurrentKnowledgeCard).srs.right, 1)
  assert.equal(Object.values(final).find(card => !isCurrentKnowledgeCard(card)).srs.right, 0)
  assert.deepEqual(errors, [])
  await context.close()
  console.log("Sentence audit UI passed: real old lending error retired, alternate accepted, reload stable, first score preserved, current evidence 18, new review active and old records retained, 390px fits.")
} finally { await browser.close() }
