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
    testId: "lesson-locked-preview",
    source: "src/app/learn/[lessonId]/page.tsx",
    pattern: /data-testid="lesson-locked-preview"/,
  },
  {
    testId: "lesson-answer-a",
    source: "src/components/lesson/lesson-step-body.tsx",
    pattern: /data-testid=\{`lesson-answer-\$\{option\}`\}/,
  },
  {
    testId: "lesson-answer-ka",
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
    source: "src/components/vocabulary/vocabulary-toolbar.tsx",
    pattern: /data-testid="vocabulary-search"/,
  },
  {
    testId: "quiz-mode-hiragana-romaji",
    source: "src/lib/quiz-mode-options.ts",
    pattern: /testId: "quiz-mode-hiragana-romaji"/,
  },
  {
    testId: "quiz-answer-option-0",
    source: "src/components/quiz/quiz-option-grid.tsx",
    pattern: /data-testid=\{`quiz-answer-option-\$\{index\}`\}/,
  },
  {
    testId: "review-start-today",
    source: "src/components/review/review-banners.tsx",
    pattern: /data-testid="review-start-today"/,
  },
  {
    testId: "review-empty-state",
    source: "src/components/review/review-banners.tsx",
    pattern: /data-testid="review-empty-state"/,
  },
  {
    testId: "review-today-empty",
    source: "src/components/review/review-banners.tsx",
    pattern: /data-testid=\{todayQueueLength \? "review-today-due" : "review-today-empty"\}/,
  },
  {
    testId: "review-due-state",
    source: "src/components/review/review-banners.tsx",
    pattern: /"review-due-state"/,
  },
  {
    testId: "review-today-due",
    source: "src/components/review/review-banners.tsx",
    pattern: /data-testid=\{todayQueueLength \? "review-today-due" : "review-today-empty"\}/,
  },
  {
    testId: "recent-mistakes",
    source: "src/components/review/recent-mistakes.tsx",
    pattern: /data-testid="recent-mistakes"/,
  },
  {
    testId: "recent-mistake-kana:a:hiragana-romaji",
    source: "src/components/review/recent-mistakes.tsx",
    pattern: /data-testid=\{`recent-mistake-\$\{mistake\.id\}`\}/,
  },
  {
    testId: "review-start-mistakes",
    source: "src/components/review/review-dashboard.tsx",
    pattern: /startTestId="review-start-mistakes"/,
  },
  {
    testId: "mistake-review-session",
    source: "src/components/review/mistake-review-session.tsx",
    pattern: /testId="mistake-review-session"/,
  },
  {
    testId: "review-remaining",
    source: "src/components/review/today-review-session.tsx",
    pattern: /data-testid="review-remaining"/,
  },
  {
    testId: "learning-data-panel",
    source: "src/components/review/learning-data-panel.tsx",
    pattern: /data-testid="learning-data-panel"/,
  },
  {
    testId: "learning-data-export",
    source: "src/components/review/learning-data-panel.tsx",
    pattern: /data-testid="learning-data-export"/,
  },
  {
    testId: "learning-data-import",
    source: "src/components/review/learning-data-panel.tsx",
    pattern: /data-testid="learning-data-import"/,
  },
  {
    testId: "learning-data-reset",
    source: "src/components/review/learning-data-panel.tsx",
    pattern: /data-testid="learning-data-reset"/,
  },
]

test("browser E2E uses only declared stable test ids", () => {
  const e2e = fs.readFileSync(path.join(root, "tests/e2e/browser.mjs"), "utf8")
  const used = Array.from(e2e.matchAll(/getByTestId\("([^"]+)"\)/g), (match) => match[1])
  assert.deepEqual(new Set(used), new Set(requiredSelectors.map((item) => item.testId)))
})

test("browser E2E can skip missing optional Playwright but has a required mode", () => {
  const e2e = fs.readFileSync(path.join(root, "tests/e2e/browser.mjs"), "utf8")
  const harness = fs.readFileSync(path.join(root, "tests/e2e/harness.mjs"), "utf8")
  const webPackage = fs.readFileSync(path.join(root, "package.json"), "utf8")

  assert.match(e2e, /isE2ERequired\("E2E_BROWSER_REQUIRED"\)/)
  assert.match(e2e, /importPlaywrightOrSkip/)
  assert.match(harness, /process\.argv\.includes\("--required"\)/)
  assert.match(harness, /process\.env\[envName\] === "1"/)
  assert.match(e2e, /Browser E2E skipped: Playwright is not installed/)
  assert.match(harness, /process\.exit\(0\)/)
  assert.match(harness, /process\.exit\(2\)/)
  assert.match(webPackage, /"e2e:browser": "node tests\/e2e\/browser\.mjs"/)
  assert.match(webPackage, /"e2e:browser:required": "node tests\/e2e\/browser\.mjs --required"/)
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

test("browser E2E verifies locked lesson previews stay read-only", () => {
  const e2e = fs.readFileSync(path.join(root, "tests/e2e/browser.mjs"), "utf8")

  assert.match(e2e, /localStorage\.clear\(\)/)
  assert.match(e2e, /\/learn\/day-2-ka-row-thanks/)
  assert.match(e2e, /getByTestId\("lesson-locked-preview"\)/)
  assert.match(e2e, /getByTestId\("lesson-answer-ka"\)/)
  assert.match(e2e, /isDisabled\(\)/)
  assert.match(e2e, /locked lesson preview should disable practice answers/)
  assert.match(e2e, /locked lesson preview should not start lesson progress/)
  assert.match(e2e, /locked lesson preview should not record practice history/)
  assert.match(e2e, /locked lesson preview should not enroll SRS/)
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
  assert.match(e2e, /getByTestId\("recent-mistakes"\)/)
  assert.match(e2e, /getByTestId\("recent-mistake-kana:a:hiragana-romaji"\)/)
  assert.match(e2e, /getByTestId\("review-start-mistakes"\)\.click\(\)/)
  assert.match(e2e, /getByTestId\("mistake-review-session"\)/)
})

test("browser E2E verifies review empty and due states", () => {
  const e2e = fs.readFileSync(path.join(root, "tests/e2e/browser.mjs"), "utf8")

  assert.match(e2e, /getByTestId\("review-empty-state"\)/)
  assert.match(e2e, /getByTestId\("review-today-empty"\)/)
  assert.match(e2e, /seedReviewState/)
  assert.match(e2e, /getByTestId\("review-due-state"\)/)
  assert.match(e2e, /getByTestId\("review-today-due"\)/)
  assert.match(e2e, /getByTestId\("review-start-today"\)\.click\(\)/)
})

test("browser E2E verifies learning data export reset and import through the UI", () => {
  const e2e = fs.readFileSync(path.join(root, "tests/e2e/browser.mjs"), "utf8")

  assert.match(e2e, /acceptDownloads: true/)
  assert.match(e2e, /seedLearningDataBackupState/)
  assert.match(e2e, /yasashi\.learning\.profile\.v1/)
  assert.match(e2e, /yasashi\.mistakes\.v1/)
  assert.match(e2e, /yasashi\.srs\.mistakes\.v1/)
  assert.match(e2e, /yasashi\.e2e\.unmanaged/)
  assert.match(e2e, /waitForEvent\("download"\)/)
  assert.match(e2e, /getByTestId\("learning-data-export"\)/)
  assert.match(e2e, /suggestedFilename\(\)/)
  assert.match(e2e, /getByTestId\("learning-data-reset"\)\.click\(\)/)
  assert.match(e2e, /waitForEvent\("filechooser"\)/)
  assert.match(e2e, /getByTestId\("learning-data-import"\)/)
  assert.match(e2e, /fileChooser\.setFiles\(backupPath\)/)
  assert.match(e2e, /learning data import should restore the profile backup/)
  assert.match(e2e, /learning data import should restore the mistake notebook backup/)
  assert.match(e2e, /learning data import should restore mistake SRS state/)
  assert.match(e2e, /learning data reset should leave unmanaged browser state alone/)
  assert.match(e2e, /learning data import should leave unmanaged browser state alone/)
})

test("browser E2E text assertions reject mojibake fallbacks", () => {
  const e2e = fs.readFileSync(path.join(root, "tests/e2e/browser.mjs"), "utf8")

  assert.match(e2e, /getByLabel\(\/Stroke order\|笔顺\/\)/)
  assert.match(e2e, /getByText\(\/得分:\/\)/)
  assert.doesNotMatch(e2e, /绗旈/)
  assert.doesNotMatch(e2e, /寰楀垎/)
})
