import assert from "node:assert/strict"
import { chromium } from "playwright"
import { loadTsModule } from "../tests/unit/load-ts-module.mjs"
const { STARTER_LESSONS } = await loadTsModule("src/data/lessons.ts")
const { STORAGE_KEYS } = await loadTsModule("src/lib/storage-keys.ts")
const { lessonStepToQuestion } = await loadTsModule("src/lib/lesson-session.ts")
const { enrollKnowledgeCard } = await loadTsModule("src/lib/knowledge-review-model.ts")
const { upsertWrongMistake } = await loadTsModule("src/lib/mistake-notebook-model.ts")
const { questionToMistakeInput, makeQuestionResult } = await loadTsModule("src/lib/questions.ts")
const { createSrsState } = await loadTsModule("src/lib/srs-model.ts")
const lesson = STARTER_LESSONS.find(lesson => lesson.order === 4)
const assembly = lesson.steps.find(step => step.type === "sentenceBuild")
const comprehension = lesson.steps.find(step => step.type === "multipleChoice" && step.itemType === "sentence")
const q1 = lessonStepToQuestion(assembly), q2 = lessonStepToQuestion(comprehension)
const now = Date.now()
const knowledge = enrollKnowledgeCard({}, q1, now)
const mistakes = upsertWrongMistake([], questionToMistakeInput(makeQuestionResult(q2, "wrong", now)), now)
const progress = Object.fromEntries(STARTER_LESSONS.filter(item => item.order <= 4).map(item => [item.id,
  { lessonId: item.id, status: "completed", startedAt: 1, completedAt: 2 }]))
progress[lesson.id].stepAnswers = {
  [assembly.id]: { correct: true, answer: q1.correctAnswer, questionVersion: q1.questionVersion, createdAt: now },
  [comprehension.id]: { correct: false, answer: "wrong", questionVersion: q2.questionVersion, createdAt: now },
}
const base = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3218"
const browser = await chromium.launch({ headless: true })
try {
  const page = await browser.newPage({ serviceWorkers: "block", viewport: { width: 390, height: 844 } })
  const errors = []
  page.on("pageerror", error => errors.push(error.message))
  await page.goto(base, { waitUntil: "networkidle" })
  await page.evaluate(({ keys, progress, knowledge, mistakes, srs }) => {
    localStorage.setItem(keys.LESSON_PROGRESS, JSON.stringify(progress))
    localStorage.setItem(keys.KNOWLEDGE_REVIEWS, JSON.stringify(knowledge))
    localStorage.setItem(keys.MISTAKES, JSON.stringify(mistakes))
    localStorage.setItem(keys.SRS_MISTAKES, JSON.stringify(srs))
  }, { keys: STORAGE_KEYS, progress, knowledge, mistakes, srs: { [mistakes[0].id]: { ...createSrsState(now), dueAt: 1 } } })
  await page.goto(`${base}/learn/${lesson.id}`, { waitUntil: "networkidle" })
  const summary = page.getByTestId("lesson-review-summary")
  await summary.waitFor()
  await summary.locator("summary").click()
  assert.match(await summary.locator(`[data-review-step="${assembly.id}"]`).innerText(), /本课已独立答对[\s\S]*已安排/)
  assert.match(await summary.locator(`[data-review-step="${comprehension.id}"]`).innerText(), /本课仍需独立答对[\s\S]*错题复习 · 已到期/)
  assert.match(await summary.innerText(), /本课仅接触，未单独测评|本课当前版本未测/)
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false)
  await page.reload({ waitUntil: "networkidle" })
  await summary.locator("summary").click()
  assert.match(await summary.locator(`[data-review-step="${assembly.id}"]`).innerText(), /本课已独立答对/)
  assert.equal(await page.evaluate(key => localStorage.getItem(key), STORAGE_KEYS.KNOWLEDGE_REVIEWS), JSON.stringify(knowledge))
  await summary.getByRole("link", { name: "进入到期复习" }).click()
  await page.waitForURL(`${base}/review#knowledge-review-deck`)
  await page.getByTestId("knowledge-review-deck").waitFor()
  await page.evaluate(key => localStorage.setItem(key, '{"bad":true}'), STORAGE_KEYS.KNOWLEDGE_REVIEWS)
  await page.goto(`${base}/learn/${lesson.id}`, { waitUntil: "networkidle" })
  await page.getByTestId("lesson-review-summary-error").waitFor()
  assert.equal(await page.getByTestId("lesson-review-summary").count(), 0)
  assert.equal(await page.evaluate(key => localStorage.getItem(key), STORAGE_KEYS.KNOWLEDGE_REVIEWS), '{"bad":true}')
  assert.deepEqual(errors, [])
  console.log("Lesson review recap passed: correct, unmeasured and reference-only rows; scheduled knowledge and due mistakes; navigation, reload, mobile layout and corrupt-data protection.")
} finally { await browser.close() }
