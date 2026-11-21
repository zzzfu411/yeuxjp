import assert from "node:assert/strict"
import { chromium } from "playwright"
import { loadTsModule } from "../tests/unit/load-ts-module.mjs"
const { STORAGE_KEYS } = await loadTsModule("src/lib/storage-keys.ts")
const { STARTER_LESSONS } = await loadTsModule("src/data/lessons.ts")
const { getCourseVocabularyIds, courseVocabularyHref } = await loadTsModule("src/lib/course-vocabulary.ts")
const base = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3218"
const lesson = STARTER_LESSONS[0]
const id = getCourseVocabularyIds(lesson)[0]
const browser = await chromium.launch({ headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" })
  const errors = []
  page.on("pageerror", e => errors.push(e.message))
  await page.goto(`${base}${courseVocabularyHref(lesson)}`, { waitUntil: "networkidle" })
  await page.getByTestId("course-vocab-untested").waitFor()
  assert.match(await page.getByTestId("course-vocab-counts").innerText(), /共 1 词 · 已接触 0 · 尚未测评 1 · 到期 0/)
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false)
  await page.getByTestId("course-vocab-untested").click()
  await page.getByTestId(`review-answer-${id}`).click()
  await page.getByTestId("review-next").waitFor()
  await page.getByTestId("review-next").click()
  await page.getByTestId("review-complete-state").waitFor()
  await page.getByRole("button", { name: "返回复习", exact: true }).click()
  assert.match(await page.getByTestId("course-vocab-counts").innerText(), /尚未测评 0/)
  const stored = await page.evaluate(keys => ({ items: JSON.parse(localStorage.getItem(keys.ITEM_PROGRESS)),
    srs: JSON.parse(localStorage.getItem(keys.SRS_VOCAB)), results: JSON.parse(localStorage.getItem(keys.PRACTICE_RESULTS)) }), STORAGE_KEYS)
  assert.deepEqual(Object.keys(stored.items), [id])
  assert.equal(stored.results.length, 1)
  assert.equal(stored.srs[id].right, 1)
  assert.ok(stored.srs[id].dueAt > Date.now())
  await page.reload({ waitUntil: "networkidle" })
  await page.getByTestId("course-vocab-counts").waitFor()
  assert.match(await page.getByTestId("course-vocab-counts").innerText(), /尚未测评 0/)
  const mixed = STARTER_LESSONS.find(l => l.id === "day-46-n4-tara")
  await page.goto(`${base}${courseVocabularyHref(mixed)}`, { waitUntil: "networkidle" })
  await page.getByTestId("course-vocab-list").waitFor()
  assert.deepEqual(await page.locator('[data-vocab-id]').evaluateAll(rows => rows.map(row => row.getAttribute("data-vocab-id"))), getCourseVocabularyIds(mixed))
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false)
  assert.deepEqual(errors, [])
  console.log("Course vocabulary UI passed: exact mixed-level scope, untested -> assessed, first SRS enrollment, refresh persistence, mobile width.")
} finally { await browser.close() }
