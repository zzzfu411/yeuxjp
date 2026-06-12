import assert from "node:assert/strict"
import test from "node:test"

import {
  browserFixtureModulePaths,
  browserFlowModulePaths,
  dynamicSelectorContracts,
  readBrowserE2E,
  readBrowserFixtureEntry,
  readBrowserFixtureModules,
  readBrowserFlowModules,
  readBrowserE2ESources,
  readBrowserFlows,
  readBrowserFixtures,
  readE2EHarness,
  readSource,
  readWebPackage,
  requiredSelectors,
} from "./browser-e2e-contract-fixtures.mjs"

test("browser E2E uses only declared stable test ids", () => {
  const sources = readBrowserE2ESources()
  const used = Array.from(sources.matchAll(/getByTestId\("([^"]+)"\)/g), (match) => match[1])
  assert.deepEqual(new Set(used), new Set(requiredSelectors.map((item) => item.testId)))
})

test("browser E2E can skip missing optional Playwright but has a required mode", () => {
  const e2e = readBrowserE2E()
  const harness = readE2EHarness()
  const webPackage = readWebPackage()

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

test("browser E2E entry delegates click flows to flow helpers", () => {
  const e2e = readBrowserE2E()
  const flows = readBrowserFlows()
  const flowModules = readBrowserFlowModules().join("\n")
  const helperNames = [
    "verifyLessonFlow",
    "verifyInitialReviewEmptyState",
    "verifyKanaAndVocabularyFlow",
    "verifyQuizAndMistakeFlow",
    "verifyDueReviewFlow",
    "verifyLearningDataFlow",
    "verifyMobileSmoke",
  ]

  assert.match(e2e, /from "\.\/browser-flows\.mjs"/)
  assert.doesNotMatch(flows, /page\.goto\(/)
  assert.doesNotMatch(flows, /getByTestId\(/)
  for (const helperName of helperNames) {
    assert.match(e2e, new RegExp(`\\b${helperName}\\b`), `${helperName} should be imported by the E2E entry`)
    assert.match(e2e, new RegExp(`await ${helperName}\\(`), `${helperName} should be called by the E2E entry`)
    assert.match(
      flowModules,
      new RegExp(`export async function ${helperName}\\(`),
      `${helperName} should be implemented in a browser flow module`
    )
  }
  assert.doesNotMatch(e2e, /getByTestId\("lesson-answer-a"\)/)
  assert.match(flowModules, /getByTestId\("lesson-answer-a"\)/)
  assert.ok(browserFlowModulePaths.length > 1, "browser flow implementations should stay split by concern")
})

test("browser E2E fixtures stay split by concern behind a stable export surface", () => {
  const fixtureEntry = readBrowserFixtureEntry()
  const fixtureModules = readBrowserFixtureModules().join("\n")

  assert.match(fixtureEntry, /browser-fixture-kana\.mjs/)
  assert.match(fixtureEntry, /browser-fixture-review\.mjs/)
  assert.match(fixtureEntry, /browser-fixture-learning-data\.mjs/)
  assert.match(fixtureEntry, /browser-fixture-quiz\.mjs/)
  assert.doesNotMatch(fixtureEntry, /page\.goto\(/)
  assert.doesNotMatch(fixtureEntry, /localStorage\.setItem/)
  assert.match(fixtureModules, /export const seionHiraganaToRomaji = Object\.fromEntries/)
  assert.match(fixtureModules, /export async function seedLearningDataBackupState\(page, baseUrl\)/)
  assert.match(fixtureModules, /export async function openQuizMode\(page, baseUrl, mode\)/)
  assert.ok(browserFixtureModulePaths.length > 1, "browser fixture implementations should stay split by concern")
})

test("browser E2E test ids remain present in source files", () => {
  for (const item of requiredSelectors) {
    const source = readSource(item.source)
    assert.match(source, item.pattern, `${item.testId} should be declared in ${item.source}`)
  }
  for (const item of dynamicSelectorContracts) {
    const source = readSource(item.source)
    assert.match(source, item.pattern, `${item.label} should be declared in ${item.source}`)
  }
})

test("browser E2E verifies lesson progress writes after a real answer", () => {
  const e2e = readBrowserE2ESources()

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
  assert.match(e2e, /getByTestId\("home-start-learning"\)\.getAttribute\("href"\)/)
  assert.match(e2e, /home start learning should recommend the next unlocked lesson after completing day 1/)
  assert.match(e2e, /page\.goto\(`\$\{baseUrl\}\/path`/)
  assert.match(e2e, /getByTestId\("path-next-learning"\)\.getAttribute\("href"\)/)
  assert.match(e2e, /path next step should recommend the next unlocked lesson after completing day 1/)
})

test("browser E2E verifies locked lesson previews stay read-only", () => {
  const e2e = readBrowserE2ESources()

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
  const e2e = readBrowserE2ESources()
  const fixtures = readBrowserFixtures()

  assert.match(e2e, /seionHiraganaToRomaji/)
  assert.match(fixtures, /export const seionHiraganaToRomaji = Object\.fromEntries/)
  assert.match(e2e, /from "\.\/browser-fixtures\.mjs"/)
  assert.match(e2e, /openQuizMode\(page, baseUrl, "hiragana-romaji"\)/)
  assert.match(fixtures, /export async function openQuizMode\(page, baseUrl, mode\)/)
  assert.match(e2e, /getByTestId\("quiz-score"\)/)
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

test("browser E2E verifies correct mistake reviews retain notebook history", () => {
  const e2e = readBrowserE2ESources()
  const fixtures = readBrowserFixtures()

  assert.match(e2e, /seedDueMistakeReviewState\(page, baseUrl\)/)
  assert.match(fixtures, /export async function seedDueMistakeReviewState\(page, baseUrl\)/)
  assert.match(fixtures, /"e2e-mistake:kana-a"/)
  assert.match(fixtures, /"yasashi\.srs\.mistakes\.v1"/)
  assert.match(e2e, /getByTestId\("review-start-mistakes"\)\.click\(\)/)
  assert.match(e2e, /getByTestId\("review-answer-a"\)\.click\(\)/)
  assert.match(e2e, /item\?\.wrongCount === 2/)
  assert.match(e2e, /srs\?\.\["e2e-mistake:kana-a"\]\?\.box > 1/)
  assert.match(e2e, /correct mistake review should retain the historical mistake count/)
  assert.match(e2e, /correct mistake review should advance mistake SRS without deleting notebook history/)
})

test("browser E2E verifies every public quiz mode records practice", () => {
  const e2e = readBrowserE2ESources()
  const fixtures = readBrowserFixtures()

  assert.match(e2e, /assertQuizModeRecordsPractice\(page, baseUrl/)
  assert.match(fixtures, /export async function resetQuizLearningState/)
  assert.match(fixtures, /export async function openQuizMode\(page, baseUrl, mode\)/)
  assert.match(fixtures, /export async function clickFirstQuizOptionAndReadPractice/)
  assert.match(fixtures, /export async function assertQuizModeRecordsPractice/)
  assert.match(fixtures, /localStorage\.setItem\("yasashi\.speech\.prefs\.v1"/)
  assert.match(fixtures, /getByTestId\("quiz-mode-audio-kana"\)/)
  assert.match(fixtures, /getByTestId\("quiz-mode-particle"\)/)
  assert.match(fixtures, /getByTestId\("quiz-mode-verb-conjugation"\)/)
  assert.match(fixtures, /getByTestId\("quiz-mode-audio-sokuon"\)/)
  assert.match(fixtures, /getByTestId\("quiz-mode-audio-longvowel"\)/)
  assert.match(fixtures, /getByTestId\("quiz-mode-meaning-vocab"\)/)
  assert.match(fixtures, /item\.itemType === itemType && item\.mode === practiceMode/)
  assert.match(e2e, /"audio-kana"[\s\S]*"kana"[\s\S]*"listening"/)
  assert.match(e2e, /"particle"[\s\S]*"grammar"[\s\S]*"recognition"/)
  assert.match(e2e, /"verb-conjugation"[\s\S]*"grammar"[\s\S]*"production"/)
  assert.match(e2e, /"audio-sokuon"[\s\S]*"kana"[\s\S]*"listening"/)
  assert.match(e2e, /"audio-longvowel"[\s\S]*"kana"[\s\S]*"listening"/)
  assert.match(e2e, /"meaning-vocab"[\s\S]*"vocab"[\s\S]*"meaning"/)
})

test("browser E2E verifies mastered kana filters show the quiz empty state", () => {
  const e2e = readBrowserE2ESources()
  const fixtures = readBrowserFixtures()

  assert.match(e2e, /getByTestId\("kana-mastery-toggle"\)\.click\(\)/)
  assert.match(e2e, /yasashi\.kana\.mastered\.v1/)
  assert.match(e2e, /masteredKana\.includes\("a"\)/)
  assert.match(e2e, /masteredKanaSrs\?\.a\?\.dueAt/)
  assert.match(fixtures, /export const seionRomaji = \[/)
  assert.match(e2e, /JSON\.stringify\(masteredIds\)/)
  assert.match(e2e, /getByTestId\("quiz-only-unmastered-kana"\)\.click\(\)/)
  assert.match(e2e, /getByTestId\("quiz-empty-state"\)\.waitFor\(\{ state: "visible" \}\)/)
})

test("browser E2E verifies kana and vocabulary reset confirmations", () => {
  const e2e = readBrowserE2ESources()

  assert.match(e2e, /getByTestId\("kana-clear-progress"\)\.click\(\)/)
  assert.match(e2e, /getByTestId\("kana-clear-progress-dialog-confirm"\)\.click\(\)/)
  assert.match(e2e, /canceling kana progress reset should keep mastered kana/)
  assert.match(e2e, /mastered\.length === 0/)
  assert.match(e2e, /getByTestId\("vocabulary-clear-progress"\)\.click\(\)/)
  assert.match(e2e, /getByTestId\("vocabulary-clear-progress-dialog-confirm"\)\.click\(\)/)
  assert.match(e2e, /canceling vocabulary progress reset should keep learned vocabulary/)
  assert.match(e2e, /learned\.length === 0/)
})

test("browser E2E verifies modal accessible names and tab focus trapping", () => {
  const e2e = readBrowserE2ESources()

  assert.match(e2e, /readDialogFocusState/)
  assert.match(e2e, /verifyDialogHasAccessibleName/)
  assert.match(e2e, /verifyDialogTabTrap/)
  assert.match(e2e, /role="dialog"\]\[aria-modal="true"/)
  assert.match(e2e, /aria-labelledby/)
  assert.match(e2e, /titleText\.length > 0/)
  assert.match(e2e, /keyboard\.press\("Shift\+Tab"\)/)
  assert.match(e2e, /keyboard\.press\("Tab"\)/)
  assert.match(e2e, /activeIndex,\s*initial\.focusableCount - 1/)
  assert.match(e2e, /activeIndex,\s*0/)
  assert.match(e2e, /kana detail modal/)
  assert.match(e2e, /vocabulary focus modal/)
})

test("browser E2E verifies review empty and due states", () => {
  const e2e = readBrowserE2ESources()
  const fixtures = readBrowserFixtures()

  assert.match(e2e, /getByTestId\("review-empty-state"\)/)
  assert.match(e2e, /getByTestId\("review-today-empty"\)/)
  assert.match(e2e, /seedReviewState/)
  assert.match(fixtures, /export async function seedReviewState\(page, baseUrl\)/)
  assert.match(e2e, /getByTestId\("review-due-state"\)/)
  assert.match(e2e, /getByTestId\("review-today-due"\)/)
  assert.match(e2e, /getByTestId\("review-start-today"\)\.click\(\)/)
  assert.match(e2e, /getByTestId\("review-answer-a"\)\.click\(\)/)
  assert.match(e2e, /reviewedKanaSrs\?\.a\?\.box > 1/)
  assert.match(e2e, /reviewedKanaSrs\?\.a\?\.right >= 1/)
  assert.match(e2e, /correct review answer should write practice history/)
})

test("browser E2E includes a mobile viewport smoke pass for core routes", () => {
  const e2e = readBrowserE2ESources()

  assert.match(e2e, /mobileContext = await browser\.newContext/)
  assert.match(e2e, /viewport: \{ width: 390, height: 844 \}/)
  assert.match(e2e, /isMobile: true/)
  assert.match(e2e, /hasTouch: true/)
  assert.match(e2e, /const mobilePage = await mobileContext\.newPage\(\)/)
  assert.match(e2e, /mobilePage\.goto\(baseUrl/)
  assert.match(e2e, /mobilePage\.goto\(`\$\{baseUrl\}\/kana`/)
  assert.match(e2e, /mobilePage\.goto\(`\$\{baseUrl\}\/quiz`/)
  assert.match(e2e, /mobilePage\.goto\(`\$\{baseUrl\}\/review`/)
  assert.match(e2e, /mobileContext\.close\(\)/)
})

test("browser E2E verifies non-default vocabulary levels load dynamically", () => {
  const e2e = readBrowserE2ESources()

  assert.match(e2e, /getByTestId\("vocabulary-expand-sur-n-35"\)\.click\(\)/)
  assert.match(e2e, /getByTestId\("vocabulary-focus-card"\)\.focus\(\)/)
  assert.match(e2e, /keyboard\.press\("Space"\)/)
  assert.match(e2e, /getByTestId\("vocabulary-learned-toggle"\)\.waitFor\(\{ state: "visible" \}\)/)
  assert.match(e2e, /getByTestId\("vocabulary-learned-toggle"\)\.focus\(\)/)
  assert.match(e2e, /vocabulary learned toggle should support keyboard activation without flipping the modal/)
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
  const e2e = readBrowserE2ESources()
  const fixtures = readBrowserFixtures()

  assert.match(e2e, /acceptDownloads: true/)
  assert.match(e2e, /import fs from "node:fs\/promises"/)
  assert.match(e2e, /seedLearningDataBackupState/)
  assert.match(fixtures, /export async function seedLearningDataBackupState\(page, baseUrl\)/)
  assert.match(fixtures, /export const managedLearningBackupKeys = \[/)
  assert.match(fixtures, /yasashi\.learning\.profile\.v1/)
  assert.match(fixtures, /yasashi\.learning\.lessons\.v1/)
  assert.match(fixtures, /yasashi\.learning\.items\.v1/)
  assert.match(fixtures, /yasashi\.learning\.practice\.v1/)
  assert.match(fixtures, /yasashi\.srs\.kana\.v1/)
  assert.match(fixtures, /yasashi\.srs\.vocab\.v1/)
  assert.match(fixtures, /yasashi\.mistakes\.v1/)
  assert.match(fixtures, /yasashi\.srs\.mistakes\.v1/)
  assert.match(fixtures, /yasashi\.kana\.mastered\.v1/)
  assert.match(fixtures, /yasashi\.vocab\.learned\.v1/)
  assert.match(fixtures, /yasashi\.speech\.prefs\.v1/)
  assert.match(e2e, /readManagedLearningBackupSnapshot/)
  assert.match(e2e, /assertManagedLearningSnapshot/)
  assert.match(fixtures, /yasashi\.e2e\.unmanaged/)
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
  assert.match(e2e, /malformed-yasashi-backup\.json/)
  assert.match(e2e, /yasashi\.kana\.mastered\.v1/)
  assert.match(e2e, /yasashi\.srs\.kana\.v1/)
  assert.match(e2e, /malformed but valid JSON backup import should not overwrite managed learning keys/)
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
  const e2e = readBrowserE2ESources()

  assert.match(e2e, /getByTestId\("kana-stroke-board"\)/)
  assert.match(e2e, /getByTestId\("quiz-score"\)/)
  assert.doesNotMatch(e2e, /绗旈/) // mojibake-ok detector fixture
  assert.doesNotMatch(e2e, /寰楀垎/) // mojibake-ok detector fixture
})
