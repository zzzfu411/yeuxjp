import assert from "node:assert/strict"
import { chromium } from "playwright"
import { loadTsModule } from "../tests/unit/load-ts-module.mjs"
const { GRAMMAR_REVIEW_FAMILIES, COMPREHENSION_REVIEW_FAMILIES } = await loadTsModule("src/data/knowledge-review-variants.ts")
const { getKnowledgeReviewVariant } = await loadTsModule("src/lib/knowledge-review-variant.ts")
const { STARTER_LESSONS } = await loadTsModule("src/data/lessons.ts")
const { lessonStepToQuestion } = await loadTsModule("src/lib/lesson-session.ts")
const { enrollKnowledgeCard } = await loadTsModule("src/lib/knowledge-review-model.ts")
const { STORAGE_KEYS } = await loadTsModule("src/lib/storage-keys.ts")
const now = Date.now()
const sentence = STARTER_LESSONS.find(lesson => lesson.order === 4).steps.find(step => step.type === "sentenceBuild")
const comprehension = Object.values(COMPREHENSION_REVIEW_FAMILIES).find(pool => pool[0].mode !== "listening")[0]
const questions = [GRAMMAR_REVIEW_FAMILIES["n5-wa"][0], lessonStepToQuestion(sentence), comprehension]
let cards = {}
for (const question of questions) cards = enrollKnowledgeCard(cards, question, now - 5 * 86400000)
for (const card of Object.values(cards)) card.srs = { ...card.srs, dueAt: now - 60000, lastReviewedAt: now - 86400000,
  box: card.question.chunks ? 3 : 2, right: card.question.chunks ? 2 : 1 }
const variants = Object.values(cards).map(card => getKnowledgeReviewVariant(card, card.srs, now))
assert.deepEqual(variants.map(variant => variant.kind), ["grammar", "recall-input", "comprehension"])
const base = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3218"
const browser = await chromium.launch({ headless: true })
try {
  const page = await browser.newPage({ serviceWorkers: "block", viewport: { width: 390, height: 844 } })
  const errors = []
  page.on("pageerror", error => errors.push(error.message))
  await page.goto(base, { waitUntil: "networkidle" })
  await page.evaluate(({ key, cards }) => localStorage.setItem(key, JSON.stringify(cards)), { key: STORAGE_KEYS.KNOWLEDGE_REVIEWS, cards })
  await page.goto(`${base}/review?limit=3`, { waitUntil: "networkidle" })
  await page.getByTestId("review-start-today").click()
  for (const variant of variants) {
    await page.getByText(variant.note, { exact: true }).waitFor()
    const prompt = page.locator(".font-jp.text-4xl")
    assert.equal(await prompt.innerText(), variant.prompt)
    if (variant.kind === "recall-input") {
      assert.equal(await page.locator('[data-testid^="review-chunk-"]').count(), 0)
      await page.getByTestId("review-typed-answer").fill(variant.question.correctAnswer)
      await page.getByTestId("review-typed-submit").click()
    } else await page.getByTestId(`review-answer-${variant.question.correctAnswer}`).click()
    await page.getByTestId("review-next").waitFor()
    assert.equal(await prompt.innerText(), variant.prompt, "feedback must keep the original presentation after SRS grading")
    await page.getByTestId("review-next").click()
  }
  await page.getByTestId("review-complete-state").waitFor()
  const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), STORAGE_KEYS.KNOWLEDGE_REVIEWS)
  assert.equal(Object.keys(saved).length, 3)
  for (const [id, card] of Object.entries(saved)) {
    assert.equal(card.srs.right, cards[id].srs.right + 1)
    assert.ok(card.srs.dueAt > now)
    assert.deepEqual(card.question, JSON.parse(JSON.stringify(cards[id].question)))
  }
  const items = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), STORAGE_KEYS.ITEM_PROGRESS)
  assert.equal(items[sentence.itemId].outputEvidence, undefined)
  assert.equal(await page.evaluate(key => localStorage.getItem(key), STORAGE_KEYS.LESSON_PROGRESS), null)
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false)
  await page.reload({ waitUntil: "networkidle" })
  assert.match(await page.getByTestId("knowledge-review-deck").innerText(), /当前 3 题，0 题到期/)
  assert.deepEqual(errors, [])
  console.log("Knowledge variants passed: grammar examples, shared-material comprehension, unaided sentence recall, stable feedback, unchanged source cards, SRS persistence and no fabricated output/course completion.")
  console.log(JSON.stringify({ grammarPoints: Object.keys(GRAMMAR_REVIEW_FAMILIES).length, comprehensionFamilies: Object.keys(COMPREHENSION_REVIEW_FAMILIES).length,
    comprehensionQuestions: Object.values(COMPREHENSION_REVIEW_FAMILIES).reduce((sum, pool) => sum + pool.length, 0),
    sentenceBuildQuestions: STARTER_LESSONS.flatMap(lesson => lesson.steps).filter(step => step.type === "sentenceBuild").length }))
} finally { await browser.close() }
