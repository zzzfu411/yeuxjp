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
  assert.match(practice, /const recorded = await recordAnswer\(current, answer\)/)
  assert.match(practice, /applyRecordedAnswer\(typed\)/)
  assert.match(practice, /applyRecordedAnswer\(built\.join\(""\)\)/)
  assert.match(practice, /if \(!recorded\) \{\s*answerPendingRef\.current = null\s*setSaveError\(true\)\s*return\s*\}/)
  assert.match(practice, /setSaveError\(true\)/)
  assert.match(practice, /setSaveError\(false\)/)
  assert.match(source, /<PracticeSaveError show=\{saveError\} \/>/)
  assert.doesNotMatch(source, /makeQuestionResult/)
  assert.doesNotMatch(source, /recordQuestionPractice/)
  assert.doesNotMatch(source, /lessonStepToQuestion/)
  assert.doesNotMatch(source, /recordAnswer\(current, answer\)/)
  assert.doesNotMatch(source, /recordAnswer\(current, typed\)/)
})

test("useLessonAnswerRecorder resolves persisted answers and commits fresh answers atomically", () => {
  const source = read("src/components/lesson/use-lesson-answer-recorder.ts")

  assert.match(source, /export function useLessonAnswerRecorder/)
  assert.match(source, /isPracticeStep\(step\)/)
  assert.match(source, /persistedAnswers: PersistedLessonStepAnswerMap/)
  assert.match(source, /resolveLessonStepSubmission\(step, answer, current\.stepAnswers\?\.\[step\.id\]\)/)
  assert.match(source, /recordLessonQuestionPractice\(\{/)
  assert.match(source, /lessonId/)
  assert.match(source, /lessonStepId: step\.id/)
  assert.match(source, /if \(shouldRecord && !recordLessonQuestionPractice\(\{/)
  assert.doesNotMatch(source, /progress\.saveLessonStepAnswer/)
  assert.match(source, /return null/)
  assert.match(source, /setAnswered\(\(prev\) => \(\{ \.\.\.prev, \[step\.id\]: result\.correct && !result\.assisted \}\)\)/)
  assert.match(source, /return result/)
})

test("useLessonStepPractice owns lesson input state and guarded submit flows", () => {
  const source = read("src/components/lesson/use-lesson-step-practice.ts")

  assert.match(source, /export function useLessonStepPractice/)
  assert.match(source, /const \[draft, setDraft\] = useState<LessonPracticeState \| null>\(null\)/)
  assert.match(source, /draft\?\.step === current && draft\.restoredAnswer === restoredAnswer/)
  assert.match(source, /createLessonPracticeState\(current, restoredAnswer\)/)
  assert.match(source, /const \{ selected, typed, built, result \} = state/)
  assert.match(source, /const answerPendingRef = useRef<LessonStep \| null>\(null\)/)
  assert.match(source, /restoredAnswer\?: PersistedLessonStepAnswer/)
  assert.match(source, /selected: current\.type === "multipleChoice" && restoredAnswer \? answer : null/)
  assert.match(source, /typed: \(current\.type === "typing" \|\| current\.type === "dictation"\) && restoredAnswer \? answer : ""/)
  assert.match(source, /built: current\.type === "sentenceBuild" && restoredAnswer \? restoreSentenceChunks\(current\.chunks, answer\) : \[\]/)
  assert.match(source, /result: restoredAnswer \? \(restoredAnswer\.correct \? "correct" : "wrong"\) : null/)
  assert.match(source, /const resetStepState = useCallback/)
  assert.match(source, /answerPendingRef\.current = null/)
  assert.match(source, /if \(answerPendingRef\.current === current\) return/)
  assert.match(source, /answerPendingRef\.current = current/)
  assert.match(source, /current\.type !== "multipleChoice" \|\| result/)
  assert.match(source, /current\.type !== "typing" && current\.type !== "dictation"/)
  assert.match(source, /!typed\.trim\(\)/)
  assert.match(source, /current\.type !== "sentenceBuild" \|\| result/)
  assert.match(source, /setBuilt\(\(prev\) => \[\.\.\.prev, chunk\]\)/)
  assert.match(source, /setBuilt\(\(prev\) => prev\.slice\(0, -1\)\)/)
  assert.match(source, /setBuilt\(\[\]\)/)
  assert.match(source, /setResult\(recorded\.correct \? "correct" : "wrong"\)/)
})
