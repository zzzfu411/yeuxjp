import fs from "node:fs"
import path from "node:path"

export const root = path.resolve(import.meta.dirname, "..", "..")
export const browserE2EPath = path.join(root, "tests/e2e/browser.mjs")
export const browserFlowsPath = path.join(root, "tests/e2e/browser-flows.mjs")
export const browserFixturesPath = path.join(root, "tests/e2e/browser-fixtures.mjs")
export const browserFlowModulePaths = [
  "tests/e2e/browser-flow-lesson.mjs",
  "tests/e2e/browser-flow-content.mjs",
  "tests/e2e/browser-flow-quiz.mjs",
  "tests/e2e/browser-flow-review.mjs",
  "tests/e2e/browser-flow-learning-data.mjs",
  "tests/e2e/browser-flow-mobile.mjs",
]

export function readBrowserE2E() {
  return fs.readFileSync(browserE2EPath, "utf8")
}

export function readBrowserFixtures() {
  return fs.readFileSync(browserFixturesPath, "utf8")
}

export function readBrowserFlows() {
  return fs.readFileSync(browserFlowsPath, "utf8")
}

export function readBrowserFlowModules() {
  return browserFlowModulePaths.map((modulePath) => fs.readFileSync(path.join(root, modulePath), "utf8"))
}

export function readBrowserE2ESources() {
  return [readBrowserE2E(), readBrowserFlows(), ...readBrowserFlowModules(), readBrowserFixtures()].join("\n")
}

export function readE2EHarness() {
  return fs.readFileSync(path.join(root, "tests/e2e/harness.mjs"), "utf8")
}

export function readSource(source) {
  return fs.readFileSync(path.join(root, source), "utf8")
}

export function readWebPackage() {
  return fs.readFileSync(path.join(root, "package.json"), "utf8")
}

export const requiredSelectors = [
  {
    testId: "home-start-learning",
    source: "src/components/home/home-page.tsx",
    pattern: /data-testid="home-start-learning"/,
  },
  {
    testId: "path-next-learning",
    source: "src/components/path/skill-tree-page.tsx",
    pattern: /data-testid="path-next-learning"/,
  },
  {
    testId: "lesson-next",
    source: "src/components/lesson/lesson-navigation-bar.tsx",
    pattern: /data-testid="lesson-next"/,
  },
  {
    testId: "lesson-locked-preview",
    source: "src/components/lesson/lesson-locked-preview.tsx",
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
    testId: `lesson-answer-${String.fromCodePoint(0x304a)}`,
    source: "src/components/lesson/lesson-step-body.tsx",
    pattern: /data-testid=\{`lesson-answer-\$\{option\}`\}/,
  },
  {
    testId: "lesson-typing-input",
    source: "src/components/lesson/lesson-step-body.tsx",
    pattern: /data-testid="lesson-typing-input"/,
  },
  {
    testId: "lesson-submit-typing",
    source: "src/components/lesson/lesson-step-body.tsx",
    pattern: /data-testid="lesson-submit-typing"/,
  },
  {
    testId: "lesson-completed-summary",
    source: "src/components/lesson/lesson-runner.tsx",
    pattern: /data-testid="lesson-completed-summary"/,
  },
  {
    testId: "lesson-review-link",
    source: "src/components/lesson/lesson-navigation-bar.tsx",
    pattern: /data-testid="lesson-review-link"/,
  },
  {
    testId: "lesson-next-lesson-link",
    source: "src/components/lesson/lesson-navigation-bar.tsx",
    pattern: /data-testid="lesson-next-lesson-link"/,
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
    testId: "kana-stroke-board",
    source: "src/components/kana/kana-glyph-board.tsx",
    pattern: /data-testid=\{label \? "kana-stroke-board" : undefined\}/,
  },
  {
    testId: "kana-mastery-toggle",
    source: "src/components/kana/kana-detail-modal.tsx",
    pattern: /data-testid="kana-mastery-toggle"/,
  },
  {
    testId: "vocabulary-search",
    source: "src/components/vocabulary/vocabulary-toolbar.tsx",
    pattern: /data-testid="vocabulary-search"/,
  },
  {
    testId: "vocabulary-expand-sur-n-35",
    source: "src/components/vocabulary/flashcard.tsx",
    pattern: /data-testid=\{`vocabulary-expand-\$\{vocab\.id\}`\}/,
  },
  {
    testId: "vocabulary-focus-card",
    source: "src/components/vocabulary/vocabulary-focus-modal.tsx",
    pattern: /data-testid="vocabulary-focus-card"/,
  },
  {
    testId: "vocabulary-learned-toggle",
    source: "src/components/vocabulary/vocabulary-focus-modal.tsx",
    pattern: /data-testid="vocabulary-learned-toggle"/,
  },
  {
    testId: "vocabulary-level-daily",
    source: "src/components/vocabulary/vocabulary-toolbar.tsx",
    pattern: /data-testid=\{`vocabulary-level-\$\{level\.id\}`\}/,
  },
  {
    testId: "vocabulary-level-fluent",
    source: "src/components/vocabulary/vocabulary-toolbar.tsx",
    pattern: /data-testid=\{`vocabulary-level-\$\{level\.id\}`\}/,
  },
  {
    testId: "quiz-mode-hiragana-romaji",
    source: "src/lib/quiz-mode-options.ts",
    pattern: /testId: "quiz-mode-hiragana-romaji"/,
  },
  {
    testId: "quiz-mode-audio-kana",
    source: "src/lib/quiz-mode-options.ts",
    pattern: /testId: "quiz-mode-audio-kana"/,
  },
  {
    testId: "quiz-mode-particle",
    source: "src/lib/quiz-mode-options.ts",
    pattern: /testId: "quiz-mode-particle"/,
  },
  {
    testId: "quiz-mode-verb-conjugation",
    source: "src/lib/quiz-mode-options.ts",
    pattern: /testId: "quiz-mode-verb-conjugation"/,
  },
  {
    testId: "quiz-mode-audio-sokuon",
    source: "src/lib/quiz-mode-options.ts",
    pattern: /testId: "quiz-mode-audio-sokuon"/,
  },
  {
    testId: "quiz-mode-audio-longvowel",
    source: "src/lib/quiz-mode-options.ts",
    pattern: /testId: "quiz-mode-audio-longvowel"/,
  },
  {
    testId: "quiz-mode-meaning-vocab",
    source: "src/lib/quiz-mode-options.ts",
    pattern: /testId: "quiz-mode-meaning-vocab"/,
  },
  {
    testId: "quiz-score",
    source: "src/components/quiz/quiz-runner.tsx",
    pattern: /data-testid="quiz-score"/,
  },
  {
    testId: "quiz-question-text",
    source: "src/components/quiz/quiz-question-prompt.tsx",
    pattern: /data-testid="quiz-question-text"/,
  },
  {
    testId: "quiz-only-unmastered-kana",
    source: "src/components/quiz/quiz-scope-controls.tsx",
    pattern: /data-testid="quiz-only-unmastered-kana"/,
  },
  {
    testId: "quiz-empty-state",
    source: "src/components/quiz/quiz-empty-state.tsx",
    pattern: /data-testid="quiz-empty-state"/,
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
    testId: "review-answer-a",
    source: "src/components/review/review-option-grid.tsx",
    pattern: /data-testid=\{`review-answer-\$\{option\.value\}`\}/,
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
    testId: "learning-data-notice",
    source: "src/components/review/learning-data-panel.tsx",
    pattern: /data-testid="learning-data-notice"/,
  },
  {
    testId: "learning-data-reset",
    source: "src/components/review/learning-data-panel.tsx",
    pattern: /data-testid="learning-data-reset"/,
  },
]

export const dynamicSelectorContracts = [
  {
    label: "quiz answer options",
    source: "src/components/quiz/quiz-option-grid.tsx",
    pattern: /data-testid=\{`quiz-answer-option-\$\{index\}`\}/,
  },
  {
    label: "recent mistake rows",
    source: "src/components/review/recent-mistakes.tsx",
    pattern: /data-testid=\{`recent-mistake-\$\{mistake\.id\}`\}/,
  },
]
