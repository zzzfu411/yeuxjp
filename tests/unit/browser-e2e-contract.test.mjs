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
    source: "src/components/kana/kana-detail-modal.tsx",
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
    testId: "quiz-answer-option-0",
    source: "src/components/quiz/quiz-option-grid.tsx",
    pattern: /data-testid=\{`quiz-answer-option-\$\{index\}`\}/,
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

test("browser E2E verifies lesson progress writes after a real answer", () => {
  const e2e = fs.readFileSync(path.join(root, "tests/e2e/browser.mjs"), "utf8")

  assert.match(e2e, /readJsonStorage/)
  assert.match(e2e, /yasashi\.learning\.lessons\.v1/)
  assert.match(e2e, /currentStepIndex/)
  assert.match(e2e, /lastStepId/)
  assert.match(e2e, /recognize-a/)
  assert.match(e2e, /page\.reload\(\{ waitUntil: "networkidle" \}\)/)
  assert.match(e2e, /lesson-answer-a"\)\.waitFor\(\{ state: "visible" \}\)/)
  assert.match(e2e, /yasashi\.learning\.practice\.v1/)
  assert.match(e2e, /yasashi\.learning\.items\.v1/)
  assert.match(e2e, /yasashi\.srs\.kana\.v1/)
  assert.match(e2e, /lessonId === "day-1-a-row-hello"/)
  assert.match(e2e, /itemId === "a"/)
  assert.match(e2e, /item\.correct === true/)
  assert.match(e2e, /correct kana lesson answer should enroll SRS/)
})

test("browser E2E verifies wrong quiz answers enter the mistake notebook", () => {
  const e2e = fs.readFileSync(path.join(root, "tests/e2e/browser.mjs"), "utf8")

  assert.match(e2e, /getByTestId\("quiz-answer-option-0"\)/)
  assert.match(e2e, /Math\.random = \(\) => 0/)
  assert.match(e2e, /fixed quiz random source should ask kana a/)
  assert.match(e2e, /yasashi\.mistakes\.v1/)
  assert.match(e2e, /item\.id === "kana:a:hiragana-romaji"/)
  assert.match(e2e, /item\.type === "hiragana-romaji"/)
  assert.match(e2e, /item\.correctAnswer === "a"/)
  assert.match(e2e, /wrong quiz answer should record kana a in mistakes/)
})
