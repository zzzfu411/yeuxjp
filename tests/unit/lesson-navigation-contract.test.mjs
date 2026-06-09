import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("LessonRunner delegates locked preview and navigation surfaces", () => {
  const source = read("src/components/lesson/lesson-runner.tsx")

  assert.match(source, /from "@\/components\/lesson\/lesson-locked-preview"/)
  assert.match(source, /from "@\/components\/lesson\/lesson-navigation-bar"/)
  assert.match(source, /<LessonLockedPreview recommendedLesson=\{recommendedLesson\} \/>/)
  assert.match(source, /<LessonNavigationBar/)
  assert.doesNotMatch(source, /data-testid="lesson-locked-preview"/)
  assert.doesNotMatch(source, /data-testid="lesson-next"/)
  assert.doesNotMatch(source, /data-testid="lesson-review-link"/)
  assert.doesNotMatch(source, /data-testid="lesson-next-lesson-link"/)
})

test("LessonLockedPreview owns locked lesson recovery links", () => {
  const source = read("src/components/lesson/lesson-locked-preview.tsx")

  assert.match(source, /export function LessonLockedPreview/)
  assert.match(source, /recommendedLesson: Lesson \| null/)
  assert.match(source, /data-testid="lesson-locked-preview"/)
  assert.match(source, /href=\{`\/learn\/\$\{recommendedLesson\.id\}`\}/)
  assert.match(source, /href="\/path"/)
})

test("LessonNavigationBar owns step movement and completed lesson follow-up links", () => {
  const source = read("src/components/lesson/lesson-navigation-bar.tsx")

  assert.match(source, /export function LessonNavigationBar/)
  assert.match(source, /isPracticeStep\(current\)/)
  assert.match(source, /data-testid="lesson-next"/)
  assert.match(source, /data-testid="lesson-review-link"/)
  assert.match(source, /data-testid="lesson-next-lesson-link"/)
  assert.match(source, /onClick=\{onBack\}/)
  assert.match(source, /onClick=\{onNext\}/)
  assert.match(source, /href="\/review"/)
  assert.match(source, /href=\{nextLesson \? `\/learn\/\$\{nextLesson\.id\}` : "\/"\}/)
})
