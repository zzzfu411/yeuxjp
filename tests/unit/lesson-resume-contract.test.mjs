import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("lesson page restores a saved lesson step only after progress storage has loaded", () => {
  const source = read("src/app/learn/[lessonId]/page.tsx")

  assert.match(source, /const \{ lessons, loaded, startLesson, completeLesson, saveLessonPosition \} = progress/)
  assert.match(source, /if \(!lesson \|\| !loaded\) return 0/)
  assert.match(source, /resolveLessonResumeStepIndex\(savedLessonProgress, lesson\.steps\)/)
  assert.match(source, /manualStep\?\.lessonId === lesson\.id \? manualStep\.index : resumedStepIndex/)
  assert.doesNotMatch(source, /setStepIndex/)
  assert.doesNotMatch(source, /setState.*resumeIndex/)
})

test("lesson page saves step position through the shared learning progress facade", () => {
  const source = read("src/app/learn/[lessonId]/page.tsx")

  assert.match(source, /if \(!lesson \|\| !loaded\) return/)
  assert.match(source, /saveLessonPosition\(lesson\.id, stepIndex, step\?\.id\)/)
  assert.match(source, /setManualStep\(\{ lessonId: lesson\.id, index: Math\.min\(stepIndex \+ 1, lesson\.steps\.length - 1\) \}\)/)
  assert.match(source, /setManualStep\(\{ lessonId: lesson\.id, index: Math\.max\(stepIndex - 1, 0\) \}\)/)
  assert.doesNotMatch(source, /localStorage\.setItem/)
})

test("learning progress preserves compatible lesson keys while adding resume fields", () => {
  const progress = read("src/lib/learning-progress.ts")
  const model = read("src/lib/learning-progress-model.ts")

  assert.match(progress, /normalizeLessonProgressMap/)
  assert.match(progress, /mergeLessonProgressMaps/)
  assert.match(progress, /normalizeStepIndex/)
  assert.match(progress, /saveLessonPosition/)
  assert.match(progress, /readLessonProgressMap\(\)/)
  assert.match(progress, /loaded/)
  assert.match(model, /currentStepIndex\?: number/)
  assert.match(model, /lastStepId\?: string/)
  assert.match(model, /updatedAt\?: number/)
})
