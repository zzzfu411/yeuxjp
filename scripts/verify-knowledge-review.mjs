import assert from "node:assert/strict"
import { chromium } from "playwright"
import { loadTsModule } from "../tests/unit/load-ts-module.mjs"
const { STARTER_LESSONS } = await loadTsModule("src/data/lessons.ts")
const { grammarData } = await loadTsModule("src/data/grammar-data.ts")
const { STORAGE_KEYS } = await loadTsModule("src/lib/storage-keys.ts")
const base = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3218"
const grammar = Object.values(grammarData).flat().find(p => p.id === "n3-you-ni").practiceTemplates[0]
const lesson = STARTER_LESSONS.find(l => l.order === 4)
const stepIndex = lesson.steps.findIndex(s => s.type === "sentenceBuild")
const step = lesson.steps[stepIndex]
function chunkOrder(chunks, answer, selected = []) {
  if (selected.length === chunks.length) return answer === "" ? selected : null
  for (let i = 0; i < chunks.length; i++) {
    if (selected.includes(i) || !answer.startsWith(chunks[i])) continue
    const result = chunkOrder(chunks, answer.slice(chunks[i].length), [...selected, i])
    if (result) return result
  }
  return null
}
const order = chunkOrder(step.chunks, step.answer.replace(/[。.!！?？]/g, ""))
assert.ok(order)
const browser = await chromium.launch({ headless: true })
try {
  const page = await browser.newPage({ serviceWorkers: "block", viewport: { width: 390, height: 844 } })
  const errors = []
  page.on("pageerror", error => errors.push(error.message))
  await page.goto(`${base}/grammar?level=N3&item=n3-you-ni`, { waitUntil: "networkidle" })
  await page.getByTestId("grammar-practice-start").click()
  await page.locator('[data-testid^="grammar-practice-answer-"]').filter({ hasText: grammar.answer }).click()
  await page.getByTestId("grammar-practice-feedback").waitFor()
  await page.waitForFunction(key => Object.keys(JSON.parse(localStorage.getItem(key) ?? "{}")).length === 1, STORAGE_KEYS.KNOWLEDGE_REVIEWS)
  await page.evaluate(({ key, prior, lesson, stepIndex }) => {
    const entries = Object.fromEntries(prior.map(id => [id, { lessonId: id, status: "completed", startedAt: 10, completedAt: 20 }]))
    entries[lesson.id] = { lessonId: lesson.id, status: "started", startedAt: 30, currentStepIndex: stepIndex, lastStepId: lesson.steps[stepIndex].id }
    localStorage.setItem(key, JSON.stringify(entries))
  }, { key: STORAGE_KEYS.LESSON_PROGRESS, prior: STARTER_LESSONS.filter(l => l.order < 4).map(l => l.id), lesson, stepIndex })
  await page.goto(`${base}/learn/${lesson.id}`, { waitUntil: "networkidle" })
  for (const index of order) await page.locator('[data-testid^="lesson-sentence-chunk-"]').filter({ hasText: new RegExp(`^${step.chunks[index]}$`) }).filter({ visible: true }).first().click()
  await page.getByTestId("lesson-submit-sentence").click()
  await page.waitForFunction(key => Object.keys(JSON.parse(localStorage.getItem(key) ?? "{}")).length === 2, STORAGE_KEYS.KNOWLEDGE_REVIEWS)
  const initial = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), STORAGE_KEYS.KNOWLEDGE_REVIEWS)
  assert.ok(Object.values(initial).every(card => card.srs.dueAt > Date.now()))
  await page.goto(`${base}/review`, { waitUntil: "networkidle" })
  assert.match(await page.getByTestId("knowledge-review-deck").innerText(), /当前 2 题，0 题到期/)
  await page.evaluate(key => {
    const cards = JSON.parse(localStorage.getItem(key))
    for (const card of Object.values(cards)) card.srs.dueAt = 1
    localStorage.setItem(key, JSON.stringify(cards))
  }, STORAGE_KEYS.KNOWLEDGE_REVIEWS)
  await page.goto(base, { waitUntil: "networkidle" })
  assert.match(await page.locator(".home-review-companion").innerText(), /有 2 项到期/)
  await page.goto(`${base}/review`, { waitUntil: "networkidle" })
  assert.match(await page.getByTestId("review-due-state").innerText(), /2 张到期/)
  await page.getByTestId("review-start-today").click()
  await page.getByTestId(`review-answer-${grammar.answer}`).waitFor()
  assert.equal(await page.getByText("语法巩固", { exact: true }).count(), 1)
  await page.getByTestId(`review-answer-${grammar.answer}`).click()
  await page.getByTestId("review-next").click()
  await page.getByTestId("review-submit-sentence").waitFor()
  for (const index of order) await page.getByTestId(`review-chunk-${index}`).click()
  await page.getByTestId("review-submit-sentence").click()
  await page.getByTestId("review-next").click()
  await page.getByTestId("review-complete-state").waitFor()
  const final = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), STORAGE_KEYS.KNOWLEDGE_REVIEWS)
  assert.equal(Object.keys(final).length, 2)
  assert.ok(Object.values(final).every(card => card.srs.right === 1 && card.srs.dueAt > Date.now()))
  await page.goto(`${base}/review`, { waitUntil: "networkidle" })
  assert.match(await page.getByTestId("knowledge-review-deck").innerText(), /当前 2 题，0 题到期/)
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false)
  await page.evaluate(key => localStorage.setItem(key, '{"broken":true}'), STORAGE_KEYS.KNOWLEDGE_REVIEWS)
  await page.reload({ waitUntil: "networkidle" })
  await page.getByTestId("knowledge-review-deck").getByRole("alert").waitFor()
  assert.equal(await page.evaluate(key => localStorage.getItem(key), STORAGE_KEYS.KNOWLEDGE_REVIEWS), '{"broken":true}')
  assert.deepEqual(errors, [])
  console.log("Knowledge review UI passed: real correct grammar and sentence answers enroll, home/today counts match, assembly retained, grading and reload schedule correctly.")
} finally { await browser.close() }
