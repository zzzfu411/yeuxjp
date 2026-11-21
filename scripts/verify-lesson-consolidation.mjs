import assert from "node:assert/strict"
import { chromium } from "playwright"
import { loadTsModule } from "../tests/unit/load-ts-module.mjs"
const { STARTER_LESSONS } = await loadTsModule("src/data/lessons.ts")
const { getLessonStepVersion } = await loadTsModule("src/lib/lesson-content-fingerprint.ts")
const { STORAGE_KEYS } = await loadTsModule("src/lib/storage-keys.ts")
const base = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3218"
const lesson = STARTER_LESSONS[0]
const steps = lesson.steps.filter(step => "itemId" in step)
const target = steps.find(step => step.type === "multipleChoice")
const answers = Object.fromEntries(steps.map(step => [step.id, {
  answer: step.answer, correct: false, createdAt: 100, questionVersion: getLessonStepVersion(step),
}]))
const stored = { lessonId: lesson.id, status: "completed", startedAt: 10, completedAt: 90, score: 0, stepAnswers: answers }
const browser = await chromium.launch({ headless: true })
try {
  const page = await browser.newPage({ serviceWorkers: "block", viewport: { width: 390, height: 844 } })
  const errors = []
  page.on("pageerror", error => errors.push(error.message))
  await page.goto(base, { waitUntil: "networkidle" })
  await page.evaluate(({ key, id, value }) => localStorage.setItem(key, JSON.stringify({ [id]: value })),
    { key: STORAGE_KEYS.LESSON_PROGRESS, id: lesson.id, value: stored })
  await page.reload({ waitUntil: "networkidle" })
  const href = `/learn/${lesson.id}#lesson-consolidation`
  assert.equal(await page.getByTestId("home-start-learning").getAttribute("href"), href)
  assert.match(await page.locator(".vn-lesson-description").innerText(), /0%/)
  await page.goto(`${base}/path`, { waitUntil: "networkidle" })
  assert.equal(await page.getByTestId("path-next-learning").getAttribute("href"), href)
  assert.match(await page.getByTestId(`course-assessment-${lesson.id}`).innerText(), /需巩固/)
  assert.ok(await page.locator(`a[href="/learn/${STARTER_LESSONS[1].id}"]`).count() > 0)
  // A later partial retry has one remaining error, despite the historical first score still being zero.
  for (const step of steps) if (step.id !== target.id) answers[step.id].correct = true
  await page.evaluate(({ key, id, value }) => localStorage.setItem(key, JSON.stringify({ [id]: value })),
    { key: STORAGE_KEYS.LESSON_PROGRESS, id: lesson.id, value: stored })
  await page.goto(`${base}${href}`, { waitUntil: "networkidle" })
  assert.equal(await page.getByTestId("lesson-consolidation").locator("li").count(), 1)
  await page.getByTestId("lesson-consolidation-start").click()
  await page.getByTestId(`lesson-answer-${target.answer}`).waitFor()
  await page.reload({ waitUntil: "networkidle" })
  assert.equal(await page.getByTestId(`lesson-answer-${target.answer}`).isEnabled(), true)
  await page.getByTestId(`lesson-answer-${target.answer}`).click()
  await page.getByTestId("lesson-next").click()
  await page.getByRole("button", { name: "完成课程", exact: true }).click()
  await page.getByTestId("lesson-completed-summary").waitFor()
  assert.match(await page.getByTestId("lesson-consolidation").innerText(), /本课测评达标/)
  assert.equal(await page.getByTestId("lesson-consolidation-start").count(), 0)
  const saved = await page.evaluate(({ key, id }) => JSON.parse(localStorage.getItem(key))[id],
    { key: STORAGE_KEYS.LESSON_PROGRESS, id: lesson.id })
  assert.equal(saved.completedAt, 90)
  assert.equal(saved.score, 0)
  assert.equal(saved.attemptScore, 100)
  assert.equal(saved.stepAnswers[target.id].correct, true)
  assert.ok(Object.values(saved.supersededAnswers).some(answer => answer.correct === false))
  await page.goto(base, { waitUntil: "networkidle" })
  assert.equal(await page.getByTestId("home-start-learning").getAttribute("href"), `/learn/${STARTER_LESSONS[1].id}`)
  await page.goto(`${base}/path`, { waitUntil: "networkidle" })
  assert.match(await page.getByTestId(`course-assessment-${lesson.id}`).innerText(), /本课测评达标/)
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false)
  assert.deepEqual(errors, [])
  console.log("Course consolidation passed: zero-score recommendation, next-course access, targeted retry, reload, evidence update and first-score preservation.")
} finally { await browser.close() }
