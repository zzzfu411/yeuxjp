import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("quiz route is a server shell around the quiz page client island", () => {
  const route = read("src/app/quiz/page.tsx")
  const page = read("src/components/quiz/quiz-page.tsx")

  assert.doesNotMatch(route, /"use client"/)
  assert.match(route, /from "@\/components\/quiz\/quiz-page"/)
  assert.match(route, /<QuizPage \/>/)

  assert.match(page, /"use client"/)
  assert.match(page, /import dynamic from "next\/dynamic"/)
  assert.match(page, /useSearchParams\(\)/)
  assert.match(page, /from "@\/lib\/quiz-types"/)
  assert.doesNotMatch(page, /from "@\/lib\/quiz-generators"/)
  assert.match(page, /parseQuizMode\(urlMode\)/)
  assert.match(page, /const QuizRunner = dynamic\(/)
  assert.match(page, /import\("@\/components\/quiz\/quiz-runner"\)/)
  assert.match(page, /ssr: false/)
  assert.match(page, /QUIZ_MODE_OPTIONS\.map/)
  assert.match(page, /<QuizRunner/)
  assert.match(page, /data-testid=\{testId\}/)
  assert.doesNotMatch(page, /import \{ QuizRunner \}/)
})
