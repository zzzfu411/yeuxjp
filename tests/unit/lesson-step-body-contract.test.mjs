import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("LessonRunner delegates step rendering to LessonStepBody", () => {
  const source = read("src/components/lesson/lesson-runner.tsx")

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
  assert.match(source, /getAnswerOptionAriaLabel/)
  assert.match(source, /getAnswerOptionClassName/)
  assert.match(source, /shouldShowCorrectAnswerIcon/)
  assert.match(source, /shouldShowWrongAnswerIcon/)
  assert.match(source, /from "@\/lib\/questions"/)
  assert.match(source, /isQuestionAnswerCorrect\(\{ correctAnswer: step\.answer, acceptedAnswers: step\.acceptedAnswers \}, option\)/)
  assert.doesNotMatch(source, /isCorrectOption: option === step\.answer/)
  assert.match(source, /aria-label=\{getAnswerOptionAriaLabel\(option, feedback\)\}/)
  assert.match(source, /aria-pressed=\{selected === option\}/)
  assert.match(source, /lesson-answer-\$\{option\}/)
  assert.match(source, /data-testid="lesson-typing-input"/)
  assert.match(source, /data-testid="lesson-submit-typing"/)
  assert.match(source, /onSubmitSentence/)
  assert.doesNotMatch(source, /show && isCorrect/)
  assert.doesNotMatch(source, /isSelected && !isCorrect/)
})

test("LessonStepBody supports read-only lesson preview controls", () => {
  const source = read("src/components/lesson/lesson-step-body.tsx")

  assert.match(source, /readOnly = false/)
  assert.match(source, /readOnly\?: boolean/)
  assert.match(source, /disabled=\{readOnly \|\| !!result\}/)
  assert.match(source, /event\.key === "Enter" && !readOnly/)
  assert.match(source, /disabled=\{readOnly \|\| !typed\.trim\(\) \|\| !!result\}/)
  assert.match(source, /const disabled = readOnly \|\| usedCount\(chunk\) >= total \|\| !!result/)
  assert.match(source, /disabled=\{readOnly \|\| !built\.length \|\| !!result\}/)
})
