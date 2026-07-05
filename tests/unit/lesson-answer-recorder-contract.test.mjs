import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("LessonRunner delegates shared answer recording to useLessonAnswerRecorder", () => {
  const source = read("src/components/lesson/lesson-runner.tsx")
  const practice = read("src/components/lesson/use-lesson-step-practice.ts")

  assert.match(source, /from "@\/components\/lesson\/use-lesson-answer-recorder"/)
  assert.match(source, /from "@\/components\/lesson\/use-lesson-step-practice"/)
  assert.match(source, /useLessonAnswerRecorder\(/)
  assert.match(source, /useLessonStepPractice\(\{/)
  assert.match(practice, /const recorded = recordAnswer\(current, answer\)/)
  assert.match(practice, /applyRecordedAnswer\(typed\)/)
  assert.match(practice, /applyRecordedAnswer\(built\.join\(""\)\)/)
  assert.match(practice, /if \(!recorded\) \{\s*answerPendingRef\.current = false\s*setSaveError\(true\)\s*return\s*\}/)
  assert.match(practice, /setSaveError\(true\)/)
  assert.match(practice, /setSaveError\(false\)/)
  assert.match(source, /<PracticeSaveError show=\{saveError\} \/>/)
  assert.doesNotMatch(source, /makeQuestionResult/)
  assert.doesNotMatch(source, /recordQuestionPractice/)
  assert.doesNotMatch(source, /lessonStepToQuestion/)
  assert.doesNotMatch(source, /recordAnswer\(current, answer\)/)
  assert.doesNotMatch(source, /recordAnswer\(current, typed\)/)
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

test("useLessonStepPractice owns lesson input state and guarded submit flows", () => {
  const source = read("src/components/lesson/use-lesson-step-practice.ts")

  assert.match(source, /export function useLessonStepPractice/)
  assert.match(source, /const \[selected, setSelected\] = useState<string \| null>\(null\)/)
  assert.match(source, /const \[typed, setTyped\] = useState\(""\)/)
  assert.match(source, /const \[built, setBuilt\] = useState<string\[\]>\(\[\]\)/)
  assert.match(source, /const \[result, setResult\] = useState<"correct" \| "wrong" \| null>\(null\)/)
  assert.match(source, /const answerPendingRef = useRef\(false\)/)
  assert.match(source, /const resetStepState = useCallback/)
  assert.match(source, /answerPendingRef\.current = false/)
  assert.match(source, /if \(answerPendingRef\.current\) return/)
  assert.match(source, /answerPendingRef\.current = true/)
  assert.match(source, /current\.type !== "multipleChoice" \|\| result/)
  assert.match(source, /current\.type !== "typing" && current\.type !== "dictation"/)
  assert.match(source, /current\.type !== "sentenceBuild" \|\| result/)
  assert.match(source, /setBuilt\(\(prev\) => \[\.\.\.prev, chunk\]\)/)
  assert.match(source, /setBuilt\(\(prev\) => prev\.slice\(0, -1\)\)/)
  assert.match(source, /setBuilt\(\[\]\)/)
  assert.match(source, /setResult\(recorded\.correct \? "correct" : "wrong"\)/)
})
