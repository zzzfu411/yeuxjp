import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

const requiredSelectors = [
  {
    testId: "home-start-learning",
    source: "src/components/home/home-page.tsx",
    pattern: /data-testid="home-start-learning"/,
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
    testId: "lesson-answer-お",
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

const dynamicSelectorContracts = [
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
  assert.match(e2e, /skipOptionalPlaywrightRuntimeError/)
  assert.match(harness, /process\.argv\.includes\("--required"\)/)
  assert.match(harness, /process\.env\[envName\] === "1"/)
  assert.match(e2e, /Browser E2E skipped: Playwright is not installed/)
  assert.match(e2e, /Browser E2E skipped: Playwright browser binaries are not installed/)
  assert.match(harness, /process\.exit\(0\)/)
  assert.match(harness, /process\.exit\(2\)/)
  assert.match(webPackage, /"e2e:install": "playwright install chromium"/)
  assert.match(webPackage, /"e2e:browser": "node tests\/e2e\/browser\.mjs"/)
  assert.match(webPackage, /"e2e:browser:required": "node tests\/e2e\/browser\.mjs --required"/)
})

test("browser E2E test ids remain present in source files", () => {
  for (const item of requiredSelectors) {
    const source = fs.readFileSync(path.join(root, item.source), "utf8")
    assert.match(source, item.pattern, `${item.testId} should be declared in ${item.source}`)
  }
  for (const item of dynamicSelectorContracts) {
    const source = fs.readFileSync(path.join(root, item.source), "utf8")
    assert.match(source, item.pattern, `${item.label} should be declared in ${item.source}`)
  }
})

test("browser E2E verifies lesson progress writes after a real answer", () => {
  const e2e = fs.readFileSync(path.join(root, "tests/e2e/browser.mjs"), "utf8")

  assert.match(e2e, /readJsonStorage/)
  assert.match(e2e, /yasashi\.learning\.lessons\.v1/)
  assert.match(e2e, /currentStepIndex/)
  assert.match(e2e, /lastStepId/)
  assert.match(e2e, /hello-example/)
  assert.match(e2e, /recognize-a/)
  assert.match(e2e, /waitForFunction/)
  assert.match(e2e, /page\.reload\(\{ waitUntil: "networkidle" \}\)/)
  assert.match(e2e, /lesson-answer-a"\)\.waitFor\(\{ state: "visible" \}\)/)
  assert.match(e2e, /yasashi\.learning\.practice\.v1/)
  assert.match(e2e, /yasashi\.learning\.items\.v1/)
  assert.match(e2e, /yasashi\.srs\.kana\.v1/)
  assert.match(e2e, /lessonId === "day-1-a-row-hello"/)
  assert.match(e2e, /itemId === "a"/)
  assert.match(e2e, /item\.correct === true/)
  assert.match(e2e, /correct kana lesson answer should enroll SRS/)
  assert.match(e2e, /getByTestId\("lesson-answer-お"\)/)
  assert.match(e2e, /getByTestId\("lesson-typing-input"\)\.fill\("こんにちは"\)/)
  assert.match(e2e, /getByTestId\("lesson-submit-typing"\)\.click\(\)/)
  assert.match(e2e, /getByTestId\("lesson-completed-summary"\)/)
  assert.match(e2e, /status,\s*"completed"/)
  assert.match(e2e, /finishing the first lesson should mark it completed/)
  assert.match(e2e, /getByTestId\("lesson-review-link"\)/)
  assert.match(e2e, /getByTestId\("lesson-next-lesson-link"\)/)
  assert.match(e2e, /\/learn\/day-2-ka-row-thanks/)
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

  assert.match(e2e, /seionHiraganaToRomaji/)
  assert.match(e2e, /getByTestId\("quiz-question-text"\)/)
  assert.match(e2e, /querySelectorAll\('\[data-testid\^="quiz-answer-option-"\]'\)/)
  assert.match(e2e, /page\.getByTestId\(wrongOption\)\.click\(\)/)
  assert.match(e2e, /yasashi\.mistakes\.v1/)
  assert.match(e2e, /item\.type === "hiragana-romaji"/)
  assert.match(e2e, /item\.questionText === quizPrompt/)
  assert.match(e2e, /item\.correctAnswer === expectedAnswer/)
  assert.match(e2e, /wrong quiz answer should record the current kana prompt in mistakes/)
  assert.match(e2e, /getByTestId\("recent-mistakes"\)/)
  assert.match(e2e, /recent-mistake-\$\{recordedQuizMistake\.id\}/)
  assert.match(e2e, /getByTestId\("review-start-mistakes"\)\.click\(\)/)
  assert.match(e2e, /getByTestId\("mistake-review-session"\)/)
})

test("browser E2E verifies mastered kana filters show the quiz empty state", () => {
  const e2e = fs.readFileSync(path.join(root, "tests/e2e/browser.mjs"), "utf8")

  assert.match(e2e, /getByTestId\("kana-mastery-toggle"\)\.click\(\)/)
  assert.match(e2e, /yasashi\.kana\.mastered\.v1/)
  assert.match(e2e, /masteredKana\.includes\("a"\)/)
  assert.match(e2e, /masteredKanaSrs\?\.a\?\.dueAt/)
  assert.match(e2e, /const seionRomaji = \[/)
  assert.match(e2e, /JSON\.stringify\(masteredIds\)/)
  assert.match(e2e, /getByTestId\("quiz-only-unmastered-kana"\)\.click\(\)/)
  assert.match(e2e, /getByTestId\("quiz-empty-state"\)\.waitFor\(\{ state: "visible" \}\)/)
})

test("browser E2E verifies review empty and due states", () => {
  const e2e = fs.readFileSync(path.join(root, "tests/e2e/browser.mjs"), "utf8")

  assert.match(e2e, /getByTestId\("review-empty-state"\)/)
  assert.match(e2e, /getByTestId\("review-today-empty"\)/)
  assert.match(e2e, /seedReviewState/)
  assert.match(e2e, /getByTestId\("review-due-state"\)/)
  assert.match(e2e, /getByTestId\("review-today-due"\)/)
  assert.match(e2e, /getByTestId\("review-start-today"\)\.click\(\)/)
  assert.match(e2e, /getByTestId\("review-answer-a"\)\.click\(\)/)
  assert.match(e2e, /reviewedKanaSrs\?\.a\?\.box > 1/)
  assert.match(e2e, /reviewedKanaSrs\?\.a\?\.right >= 1/)
  assert.match(e2e, /correct review answer should write practice history/)
})

test("browser E2E includes a mobile viewport smoke pass for core routes", () => {
  const e2e = fs.readFileSync(path.join(root, "tests/e2e/browser.mjs"), "utf8")

  assert.match(e2e, /mobileContext = await browser\.newContext/)
  assert.match(e2e, /viewport: \{ width: 390, height: 844 \}/)
  assert.match(e2e, /isMobile: true/)
  assert.match(e2e, /hasTouch: true/)
  assert.match(e2e, /const mobilePage = await mobileContext\.newPage\(\)/)
  assert.match(e2e, /mobilePage\.goto\(baseUrl/)
  assert.match(e2e, /mobilePage\.goto\(`\$\{baseUrl\}\/kana`/)
  assert.match(e2e, /mobilePage\.goto\(`\$\{baseUrl\}\/quiz`/)
  assert.match(e2e, /mobilePage\.goto\(`\$\{baseUrl\}\/review`/)
  assert.match(e2e, /mobileContext\?\.close\(\)/)
})

test("browser E2E verifies non-default vocabulary levels load dynamically", () => {
  const e2e = fs.readFileSync(path.join(root, "tests/e2e/browser.mjs"), "utf8")

  assert.match(e2e, /getByTestId\("vocabulary-expand-sur-n-35"\)\.click\(\)/)
  assert.match(e2e, /getByTestId\("vocabulary-focus-card"\)\.click\(\)/)
  assert.match(e2e, /getByTestId\("vocabulary-learned-toggle"\)\.click\(\)/)
  assert.match(e2e, /yasashi\.vocab\.learned\.v1/)
  assert.match(e2e, /learnedVocab\.includes\("sur-n-35"\)/)
  assert.match(e2e, /vocabSrs\?\.\["sur-n-35"\]\?\.dueAt/)
  assert.match(e2e, /getByTestId\("vocabulary-level-daily"\)\.click\(\)/)
  assert.match(e2e, /getByTestId\("vocabulary-level-fluent"\)\.click\(\)/)
  assert.match(e2e, /fill\("Yakusoku"\)/)
  assert.match(e2e, /fill\("Gainen"\)/)
  assert.match(e2e, /getByText\("約束"\)\.first\(\)\.waitFor\(\{ state: "visible" \}\)/)
  assert.match(e2e, /getByText\("概念"\)\.first\(\)\.waitFor\(\{ state: "visible" \}\)/)
})

test("browser E2E verifies learning data export reset and import through the UI", () => {
  const e2e = fs.readFileSync(path.join(root, "tests/e2e/browser.mjs"), "utf8")

  assert.match(e2e, /acceptDownloads: true/)
  assert.match(e2e, /import fs from "node:fs\/promises"/)
  assert.match(e2e, /seedLearningDataBackupState/)
  assert.match(e2e, /const managedLearningBackupKeys = \[/)
  assert.match(e2e, /yasashi\.learning\.profile\.v1/)
  assert.match(e2e, /yasashi\.learning\.lessons\.v1/)
  assert.match(e2e, /yasashi\.learning\.items\.v1/)
  assert.match(e2e, /yasashi\.learning\.practice\.v1/)
  assert.match(e2e, /yasashi\.srs\.kana\.v1/)
  assert.match(e2e, /yasashi\.srs\.vocab\.v1/)
  assert.match(e2e, /yasashi\.mistakes\.v1/)
  assert.match(e2e, /yasashi\.srs\.mistakes\.v1/)
  assert.match(e2e, /yasashi\.kana\.mastered\.v1/)
  assert.match(e2e, /yasashi\.vocab\.learned\.v1/)
  assert.match(e2e, /yasashi\.speech\.prefs\.v1/)
  assert.match(e2e, /readManagedLearningBackupSnapshot/)
  assert.match(e2e, /assertManagedLearningSnapshot/)
  assert.match(e2e, /yasashi\.e2e\.unmanaged/)
  assert.match(e2e, /waitForEvent\("download"\)/)
  assert.match(e2e, /getByTestId\("learning-data-export"\)/)
  assert.match(e2e, /suggestedFilename\(\)/)
  assert.match(e2e, /yasashi-learning-backup-\\d\{4\}-\\d\{2\}-\\d\{2\}-\\d\{2\}-\\d\{2\}-\\d\{2\}/)
  assert.match(e2e, /JSON\.parse\(await fs\.readFile\(backupPath, "utf8"\)\)/)
  assert.match(e2e, /exportedBackup\.version/)
  assert.match(e2e, /learning data export should include every managed learning key/)
  assert.match(e2e, /getByTestId\("learning-data-reset"\)\.click\(\)/)
  assert.match(e2e, /keys\.every\(\(key\) => localStorage\.getItem\(key\) === null\)/)
  assert.match(e2e, /learning data reset should clear managed learning key/)
  assert.match(e2e, /waitForEvent\("filechooser"\)/)
  assert.match(e2e, /getByTestId\("learning-data-import"\)/)
  assert.match(e2e, /invalid-yasashi-backup\.json/)
  assert.match(e2e, /querySelector\('\[data-testid="learning-data-notice"\]'\)\?\.getAttribute\("data-tone"\) === "error"/)
  assert.match(e2e, /getByTestId\("learning-data-notice"\)/)
  assert.match(e2e, /invalid learning data import should not overwrite managed learning keys/)
  assert.match(e2e, /fileChooser\.setFiles\(backupPath\)/)
  assert.match(e2e, /keys\.every\(\(key\) => localStorage\.getItem\(key\) !== null\)/)
  assert.match(e2e, /learning data import should restore every managed learning key/)
  assert.match(e2e, /learning data import should restore the profile backup/)
  assert.match(e2e, /learning data import should restore the mistake notebook backup/)
  assert.match(e2e, /learning data import should restore mistake SRS state/)
  assert.match(e2e, /learning data reset should leave unmanaged browser state alone/)
  assert.match(e2e, /learning data import should leave unmanaged browser state alone/)
})

test("browser E2E text assertions reject mojibake fallbacks", () => {
  const e2e = fs.readFileSync(path.join(root, "tests/e2e/browser.mjs"), "utf8")

  assert.match(e2e, /getByTestId\("kana-stroke-board"\)/)
  assert.match(e2e, /getByText\(\/得分:\/\)/)
  assert.doesNotMatch(e2e, /绗旈/) // mojibake-ok detector fixture
  assert.doesNotMatch(e2e, /寰楀垎/) // mojibake-ok detector fixture
})
