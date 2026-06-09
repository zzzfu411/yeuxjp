import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("lesson page delegates shared answer recording to useLessonAnswerRecorder", () => {
  const source = read("src/app/learn/[lessonId]/page.tsx")

  assert.match(source, /from "@\/components\/lesson\/use-lesson-answer-recorder"/)
  assert.match(source, /useLessonAnswerRecorder\(/)
  assert.match(source, /const recorded = recordAnswer\(current, answer\)/)
  assert.match(source, /const recorded = recordAnswer\(current, typed\)/)
  assert.match(source, /if \(!recorded\) \{\s*setSaveError\(true\)\s*return\s*\}/)
  assert.match(source, /setSaveError\(true\)/)
  assert.match(source, /setSaveError\(false\)/)
  assert.match(source, /<PracticeSaveError show=\{saveError\} \/>/)
  assert.doesNotMatch(source, /makeQuestionResult/)
  assert.doesNotMatch(source, /recordQuestionPractice/)
  assert.doesNotMatch(source, /lessonStepToQuestion/)
})

test("useLessonAnswerRecorder owns lesson question conversion and practice writes", () => {
  const source = read("src/components/lesson/use-lesson-answer-recorder.ts")

  assert.match(source, /export function useLessonAnswerRecorder/)
  assert.match(source, /isPracticeStep\(step\)/)
  assert.match(source, /lessonStepToQuestion\(step\)/)
  assert.match(source, /makeQuestionResult\(question, answer\)/)
  assert.match(source, /recordQuestionPractice\(\{/)
  assert.match(source, /lessonId/)
  assert.match(source, /lessonStepId: step\.id/)
  assert.match(source, /if \(!recordQuestionPractice\(\{/)
  assert.match(source, /return null/)
  assert.match(source, /setAnswered\(\(prev\) => \(\{ \.\.\.prev, \[step\.id\]: result\.correct \}\)\)/)
  assert.match(source, /return result/)
})
