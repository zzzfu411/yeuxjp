import assert from "node:assert/strict"
import { chromium } from "playwright"
import { loadTsModule } from "../tests/unit/load-ts-module.mjs"
const { STORAGE_KEYS } = await loadTsModule("src/lib/storage-keys.ts")
const base = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3218"
const browser = await chromium.launch({ headless: true })
try {
  const page = await browser.newPage({ serviceWorkers: "block" })
  await page.goto(base, { waitUntil: "networkidle" })
  await page.evaluate(keys => {
    const cards = [
      { id: "audio", type: "audio-kana", itemId: "hiragana:ka", itemType: "kana", mode: "listening", questionAudio: "か", correctAnswer: "ka", options: [{ value: "ka", display: "か" }, { value: "ki", display: "き" }] },
      { id: "grammar", type: "particle", itemId: "particle:は:私は学生です。", itemType: "grammar", mode: "recognition", questionText: "私___学生です。", questionAudio: "私は学生です。", correctAnswer: "は", explanation: "答案是 は，标记主题。", options: [{ value: "は", display: "は" }, { value: "を", display: "を" }] },
    ].map((card, i) => ({ ...card, wrongCount: 1, createdAt: 1, lastWrongAt: 3 - i }))
    localStorage.setItem(keys.MISTAKES, JSON.stringify(cards))
    localStorage.setItem(keys.SRS_MISTAKES, JSON.stringify(Object.fromEntries(cards.map((card, i) => [card.id, { box: 0, dueAt: 1 + i, createdAt: 1, right: 0, wrong: 1 }]))))
  }, STORAGE_KEYS)
  await page.goto(`${base}/review`, { waitUntil: "networkidle" })
  await page.getByTestId("review-start-today").click()
  await page.getByTestId("review-answer-ka").waitFor()
  assert.match(await page.locator("section.paper-sheet").innerText(), /听音作答/)
  assert.doesNotMatch(await page.locator("section.paper-sheet").innerText(), /か/)
  await page.getByTestId("review-answer-ka").click()
  await page.getByTestId("review-next").click()
  await page.getByTestId("review-answer-は").waitFor()
  assert.doesNotMatch(await page.locator("section.paper-sheet").innerText(), /答案是|标记主题/)
  assert.equal(await page.getByRole("button", { name: "播放复习音频" }).count(), 0)
  await page.getByTestId("review-answer-は").click()
  await page.getByText("答案是 は，标记主题。", { exact: true }).waitFor()
  console.log("Review prompt UI passed: target glyph and explanations hidden before answering, non-listening filled audio unavailable, explanation appears in feedback.")
} finally { await browser.close() }
