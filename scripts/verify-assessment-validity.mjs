import assert from "node:assert/strict"
import { chromium } from "playwright"
import { loadTsModule } from "../tests/unit/load-ts-module.mjs"

const base = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3218"
const { STORAGE_KEYS } = await loadTsModule("src/lib/storage-keys.ts")
const { STARTER_LESSONS } = await loadTsModule("src/data/lessons.ts")
const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({ serviceWorkers: "block" })
  const page = await context.newPage()
  await page.goto(`${base}/grammar?level=N3&item=n3-you-ni`, { waitUntil: "networkidle" })
  const rounds = []
  for (let round = 0; round < 5; round++) {
    await page.getByTestId(round ? "grammar-practice-restart" : "grammar-practice-start").click()
    const options = page.locator('[data-testid^="grammar-practice-answer-"]')
    rounds.push(await options.allTextContents())
    for (let question = 0; question < 2; question++) {
      const before = await options.allTextContents()
      await options.first().click()
      await page.getByTestId("grammar-practice-feedback").waitFor()
      const after = await options.allTextContents()
      assert.deepEqual(after, before, "answering must not reorder options")
      await page.getByTestId("grammar-practice-next").click()
    }
    await page.getByTestId("grammar-practice-summary").waitFor()
  }
  assert.ok(new Set(rounds.map(JSON.stringify)).size > 1, "restart changes the ordering")
  await page.evaluate(key => localStorage.setItem(key, JSON.stringify({
    "day-1-a-row-hello": { lessonId: "day-1-a-row-hello", status: "completed", startedAt: Date.now(), completedAt: Date.now(), score: 0 },
  })), STORAGE_KEYS.LESSON_PROGRESS)
  await page.goto(`${base}/learn/day-2-ka-row-thanks`, { waitUntil: "networkidle" })
  for (const step of STARTER_LESSONS[1].steps) {
    if (step.id === "listen-ki") break
    if (step.type === "multipleChoice") await page.getByRole("button", { name: step.answer, exact: true }).click()
    if (step.type === "typing" || step.type === "dictation") {
      await page.getByTestId("lesson-typing-input").fill(step.answer)
      await page.getByTestId("lesson-submit-typing").click()
    }
    await page.getByTestId("lesson-next").click()
  }
  assert.equal(await page.locator('section[aria-label="课程内容"] h2').innerText(), "听音选择")
  await context.close()
  console.log("Assessment UI passed: stable options while answering, fresh ordering on restart, neutral listening title.")
} finally { await browser.close() }
