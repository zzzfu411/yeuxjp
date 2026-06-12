import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("lesson route is a static server shell around LessonRunner", () => {
  const source = read("src/app/learn/[lessonId]/page.tsx")

  assert.doesNotMatch(source, /"use client"/)
  assert.match(source, /from "next\/navigation"/)
  assert.match(source, /notFound/)
  assert.match(source, /from "@\/components\/lesson\/lesson-runner"/)
  assert.match(source, /from "@\/data\/lessons"/)
  assert.match(source, /STARTER_LESSONS/)
  assert.match(source, /getLessonById/)
  assert.match(source, /export const dynamicParams = false/)
  assert.match(source, /export function generateStaticParams\(\)/)
  assert.match(source, /STARTER_LESSONS\.map\(\(lesson\) => \(\{ lessonId: lesson\.id \}\)\)/)
  assert.match(source, /params: Promise<\{ lessonId: string \}>/)
  assert.match(source, /const \{ lessonId \} = await params/)
  assert.match(source, /const lesson = getLessonById\(lessonId\)/)
  assert.match(source, /if \(!lesson\) \{\s*notFound\(\)\s*\}/)
  assert.match(source, /<LessonRunner lesson=\{lesson\} \/>/)
})

test("LessonRunner owns lesson browser state and shared learning hooks", () => {
  const source = read("src/components/lesson/lesson-runner.tsx")
  const state = read("src/components/lesson/use-lesson-runner-state.ts")

  assert.match(source, /"use client"/)
  assert.match(source, /export function LessonRunner/)
  assert.match(source, /lesson: Lesson/)
  assert.match(source, /from "@\/components\/lesson\/use-lesson-runner-state"/)
  assert.match(source, /useLessonRunnerState\(lesson\)/)
  assert.match(state, /useLearningProgress\(\)/)
  assert.match(state, /useMistakeNotebook\(\)/)
  assert.match(source, /useLessonAnswerRecorder\(/)
  assert.match(source, /<LessonStepBody\b/)
  assert.match(source, /<LessonProgressSidebar\b/)
  assert.match(source, /aria-label="朗读当前课程内容"/)
  assert.match(source, /PracticeSaveError/)
  assert.doesNotMatch(source, /useParams/)
  assert.doesNotMatch(source, /notFound/)
  assert.doesNotMatch(source, /getLessonById/)
})
