import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"
const { parseMediaLevel, goalPracticeTaskHref, goalPracticeReturn } = await loadTsModule("src/lib/goal-practice-navigation.ts")

test("goal tasks return to the originating catalog and selected material level", () => {
  for (const source of ["home", "path"]) for (const level of ["N5", "N4", "N3", "N2"]) {
    const url = new URL(goalPracticeTaskHref("media-N2-evidence", source, level), "http://localhost")
    assert.equal(url.pathname, "/practice/media-N2-evidence")
    const destination = goalPracticeReturn(url.searchParams.get("source"), url.searchParams.get("mediaLevel"))
    assert.equal(destination.href, `${source === "path" ? "/path" : "/"}?mediaLevel=${level}#goal-practice`)
  }
  assert.equal(goalPracticeReturn("path").href, "/path#goal-practice")
})

test("old daily task links keep the daily destination and arbitrary return URLs are never accepted", () => {
  assert.deepEqual(goalPracticeReturn(), { href: "/#daily-study-plan", label: "返回今日安排" })
  for (const source of ["https://example.com", "//example.com", "/settings", "javascript:alert(1)", "../../", "HOME"]) {
    assert.equal(goalPracticeReturn(source, "N2").href, "/#daily-study-plan")
  }
  for (const level of ["N1", "unknown", "N2#other", "N2&source=other", "https://example.com", ""]) {
    assert.equal(parseMediaLevel(level), undefined)
    assert.equal(goalPracticeReturn("home", level).href, "/#goal-practice")
  }
  assert.equal(goalPracticeTaskHref("task?source=path#x", "home"), "/practice/task%3Fsource%3Dpath%23x?source=home")
})
