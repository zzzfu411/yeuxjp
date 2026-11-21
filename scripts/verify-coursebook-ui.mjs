import assert from "node:assert/strict"
import fs from "node:fs"
import { loadTsModule } from "../tests/unit/load-ts-module.mjs"

export async function verifyCoursebookUi(browser, baseUrl) {
  const { STARTER_LESSONS } = await loadTsModule("src/data/lessons.ts")
  const { STORAGE_KEYS } = await loadTsModule("src/lib/storage-keys.ts")
  const out = `${process.env.UI_EVIDENCE_DIR ?? "output/playwright/course-20260908"}/coursebook`
  fs.mkdirSync(out, { recursive: true })
  const records = []
  const context = await browser.newContext({ serviceWorkers: "block" })
  const page = await context.newPage()
  try {
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      for (const order of [1, 2, 46, 91, 136, 175]) {
        const lesson = STARTER_LESSONS[order - 1]
        await page.goto(`${baseUrl}/learn/${lesson.id}`, { waitUntil: "networkidle" })
        const instruction = page.locator('[data-testid="coursebook-instruction"]')
        await instruction.waitFor()
        assert.ok((await instruction.innerText()).includes(lesson.study.goal))
        await page.getByRole("button", { name: /^(继续|继续预览)$/ }).click()
        const reader = page.locator('[data-testid="coursebook-reading"]')
        await reader.waitFor()
        assert.equal(await reader.getByTestId("coursebook-dialogue").getAttribute("open") !== null, (order - 1) % 5 === 0)
        assert.equal(await reader.getByTestId("coursebook-passage").getAttribute("open"), null)
        assert.equal(await reader.getByTestId("coursebook-words").getAttribute("open"), null)
        assert.equal(await reader.getByTestId("coursebook-dialogue-translation").count(), 0)
        assert.equal(await reader.getByTestId("coursebook-passage-translation").count(), 0)
        assert.equal(await reader.locator('button[aria-label^="朗读第 "]').count(), 4)
        await reader.getByTestId("coursebook-passage").locator("summary").click()
        assert.equal(await reader.getByText(lesson.study.reading, { exact: true }).isVisible(), true)
        await reader.getByTestId("coursebook-translation-toggle").click()
        assert.equal(await reader.getByTestId("coursebook-translation-toggle").getAttribute("aria-pressed"), "true")
        assert.ok((await reader.innerText()).includes(lesson.study.translation))
        assert.equal(await reader.getByTestId("coursebook-dialogue-translation").count(), 4)
        await reader.getByTestId("coursebook-translation-toggle").click()
        assert.equal(await reader.getByTestId("coursebook-passage-translation").count(), 0)
        assert.equal(await reader.getByText(lesson.study.reading, { exact: true }).isVisible(), true)
        const dimensions = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }))
        assert.ok(dimensions.scrollWidth <= width + 1, `Course ${order} overflows at ${width}`)
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }))
        await page.screenshot({ path: `${out}/${width}-lesson-${order}-reading.png`, fullPage: true })
        records.push({ order, ...dimensions, readingCharacters: lesson.study.reading.length })
        await page.evaluate(() => localStorage.clear())
      }
    }
    // A new listening question remains answerable and persists independently of old lesson answers.
    const lesson = STARTER_LESSONS[1]
    await page.goto(baseUrl, { waitUntil: "networkidle" })
    await page.evaluate(({ key, firstId, secondId, stepId }) => {
      const now = Date.now()
      localStorage.setItem(key, JSON.stringify({
        [firstId]: { lessonId: firstId, status: "completed", startedAt: now - 1000, completedAt: now - 500, updatedAt: now, score: 100 },
        [secondId]: { lessonId: secondId, status: "started", startedAt: now, updatedAt: now, lastStepId: stepId },
      }))
    }, { key: STORAGE_KEYS.LESSON_PROGRESS, firstId: STARTER_LESSONS[0].id, secondId: lesson.id, stepId: lesson.steps.at(-2).id })
    await page.goto(`${baseUrl}/learn/${lesson.id}`, { waitUntil: "networkidle" })
    await page.getByRole("heading", { name: "情境听解：抓住关键信息", exact: true }).waitFor()
    assert.equal(await page.getByText(lesson.study.reading, { exact: true }).count(), 0)
    await page.getByRole("button", { name: "播放题目", exact: true }).waitFor()
    await page.getByRole("button", { name: lesson.steps.at(-2).answer, exact: true }).click()
    await page.getByRole("button", { name: "继续", exact: true }).click()
    const production = page.locator('[data-testid="coursebook-production"]')
    await production.waitFor()
    assert.ok((await production.innerText()).includes(lesson.study.task))
    assert.equal(await production.getByText(lesson.study.model, { exact: true }).isVisible(), false)
    await production.getByText("查看表达示范", { exact: true }).click()
    assert.equal(await production.getByText(lesson.study.model, { exact: true }).isVisible(), true)
    const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key) ?? "{}"), STORAGE_KEYS.LESSON_PROGRESS)
    assert.equal(saved[lesson.id].stepAnswers[lesson.steps.at(-2).id].correct, true)
    fs.writeFileSync(`${out}/report.json`, JSON.stringify({ views: records, listeningSaved: true, productionDisclosure: true }, null, 2))
    console.log(`Coursebook UI passed: ${records.length} reading views, listening persistence, and production self-check.`)
  } finally { await context.close() }
}
