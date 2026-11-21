import assert from "node:assert/strict"
import { chromium } from "playwright"
import { loadTsModule } from "../tests/unit/load-ts-module.mjs"
const { STARTER_LESSONS } = await loadTsModule("src/data/lessons.ts")
const { getLessonStepVersion, getLessonStepVersions, getLessonContentVersion } = await loadTsModule("src/lib/lesson-content-fingerprint.ts")
const { STORAGE_KEYS } = await loadTsModule("src/lib/storage-keys.ts")
const base = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3218"
const lesson = STARTER_LESSONS[0]
const step = lesson.steps.find(s => s.id === "recognize-a")
const legacyVersion = "v1-0000000000000000"
const stepAnswers = Object.fromEntries(lesson.steps.filter(s => "itemId" in s).map(s => [s.id, {
  answer: s.answer, correct: true, createdAt: 100, questionVersion: s.id === step.id ? legacyVersion : getLessonStepVersion(s),
}]))
const stored = { lessonId: lesson.id, status: "completed", startedAt: 10, completedAt: 90, score: 75,
  completedStepVersions: { ...getLessonStepVersions(lesson), [step.id]: legacyVersion }, stepAnswers }
const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({ serviceWorkers: "block" })
  const page = await context.newPage()
  const errors = []
  page.on("pageerror", e => errors.push(String(e)))
  await page.goto(base, { waitUntil: "networkidle" })
  await page.evaluate(({ key, id, value }) => localStorage.setItem(key, JSON.stringify({ [id]: value })),
    { key: STORAGE_KEYS.LESSON_PROGRESS, id: lesson.id, value: stored })
  await page.goto(`${base}/learn/${lesson.id}`, { waitUntil: "networkidle" })
  const updates = page.getByTestId("lesson-content-updates")
  await updates.waitFor()
  assert.equal(await updates.locator("li").count(), 1)
  await page.getByTestId("lesson-resume-updates").click()
  await page.getByTestId(`lesson-answer-${step.answer}`).waitFor()
  assert.equal(await page.getByTestId(`lesson-answer-${step.answer}`).isEnabled(), true)
  // The selected update and fresh attempt must survive reload before answering.
  await page.reload({ waitUntil: "networkidle" })
  assert.equal(await page.getByTestId(`lesson-answer-${step.answer}`).isEnabled(), true)
  await page.getByTestId(`lesson-answer-${step.answer}`).click()
  await page.getByTestId("lesson-next").click()
  await page.getByRole("button", { name: "完成课程", exact: true }).click()
  await page.getByTestId("lesson-completed-summary").waitFor()
  assert.equal(await page.getByTestId("lesson-content-updates").count(), 0)
  const saved = await page.evaluate(({ key, id }) => JSON.parse(localStorage.getItem(key))[id],
    { key: STORAGE_KEYS.LESSON_PROGRESS, id: lesson.id })
  assert.equal(saved.completedAt, 90)
  assert.equal(saved.score, 75)
  assert.equal(saved.attemptScore, 100)
  assert.equal(saved.completedContentVersion, getLessonContentVersion(lesson))
  assert.equal(saved.supersededAnswers[`${step.id}@${legacyVersion}`].answer, step.answer)
  assert.equal(saved.stepAnswers[step.id].questionVersion, getLessonStepVersion(step))
  assert.deepEqual(errors, [])
  await context.close()
  console.log("Content updates passed: revised answer unlocked, reload restored update attempt, unchanged content skipped, first score and superseded answer preserved.")
} finally { await browser.close() }
