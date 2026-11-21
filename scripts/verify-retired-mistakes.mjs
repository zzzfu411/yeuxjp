import assert from "node:assert/strict"
import { chromium } from "playwright"
import { loadTsModule } from "../tests/unit/load-ts-module.mjs"
const { STORAGE_KEYS } = await loadTsModule("src/lib/storage-keys.ts")
const { normalizeMistakeList } = await loadTsModule("src/lib/mistake-notebook-model.ts")
const base = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3218"
const retired = { id: "old-homophone", type: "audio-kana", itemId: "hiragana:ji", itemType: "kana", mode: "listening",
  questionAudio: "じ", correctAnswer: "ji", lastWrongAnswer: "di", options: [{ value: "ji", display: "じ" }, { value: "di", display: "ぢ" }],
  wrongCount: 3, createdAt: 10, lastWrongAt: 20 }
const active = { ...retired, id: "valid-kana", questionAudio: "か", itemId: "hiragana:ka", correctAnswer: "ka", lastWrongAnswer: "ki",
  options: [{ value: "ka", display: "か" }, { value: "ki", display: "き" }] }
const mistakes = JSON.stringify(normalizeMistakeList([retired, active]))
const srs = JSON.stringify(Object.fromEntries([retired, active].map(item => [item.id, { box: 0, dueAt: 1, createdAt: 1, right: 0, wrong: 3 }])))
const browser = await chromium.launch({ headless: true })
try {
  const page = await browser.newPage({ serviceWorkers: "block" })
  const errors = []
  page.on("pageerror", error => errors.push(error.message))
  await page.goto(`${base}/review`, { waitUntil: "networkidle" })
  await page.evaluate(({ keys, mistakes, srs }) => {
    localStorage.setItem(keys.MISTAKES, mistakes)
    localStorage.setItem(keys.SRS_MISTAKES, srs)
  }, { keys: STORAGE_KEYS, mistakes, srs })
  await page.reload({ waitUntil: "networkidle" })
  assert.match(await page.getByTestId("review-due-state").innerText(), /1 张到期/)
  const archive = page.getByTestId("retired-mistakes")
  await archive.locator("summary").click()
  assert.match(await archive.innerText(), /同音假名/)
  assert.match(await archive.innerText(), /当时作答：di/)
  await page.getByTestId("review-start-today").click()
  await page.getByTestId("review-answer-ka").waitFor()
  await page.getByTestId("review-answer-ka").click()
  await page.waitForFunction(key => JSON.parse(localStorage.getItem(key))["valid-kana"].right === 1, STORAGE_KEYS.SRS_MISTAKES)
  const stored = await page.evaluate(keys => ({ mistakes: localStorage.getItem(keys.MISTAKES), srs: JSON.parse(localStorage.getItem(keys.SRS_MISTAKES)) }), STORAGE_KEYS)
  assert.equal(stored.mistakes, mistakes, "correct review must not rewrite either original snapshot")
  assert.equal(stored.srs[retired.id].wrong, 3)
  assert.equal(stored.srs[retired.id].dueAt, 1)
  assert.equal(stored.srs[active.id].right, 1)
  await page.goto(`${base}/review`, { waitUntil: "networkidle" })
  await page.getByTestId("review-scheduled-empty-state").waitFor()
  assert.match(await page.getByTestId("review-scheduled-empty-state").innerText(), /0 张到期/)
  assert.match(await page.getByTestId("retired-mistakes").locator("summary").innerText(), /（1）/)
  assert.deepEqual(errors, [])
  console.log("Retired mistake UI passed: only valid item due, obsolete snapshot and schedule preserved, reload does not re-enroll it.")
} finally { await browser.close() }
