import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

const routeShells = [
  { route: "src/app/page.tsx", component: "HomePage", importPath: "@/components/home/home-page" },
  { route: "src/app/path/page.tsx", component: "SkillTreePage", importPath: "@/components/path/skill-tree-page" },
  { route: "src/app/kana/page.tsx", component: "KanaPage", importPath: "@/components/kana/kana-page" },
  { route: "src/app/vocabulary/page.tsx", component: "VocabularyPage", importPath: "@/components/vocabulary/vocabulary-page" },
  { route: "src/app/quiz/page.tsx", component: "QuizPage", importPath: "@/components/quiz/quiz-page" },
  { route: "src/app/review/page.tsx", component: "ReviewPage", importPath: "@/components/review/review-page" },
  { route: "src/app/grammar/page.tsx", component: "GrammarReferencePage", importPath: "@/components/reference/grammar-reference-page" },
]

test("interactive app routes stay as server shells around component islands", () => {
  for (const { route, component, importPath } of routeShells) {
    const source = read(route)

    assert.doesNotMatch(source, /"use client"/, route)
    assert.doesNotMatch(source, /\buse[A-Z][A-Za-z0-9_]*\(/, route)
    assert.doesNotMatch(source, /\b(localStorage|sessionStorage|window|document)\b/, route)
    assert.match(source, new RegExp(`from "${importPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`), route)
    assert.match(source, new RegExp(`<${component}(\\s|/|>)`), route)
  }
})

test("client-only route shells expose stable production HTTP health markers", () => {
  for (const [route, marker] of [
    ["src/app/kana/page.tsx", "kana"],
    ["src/app/vocabulary/page.tsx", "vocabulary"],
    ["src/app/quiz/page.tsx", "quiz"],
    ["src/app/grammar/page.tsx", "grammar"],
  ]) {
    assert.match(read(route), new RegExp(`data-route-shell="${marker}"`), route)
  }
})
