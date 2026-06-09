import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("lesson page delegates step rendering to LessonStepBody", () => {
  const source = read("src/app/learn/[lessonId]/page.tsx")

  assert.match(source, /from "@\/components\/lesson\/lesson-step-body"/)
  assert.match(source, /<LessonStepBody\b/)
  assert.doesNotMatch(source, /function StepBody/)
  assert.doesNotMatch(source, /Headphones/)
  assert.doesNotMatch(source, /RotateCcw/)
  assert.doesNotMatch(source, /from "@\/components\/ui\/input"/)
  assert.doesNotMatch(source, /lesson-answer-\$\{option\}/)
})

test("LessonStepBody owns lesson step interaction surfaces", () => {
  const source = read("src/components/lesson/lesson-step-body.tsx")

  assert.match(source, /export function LessonStepBody/)
  assert.match(source, /step\.type === "multipleChoice"/)
  assert.match(source, /step\.type === "typing" \|\| step\.type === "dictation"/)
  assert.match(source, /step\.type === "sentenceBuild"/)
  assert.match(source, /Headphones/)
  assert.match(source, /RotateCcw/)
  assert.match(source, /from "@\/components\/ui\/input"/)
  assert.match(source, /from "@\/lib\/answer-option-feedback"/)
  assert.match(source, /getAnswerOptionFeedback/)
  assert.match(source, /getAnswerOptionClassName/)
  assert.match(source, /shouldShowCorrectAnswerIcon/)
  assert.match(source, /shouldShowWrongAnswerIcon/)
  assert.match(source, /lesson-answer-\$\{option\}/)
  assert.match(source, /onSubmitSentence/)
  assert.doesNotMatch(source, /show && isCorrect/)
  assert.doesNotMatch(source, /isSelected && !isCorrect/)
})
