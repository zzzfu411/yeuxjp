import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

const requiredSelectors = [
  {
    testId: "home-start-learning",
    source: "src/app/page.tsx",
    pattern: /data-testid="home-start-learning"/,
  },
  {
    testId: "lesson-next",
    source: "src/app/learn/[lessonId]/page.tsx",
    pattern: /data-testid="lesson-next"/,
  },
  {
    testId: "lesson-answer-a",
    source: "src/components/lesson/lesson-step-body.tsx",
    pattern: /data-testid=\{`lesson-answer-\$\{option\}`\}/,
  },
  {
    testId: "kana-card-a",
    source: "src/components/kana/kana-card.tsx",
    pattern: /data-testid=\{`kana-card-\$\{kana\.romaji\}`\}/,
  },
  {
    testId: "kana-stroke-toggle",
    source: "src/components/kana/kana-grid.tsx",
    pattern: /data-testid="kana-stroke-toggle"/,
  },
  {
    testId: "vocabulary-search",
    source: "src/app/vocabulary/page.tsx",
    pattern: /data-testid="vocabulary-search"/,
  },
  {
    testId: "quiz-mode-hiragana-romaji",
    source: "src/app/quiz/page.tsx",
    pattern: /testId="quiz-mode-hiragana-romaji"/,
  },
  {
    testId: "review-start-today",
    source: "src/app/review/page.tsx",
    pattern: /data-testid="review-start-today"/,
  },
  {
    testId: "review-remaining",
    source: "src/components/review/today-review-session.tsx",
    pattern: /data-testid="review-remaining"/,
  },
]

test("browser E2E uses only declared stable test ids", () => {
  const e2e = fs.readFileSync(path.join(root, "tests/e2e/browser.mjs"), "utf8")
  const used = Array.from(e2e.matchAll(/getByTestId\("([^"]+)"\)/g), (match) => match[1])
  assert.deepEqual(new Set(used), new Set(requiredSelectors.map((item) => item.testId)))
})

test("browser E2E test ids remain present in source files", () => {
  for (const item of requiredSelectors) {
    const source = fs.readFileSync(path.join(root, item.source), "utf8")
    assert.match(source, item.pattern, `${item.testId} should be declared in ${item.source}`)
  }
})
