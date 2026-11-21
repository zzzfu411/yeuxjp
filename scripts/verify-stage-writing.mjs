import assert from "node:assert/strict"
import { chromium } from "playwright"
import { loadTsModule } from "../tests/unit/load-ts-module.mjs"
const { STAGE_WRITING_TASKS } = await loadTsModule("src/data/stage-writing-tasks.ts")
const { STORAGE_KEYS } = await loadTsModule("src/lib/storage-keys.ts")
const base = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3218"
const browser = await chromium.launch({ headless: true })
try {
  const page = await browser.newPage({ serviceWorkers: "block", viewport: { width: 390, height: 844 } })
  const errors = []
  page.on("pageerror", error => errors.push(error.message))
  for (const stage of STAGE_WRITING_TASKS) {
    await page.goto(`${base}/checkpoints/${stage.phase}`, { waitUntil: "networkidle" })
    assert.equal(await page.getByTestId("stage-passage").innerText(), stage.passage)
    assert.match(await page.getByTestId("stage-knowledge-evidence").innerText(), /当前本课测评达标 0\//)
    const editor = page.getByTestId("written-work")
    const draft = `${stage.title}：我已记录需要表达的事实、条件和自己的建议。`
    await editor.getByRole("textbox").fill(draft)
    await page.waitForFunction(({ key, id }) => Object.values(JSON.parse(localStorage.getItem(key) ?? "{}")).some(work => work.task.id === id), { key: STORAGE_KEYS.WRITTEN_WORKS, id: `stage:${stage.phase}` })
    for (let index = 0; index < stage.criteria.length; index++) {
      await editor.getByRole("checkbox").nth(index).check()
      await page.waitForFunction(({ key, id, count }) => Object.values(JSON.parse(localStorage.getItem(key))).some(work => work.task.id === id && work.checked.length === count), { key: STORAGE_KEYS.WRITTEN_WORKS, id: `stage:${stage.phase}`, count: index + 1 })
    }
    await editor.getByTestId("work-complete").click()
    await editor.getByText("已保存 · 已完成自查（本人确认）", { exact: true }).waitFor()
    await page.reload({ waitUntil: "networkidle" })
    assert.equal(await editor.getByRole("textbox").inputValue(), draft)
    assert.match(await page.getByTestId("stage-knowledge-evidence").innerText(), /当前本课测评达标 0\//)
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false)
  }
  assert.equal(await page.evaluate(key => localStorage.getItem(key), STORAGE_KEYS.ITEM_PROGRESS), null)
  await page.goto(`${base}/path`, { waitUntil: "networkidle" })
  await page.getByRole("link", { name: "阶段作品与自查 →" }).first().click()
  await page.getByTestId("stage-writing").waitFor()
  assert.deepEqual(errors, [])
  console.log("Stage writing passed: four independent materials, all rubrics and drafts reload, no automatic assessment score, phase entry and mobile layout.")
} finally { await browser.close() }
