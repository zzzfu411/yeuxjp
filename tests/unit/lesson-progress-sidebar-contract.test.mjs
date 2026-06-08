import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("lesson page delegates course progress sidebar rendering", () => {
  const source = read("src/app/learn/[lessonId]/page.tsx")

  assert.match(source, /from "@\/components\/lesson\/lesson-progress-sidebar"/)
  assert.match(source, /<LessonProgressSidebar\b/)
  assert.match(source, /lesson=\{lesson\}/)
  assert.match(source, /lessonPosition=\{lessonPosition\}/)
  assert.match(source, /stepProgress=\{stepProgress\}/)
  assert.match(source, /savedProgress=\{savedLessonProgress\}/)
  assert.doesNotMatch(source, /已开始本课。系统会保留本课练习记录/)
  assert.doesNotMatch(source, /已完成本课，上次分数/)
})

test("LessonProgressSidebar owns sidebar progress, counts, and status copy", () => {
  const source = read("src/components/lesson/lesson-progress-sidebar.tsx")

  assert.match(source, /export function LessonProgressSidebar/)
  assert.match(source, /style=\{\{ width: `\$\{stepProgress\}%` \}\}/)
  assert.match(source, /\{stepIndex \+ 1\}\/\{lesson\.steps\.length\}/)
  assert.match(source, /\{correctCount\}\/\{practiceSteps\}/)
  assert.match(source, /savedProgress\?\.status === "started"/)
  assert.match(source, /savedProgress\?\.status === "completed"/)
  assert.match(source, /savedProgress\.score \?\? completionScore/)
})
