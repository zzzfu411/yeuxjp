import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("learning entry surfaces share the centralized entry model", () => {
  for (const relPath of ["src/components/path/skill-tree-page.tsx", "src/components/learning/next-step-card.tsx"]) {
    const source = read(relPath)
    assert.match(source, /from "@\/lib\/learning-recommendation"/, relPath)
    assert.match(source, /useLearningRecommendation\(/, relPath)
  }

  const recommendationHook = read("src/lib/learning-recommendation.ts")
  const recommendationModel = read("src/lib/learning-recommendation-model.ts")
  assert.match(recommendationHook, /from "@\/lib\/learning-recommendation-model"/)
  assert.match(recommendationHook, /buildLearningRecommendationModel\(/)
  assert.doesNotMatch(recommendationHook, /resolveLearningEntry\(/)
  assert.match(recommendationModel, /from "@\/lib\/learning-entry"/)
  assert.match(recommendationModel, /resolveLearningEntry\(/)

  const homeRoute = read("src/app/page.tsx")
  const home = read("src/components/home/home-page.tsx")
  const model = read("src/lib/home-page-model.ts")
  assert.doesNotMatch(homeRoute, /"use client"/)
  assert.match(homeRoute, /from "@\/components\/home\/home-page"/)
  assert.match(homeRoute, /<HomePage \/>/)
  assert.match(home, /from "@\/lib\/learning-recommendation"/)
  assert.match(home, /useLearningRecommendation\(/)
  assert.match(home, /buildHomePageModel\(/)
  assert.doesNotMatch(home, /resolveLearningEntry\(/)
  assert.match(model, /from "@\/lib\/learning-entry"/)
  assert.match(model, /resolveLearningEntry\(/)
})

test("course path renders locked future lessons as non-link cards", () => {
  const pathPage = read("src/components/path/skill-tree-page.tsx")
  assert.match(pathPage, /<PathStarterLessons completedLessonIds=\{learning\.completedLessonIds\} activeLessonId=\{nextLesson\?\.id\} \/>/)
  assert.doesNotMatch(pathPage, /getLessonEntryStatus\(lesson, learning\.completedLessonIds, nextLesson\?\.id\)/)

  const pathStarterLessons = read("src/components/path/path-starter-lessons.tsx")
  assert.match(pathStarterLessons, /getLessonEntryStatus\(lesson, completedLessonIds, activeLessonId, kanaLevel\)/)
  assert.match(pathStarterLessons, /if \(locked\)/)
  assert.match(pathStarterLessons, /aria-disabled="true"/)
  assert.match(pathStarterLessons, /href=\{`\/learn\/\$\{lesson\.id\}`\}/)
})
