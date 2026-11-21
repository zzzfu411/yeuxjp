import assert from "node:assert/strict"
import { chromium } from "playwright"
import { loadTsModule } from "../tests/unit/load-ts-module.mjs"
const { STARTER_LESSONS } = await loadTsModule("src/data/lessons.ts")
const { STORAGE_KEYS, LEARNING_WRITE_EPOCH_KEY } = await loadTsModule("src/lib/storage-keys.ts")
const { LEARNING_WRITE_LOCK_NAME } = await loadTsModule("src/lib/learning-write-lock.ts")
const base = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3218"
const lesson = STARTER_LESSONS[0]
const browser = await chromium.launch({ headless: true })
try {
  const page = await browser.newPage({ serviceWorkers: "block", viewport: { width: 390, height: 844 } })
  const errors = []
  page.on("pageerror", error => errors.push(error.message))
  await page.goto(base, { waitUntil: "networkidle" })
  await page.evaluate(({ key, id }) => localStorage.setItem(key, JSON.stringify({ [id]: { lessonId: id, status: "completed", startedAt: 1, completedAt: 2, score: 0 } })), { key: STORAGE_KEYS.LESSON_PROGRESS, id: lesson.id })
  await page.goto(`${base}/learn/${lesson.id}`, { waitUntil: "networkidle" })
  const editor = page.locator(`[data-work-id="lesson:${lesson.id}"]`)
  const text = "私は林です。\n日本語を勉強しています。"
  await editor.getByRole("textbox").fill(text)
  await page.waitForFunction(key => Object.values(JSON.parse(localStorage.getItem(key) ?? "{}")).some(work => work.draft.includes("私は林です")), STORAGE_KEYS.WRITTEN_WORKS)
  for (let index = 0; index < 3; index++) {
    await editor.getByRole("checkbox").nth(index).check()
    await editor.getByTestId("work-complete").waitFor()
    await page.waitForFunction(({ key, count }) => Object.values(JSON.parse(localStorage.getItem(key))).some(work => work.checked.length === count), { key: STORAGE_KEYS.WRITTEN_WORKS, count: index + 1 })
  }
  await editor.getByTestId("work-complete").click()
  await editor.getByText("已保存 · 已完成自查（本人确认）", { exact: true }).waitFor()
  await page.reload({ waitUntil: "networkidle" })
  assert.equal(await editor.getByRole("textbox").inputValue(), text)
  assert.equal(await editor.getByRole("checkbox").nth(2).isChecked(), true)
  await editor.getByRole("textbox").fill(`${text}\nまだ練習中です。`)
  await page.waitForFunction(key => Object.values(JSON.parse(localStorage.getItem(key))).some(work => work.draft.includes("まだ") && !work.completedAt && work.checked.length === 0), STORAGE_KEYS.WRITTEN_WORKS)
  assert.equal(await editor.getByTestId("work-complete").isEnabled(), false)
  assert.equal(await page.evaluate(key => localStorage.getItem(key), STORAGE_KEYS.ITEM_PROGRESS), null)
  await page.goto(base, { waitUntil: "networkidle" })
  await page.getByTestId("goal-practice").locator("a").first().click()
  const goalEditor = page.getByTestId("written-work")
  await goalEditor.getByRole("textbox").fill("ビルとビールの長さを比べました。")
  await page.waitForFunction(key => Object.values(JSON.parse(localStorage.getItem(key))).some(work => work.task.id.startsWith("goal:") && work.draft.includes("ビール")), STORAGE_KEYS.WRITTEN_WORKS)
  await page.goto(`${base}/path`, { waitUntil: "networkidle" })
  await page.getByTestId("goal-practice").locator("a").first().click()
  await page.waitForFunction(() => {
    const input = document.querySelector('[data-work-id="goal:balanced-sound"] textarea')
    return input && !input.disabled
  })
  assert.equal(await goalEditor.getByRole("textbox").inputValue(), "ビルとビールの長さを比べました。")
  // Simulate a competing write before its storage notification reaches this editor.
  await page.evaluate(key => {
    const works = JSON.parse(localStorage.getItem(key))
    const work = Object.values(works).find(work => work.task.id === "goal:balanced-sound")
    work.draft = "另一页面保存的作品"; work.updatedAt++
    localStorage.setItem(key, JSON.stringify(works))
  }, STORAGE_KEYS.WRITTEN_WORKS)
  await goalEditor.getByRole("textbox").fill("本页尚未保存的作品")
  await goalEditor.getByRole("alert").waitFor()
  assert.equal(await goalEditor.getByRole("textbox").inputValue(), "本页尚未保存的作品")
  assert.equal(await page.evaluate(key => Object.values(JSON.parse(localStorage.getItem(key))).find(work => work.task.id === "goal:balanced-sound").draft, STORAGE_KEYS.WRITTEN_WORKS), "另一页面保存的作品")
  await goalEditor.getByRole("button", { name: "已复制文字，读取保存版本" }).click()
  await goalEditor.getByRole("alert").waitFor({ state: "hidden" })
  assert.equal(await goalEditor.getByRole("textbox").inputValue(), "另一页面保存的作品")
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false)
  // A reset while a new-work save is queued must not resurrect it after the lock is released.
  await page.evaluate(key => localStorage.removeItem(key), STORAGE_KEYS.WRITTEN_WORKS)
  await page.reload({ waitUntil: "networkidle" })
  await page.evaluate(name => { void navigator.locks.request(name, () => new Promise(resolve => { window.releaseWorkLock = resolve })) }, LEARNING_WRITE_LOCK_NAME)
  await page.waitForFunction(() => typeof window.releaseWorkLock === "function")
  await goalEditor.getByRole("textbox").fill("即将重置时的草稿")
  await page.evaluate(({ key, epoch }) => { localStorage.removeItem(key); localStorage.setItem(epoch, "reset-fixture"); window.releaseWorkLock() }, { key: STORAGE_KEYS.WRITTEN_WORKS, epoch: LEARNING_WRITE_EPOCH_KEY })
  await goalEditor.getByRole("alert").waitFor()
  assert.equal(await page.evaluate(key => localStorage.getItem(key), STORAGE_KEYS.WRITTEN_WORKS), null)
  await goalEditor.getByRole("button", { name: "已复制文字，读取保存版本" }).click()
  await page.evaluate(key => localStorage.setItem(key, '{"broken":true}'), STORAGE_KEYS.WRITTEN_WORKS)
  await page.reload({ waitUntil: "networkidle" })
  await goalEditor.getByRole("alert").waitFor()
  assert.equal(await page.evaluate(key => localStorage.getItem(key), STORAGE_KEYS.WRITTEN_WORKS), '{"broken":true}')
  assert.deepEqual(errors, [])
  console.log("Written work passed: course and goal autosave, reload, rubric completion, edit invalidation, cross-page conflict, queued-reset protection and corrupt-data preservation.")
} finally { await browser.close() }
