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
  readE2EStorageKeys,
  readE2EHarness,
  readSource,
  readWebPackage,
  requiredSelectors,
} from "./browser-e2e-contract-fixtures.mjs"
import { loadTsModule } from "./load-ts-module.mjs"

const storage = await loadTsModule("src/lib/storage-keys.ts")

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
  assert.match(e2e, /startProductionServer/)
  assert.match(e2e, /const serverStarter = browserE2ERequired \? startProductionServer : reuseOrStartDevServer/)
  assert.match(e2e, /label: "browser production e2e"/)
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
    "verifyReferenceKeyboardFlow",
    "verifyQuizAndMistakeFlow",
    "verifyDueReviewFlow",
    "verifyProfileSaveFailureFlow",
    "verifyPracticeSaveFailureFlow",
    "verifyProgressSaveFailureFlow",
    "verifySpeechPreferenceSaveFailureFlow",
    "verifyLearningDataFlow",
    "verifyPwaUpdateBannerFlow",
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

test("browser E2E centralizes learning storage keys", () => {
  const storageKeys = readE2EStorageKeys()
  const e2eSources = readBrowserE2ESources()
  const expectedKeys = Object.values(storage.STORAGE_KEYS)
  const allowedKeySource = /tests\/e2e\/storage-keys\.mjs$/
  const hardCodedStorageKey = /["'`]yasashi\.[a-z0-9.]+\.v1["'`]/g

  assert.match(storageKeys, /export const E2E_STORAGE_KEYS/)
  assert.deepEqual(
    Array.from(storageKeys.matchAll(/:\s*"([^"]+)"/g), (match) => match[1]).sort(),
    expectedKeys.sort()
  )
  assert.match(e2eSources, /E2E_STORAGE_KEYS/)
  for (const modulePath of [...browserFlowModulePaths, ...browserFixtureModulePaths, "tests/e2e/pwa-offline.mjs"]) {
    if (allowedKeySource.test(modulePath)) continue
    const source = readSource(modulePath)
    assert.deepEqual(
      source.match(hardCodedStorageKey) ?? [],
      [],
      `${modulePath} should import E2E_STORAGE_KEYS instead of hard-coding learning storage keys`
    )
  }
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
  assert.match(e2e, /getByTestId\("onboarding-goal-travel"\)\.click\(\)/)
  assert.match(e2e, /getByTestId\("onboarding-some"\)\.click\(\)/)
  assert.match(e2e, /getByTestId\("onboarding-always"\)\.click\(\)/)
  assert.match(e2e, /getByTestId\("onboarding-minutes"\)\.focus\(\)/)
  assert.match(e2e, /keyboard\.press\("ArrowRight"\)/)
  assert.match(e2e, /getByTestId\("onboarding-save"\)\.click\(\)/)
  assert.match(e2e, /E2E_STORAGE_KEYS\.USER_PROFILE/)
  assert.match(e2e, /savedProfile\?\.goal,\s*"travel"/)
  assert.match(e2e, /savedProfile\?\.kanaLevel,\s*"some"/)
  assert.match(e2e, /savedProfile\?\.romajiMode,\s*"always"/)
  assert.match(e2e, /savedProfile\?\.minutesPerDay,\s*15/)
  assert.match(e2e, /E2E_STORAGE_KEYS\.LESSON_PROGRESS/)
  assert.match(e2e, /currentStepIndex/)
  assert.match(e2e, /lastStepId/)
  assert.match(e2e, /hello-example/)
  assert.match(e2e, /recognize-a/)
  assert.match(e2e, /waitForFunction/)
  assert.match(e2e, /page\.reload\(\{ waitUntil: "networkidle" \}\)/)
  assert.match(e2e, /lesson-answer-a"\)\.waitFor\(\{ state: "visible" \}\)/)
  assert.match(e2e, /E2E_STORAGE_KEYS\.PRACTICE_RESULTS/)
  assert.match(e2e, /E2E_STORAGE_KEYS\.ITEM_PROGRESS/)
  assert.match(e2e, /E2E_STORAGE_KEYS\.SRS_KANA/)
  assert.match(e2e, /lessonId === "day-1-a-row-hello"/)
  assert.match(e2e, /itemId === "a"/)
  assert.match(e2e, /item\.correct === true/)
  assert.match(e2e, /correct kana lesson answer should enroll SRS/)
  assert.match(e2e, /getByTestId\("lesson-answer-i"\)/)
  assert.match(e2e, /item\.lessonStepId === "recognize-a"/)
  assert.match(e2e, /item\.correct === false/)
  assert.match(e2e, /item\.answer === "i"/)
  assert.match(e2e, /item\.type === "lesson:multipleChoice"/)
  assert.match(e2e, /item\.lastWrongAnswer === "i"/)
  assert.match(e2e, /wrong lesson answer should write failed practice history/)
  assert.match(e2e, /wrong lesson answer should enter the mistake notebook/)
  assert.match(e2e, /wrong lesson answer should not enroll kana SRS/)
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
  assert.match(e2e, /E2E_STORAGE_KEYS\.MISTAKES/)
  assert.match(e2e, /item\.type === "hiragana-romaji"/)
  assert.match(e2e, /item\.questionText === quizPrompt/)
  assert.match(e2e, /item\.correctAnswer === expectedAnswer/)
  assert.match(e2e, /wrong quiz answer should record the current kana prompt in mistakes/)
  assert.match(e2e, /getByTestId\("recent-mistakes"\)/)
  assert.match(e2e, /recent-mistake-\$\{recordedQuizMistake\.id\}/)
  assert.match(e2e, /getByTestId\("review-start-mistakes"\)\.click\(\)/)
  assert.match(e2e, /getByTestId\("mistake-review-session"\)/)
  assert.match(e2e, /recent-mistake-remove-\$\{mistakeId\}/)
  assert.match(e2e, /removing a recent mistake should delete it from the notebook/)
  assert.match(e2e, /removing a recent mistake should delete its mistake SRS/)
  assert.match(e2e, /getByTestId\("mistakes-clear"\)\.click\(\)/)
  assert.match(e2e, /Object\.keys\(srs\)\.length === 0/)
  assert.match(e2e, /clearing mistakes should disable mistake review/)
})

test("browser E2E verifies correct mistake reviews retain notebook history", () => {
  const e2e = readBrowserE2ESources()
  const fixtures = readBrowserFixtures()

  assert.match(e2e, /seedDueMistakeReviewState\(page, baseUrl\)/)
  assert.match(fixtures, /export async function seedDueMistakeReviewState\(page, baseUrl\)/)
  assert.match(fixtures, /"e2e-mistake:kana-a"/)
  assert.match(fixtures, /(?:E2E_STORAGE_KEYS|storageKeys)\.SRS_MISTAKES/)
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
  assert.match(fixtures, /(?:E2E_STORAGE_KEYS|storageKeys)\.SPEECH_PREFS/)
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
  assert.match(e2e, /E2E_STORAGE_KEYS\.KANA_MASTERED/)
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
  assert.match(e2e, /getByTestId\("kana-clear-progress-dialog-cancel"\)\.click\(\)/)
  assert.match(e2e, /getByTestId\("kana-clear-progress-dialog-confirm"\)\.click\(\)/)
  assert.match(e2e, /canceling kana progress reset should keep mastered kana/)
  assert.match(e2e, /mastered\.length === 0/)
  assert.match(e2e, /getByTestId\("vocabulary-clear-progress"\)\.click\(\)/)
  assert.match(e2e, /getByTestId\("vocabulary-clear-progress-dialog-cancel"\)\.click\(\)/)
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

test("browser E2E verifies reference modal keyboard navigation respects focused controls", () => {
  const e2e = readBrowserE2ESources()

  assert.match(e2e, /verifyReferenceKeyboardFlow/)
  assert.match(e2e, /\/grammar/)
  assert.match(e2e, /getByTestId\("grammar-point-n5-wa"\)\.focus\(\)/)
  assert.match(e2e, /keyboard\.press\("Enter"\)/)
  assert.match(e2e, /document\.activeElement\?\.getAttribute\("role"\) === "dialog"/)
  assert.ok(e2e.includes("getByText(/1 \\/ 25/)"))
  assert.match(e2e, /keyboard\.press\("ArrowRight"\)/)
  assert.ok(e2e.includes("getByText(/2 \\/ 25/)"))
  assert.match(e2e, /getByTestId\("grammar-modal-next"\)\.focus\(\)/)
  assert.match(e2e, /focused grammar modal controls should ignore global ArrowRight navigation/)
  assert.match(e2e, /getByTestId\("grammar-modal-prev"\)\.click\(\)/)
  assert.match(e2e, /document\.activeElement\?\.getAttribute\("data-testid"\)/)
  assert.match(e2e, /closing a grammar modal should restore focus to the opened card/)
  assert.match(e2e, /\/semantics\?item=s-shiru-wakaru/)
  assert.match(e2e, /waitForURL\(\/\\\/semantics\\\/s-shiru-wakaru\$\/\)/)
  assert.match(e2e, /keyboard\.press\("ArrowRight"\)/)
  assert.match(e2e, /waitForURL\(\/\\\/semantics\\\/s-miru-kinds\$\/\)/)
  assert.match(e2e, /keyboard\.press\("Escape"\)/)
  assert.match(e2e, /waitForURL\(\/\\\/semantics\$\/\)/)
  assert.match(e2e, /\/pragmatics\/p-aisatsu-morning/)
  assert.match(e2e, /waitForURL\(\/\\\/pragmatics\$\/\)/)
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
  assert.match(e2e, /getByTestId\("review-start-kana"\)\.click\(\)/)
  assert.match(e2e, /getByTestId\("review-start-vocab"\)\.click\(\)/)
  assert.match(e2e, /wrongKanaOption/)
  assert.match(e2e, /wrong review answer should reset kana SRS to immediate review/)
  assert.match(e2e, /getByTestId\("review-next"\)\.click\(\)/)
  assert.match(e2e, /seedMixedReviewState\(page, baseUrl\)/)
  assert.match(fixtures, /export async function seedMixedReviewState\(page, baseUrl\)/)
  assert.match(e2e, /getByTestId\("review-answer-a"\)\.click\(\)/)
  assert.match(e2e, /getByTestId\("review-answer-sur-g-1"\)\.click\(\)/)
  assert.match(e2e, /reviewedKanaSrs\?\.a\?\.box > 1/)
  assert.match(e2e, /reviewedKanaSrs\?\.a\?\.right >= 1/)
  assert.match(e2e, /reviewedMistakeSrs\?\.\["e2e-mistake:kana-a"\]\?\.box > 1/)
  assert.match(e2e, /reviewedVocabSrs\?\.\["sur-g-1"\]\?\.box > 1/)
  assert.match(e2e, /correct review answer should write practice history/)
  assert.match(e2e, /mixed today review should write vocabulary practice history/)
})

test("browser E2E verifies save failures keep quiz, lesson, and review on the current question", () => {
  const e2e = readBrowserE2ESources()

  assert.match(e2e, /verifyPracticeSaveFailureFlow/)
  assert.match(e2e, /E2E simulated practice write failure/)
  assert.match(e2e, /getByTestId\("practice-save-error"\)/)
  assert.match(e2e, /getByTestId\("quiz-score"\)/)
  assert.match(e2e, /0\\\/0\\b/)
  assert.match(e2e, /\/learn\/day-1-a-row-hello/)
  assert.match(e2e, /getByTestId\("lesson-answer-a"\)\.click\(\)/)
  assert.match(e2e, /getByTestId\("lesson-next"\)\.isDisabled\(\)/)
  assert.match(e2e, /ITEM_PROGRESS/)
  assert.match(e2e, /SRS_KANA/)
  assert.match(e2e, /getByTestId\("review-remaining"\)/)
  assert.match(e2e, /kanaSrs\?\.a\?\.box, 1/)
  assert.match(e2e, /PRACTICE_RESULTS/)
  assert.match(e2e, /E2E simulated review SRS write failure/)
  assert.match(e2e, /getByTestId\("review-next"\)\.isVisible\(\), false/)
  assert.match(e2e, /getAttribute\("aria-pressed"\), "false"/)
  assert.match(e2e, /failed review SRS write should roll back practice history/)
  assert.match(e2e, /failed review SRS write should roll back mistake notebook writes/)
  assert.match(e2e, /failed review SRS write should keep the original kana SRS state/)
})

test("browser E2E verifies onboarding profile save failures stay recoverable", () => {
  const e2e = readBrowserE2ESources()

  assert.match(e2e, /verifyProfileSaveFailureFlow/)
  assert.match(e2e, /E2E simulated profile write failure/)
  assert.match(e2e, /E2E_STORAGE_KEYS\.USER_PROFILE/)
  assert.match(e2e, /getByTestId\("onboarding-save"\)\.click\(\)/)
  assert.match(e2e, /getByTestId\("practice-save-error"\)/)
  assert.match(e2e, /readJsonStorage\(page, E2E_STORAGE_KEYS\.USER_PROFILE\), null/)
  assert.match(e2e, /getByTestId\("onboarding-save"\)\.isVisible\(\)/)
  assert.match(e2e, /profile save retry should persist the selected daily minutes/)
})

test("browser E2E verifies kana and vocabulary progress save failures roll back state", () => {
  const e2e = readBrowserE2ESources()

  assert.match(e2e, /verifyProgressSaveFailureFlow/)
  assert.match(e2e, /E2E simulated \$\{failureLabel\} write failure/)
  assert.match(e2e, /"kana progress"/)
  assert.match(e2e, /"vocabulary progress"/)
  assert.match(e2e, /E2E_STORAGE_KEYS\.KANA_MASTERED/)
  assert.match(e2e, /E2E_STORAGE_KEYS\.VOCAB_LEARNED/)
  assert.match(e2e, /E2E_STORAGE_KEYS\.SRS_KANA/)
  assert.match(e2e, /E2E_STORAGE_KEYS\.SRS_VOCAB/)
  assert.match(e2e, /getByTestId\("practice-save-error"\)/)
  assert.match(e2e, /failed kana progress clear should keep mastered kana/)
  assert.match(e2e, /failed kana progress clear should restore kana SRS/)
  assert.match(e2e, /failed vocabulary progress clear should keep learned vocabulary/)
  assert.match(e2e, /failed vocabulary progress clear should restore vocabulary SRS/)
})

test("browser E2E verifies speech preference save failures stay recoverable", () => {
  const e2e = readBrowserE2ESources()

  assert.match(e2e, /verifySpeechPreferenceSaveFailureFlow/)
  assert.match(e2e, /E2E simulated speech preference write failure/)
  assert.match(e2e, /E2E_STORAGE_KEYS\.SPEECH_PREFS/)
  assert.match(e2e, /getByTestId\("speech-repeat-2"\)\.click\(\)/)
  assert.match(e2e, /getByTestId\("practice-save-error"\)/)
  assert.match(e2e, /readJsonStorage\(page, E2E_STORAGE_KEYS\.SPEECH_PREFS\), null/)
  assert.match(e2e, /speech preference save retry should persist repeat count/)
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
  assert.match(e2e, /mobilePage\.goto\(`\$\{baseUrl\}\/grammar`/)
  assert.match(e2e, /getByTestId\("grammar-point-n5-wa"\)/)
  assert.match(e2e, /mobilePage\.goto\(`\$\{baseUrl\}\/semantics\/s-shiru-wakaru`/)
  assert.match(e2e, /getByText\("Know \(Data\)"\)/)
  assert.match(e2e, /function assertNoHorizontalOverflow/)
  assert.match(e2e, /scrollWidth <= size\.clientWidth \+ 1/)
  assert.match(e2e, /mobileContext\.close\(\)/)
})

test("browser E2E verifies non-default vocabulary levels load dynamically", () => {
  const e2e = readBrowserE2ESources()

  assert.match(e2e, /locator\("xpath=ancestor::\*\[@role='button'\]\[1\]"\)\.press\("Space"\)/)
  assert.match(e2e, /getByTestId\("vocabulary-expand-back-sur-n-35"\)\.waitFor\(\{ state: "visible" \}\)/)
  assert.match(e2e, /getByTestId\("vocabulary-expand-back-sur-n-35"\)\.press\("Space"\)/)
  assert.match(e2e, /getByRole\("dialog"\)\.waitFor\(\{ state: "visible" \}\)/)
  assert.match(e2e, /evaluate\(\(element\) => element\.tabIndex\)/)
  assert.match(e2e, /getByTestId\("vocabulary-focus-card"\)\.press\("Space"\)/)
  assert.match(e2e, /const learnedToggle = page\.getByTestId\("vocabulary-learned-toggle"\)/)
  assert.match(e2e, /learnedToggle\.waitFor\(\{ state: "visible" \}\)/)
  assert.match(e2e, /learnedToggle\.click\(\)/)
  assert.match(e2e, /vocabulary learned toggle should persist without flipping the modal/)
  assert.match(e2e, /E2E_STORAGE_KEYS\.VOCAB_LEARNED/)
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
  assert.match(fixtures, /managedLearningBackupKeys/)
  assert.match(fixtures, /(?:E2E_STORAGE_KEYS|storageKeys)\.USER_PROFILE/)
  assert.match(fixtures, /(?:E2E_STORAGE_KEYS|storageKeys)\.LESSON_PROGRESS/)
  assert.match(fixtures, /(?:E2E_STORAGE_KEYS|storageKeys)\.ITEM_PROGRESS/)
  assert.match(fixtures, /(?:E2E_STORAGE_KEYS|storageKeys)\.PRACTICE_RESULTS/)
  assert.match(fixtures, /(?:E2E_STORAGE_KEYS|storageKeys)\.SRS_KANA/)
  assert.match(fixtures, /(?:E2E_STORAGE_KEYS|storageKeys)\.SRS_VOCAB/)
  assert.match(fixtures, /(?:E2E_STORAGE_KEYS|storageKeys)\.MISTAKES/)
  assert.match(fixtures, /(?:E2E_STORAGE_KEYS|storageKeys)\.SRS_MISTAKES/)
  assert.match(fixtures, /(?:E2E_STORAGE_KEYS|storageKeys)\.KANA_MASTERED/)
  assert.match(fixtures, /(?:E2E_STORAGE_KEYS|storageKeys)\.VOCAB_LEARNED/)
  assert.match(fixtures, /(?:E2E_STORAGE_KEYS|storageKeys)\.SPEECH_PREFS/)
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
  assert.match(e2e, /E2E_STORAGE_KEYS\.KANA_MASTERED/)
  assert.match(e2e, /E2E_STORAGE_KEYS\.SRS_KANA/)
  assert.match(e2e, /malformed but valid JSON backup import should not overwrite managed learning keys/)
  assert.match(e2e, /stale-yasashi-backup\.json/)
  assert.match(e2e, /sokuon:kitte/)
  assert.match(e2e, /sur-g-999/)
  assert.match(e2e, /valid backup import should remove non-reviewable kana from mastered progress/)
  assert.match(e2e, /valid backup import should remove stale vocabulary ids from learned progress/)
  assert.match(e2e, /valid backup import should remove non-reviewable kana from SRS/)
  assert.match(e2e, /valid backup import should remove stale vocabulary ids from SRS/)
  assert.match(e2e, /getByTestId\("learning-data-reset-dialog-cancel"\)\.click\(\)/)
  assert.match(e2e, /canceling all learning data reset should keep managed learning keys/)
  assert.match(e2e, /fileChooser\.setFiles\(backupPath\)/)
  assert.match(e2e, /keys\.every\(\(key\) => localStorage\.getItem\(key\) !== null\)/)
  assert.match(e2e, /learning data import should restore every managed learning key/)
  assert.match(e2e, /learning data import should restore the profile backup/)
  assert.match(e2e, /learning data import should restore the mistake notebook backup/)
  assert.match(e2e, /learning data import should restore mistake SRS state/)
  assert.match(e2e, /learning data reset should leave unmanaged browser state alone/)
  assert.match(e2e, /learning data import should leave unmanaged browser state alone/)
})

test("browser E2E verifies the PWA update banner interaction", () => {
  const e2e = readBrowserE2ESources()

  assert.match(e2e, /verifyPwaUpdateBannerFlow/)
  assert.match(e2e, /addInitScript/)
  assert.match(e2e, /__yasashiEnablePwaUpdateTestEvent = true/)
  assert.match(e2e, /yasashi:pwa-update-ready/)
  assert.match(e2e, /getByTestId\("pwa-update-banner"\)/)
  assert.match(e2e, /getByRole\("region", \{ name: "应用更新" \}\)/)
  assert.match(e2e, /getByText\("新版本已准备好"\)/)
  assert.match(e2e, /getByText\("刷新后可同步最新离线文件。"\)/)
  assert.match(e2e, /getByTestId\("pwa-update-dismiss"\)\.click\(\)/)
  assert.match(e2e, /new CustomEvent\("yasashi:pwa-update-ready"/)
  assert.match(e2e, /__yasashiPwaMessages/)
  assert.match(e2e, /postMessage\(message\)/)
  assert.match(e2e, /message\?\.type === "SKIP_WAITING"/)
  assert.match(e2e, /PWA update refresh should wait after posting SKIP_WAITING/)
  assert.match(e2e, /waitFor\(\{ state: "hidden" \}\)/)
  assert.match(e2e, /getByTestId\("pwa-update-refresh"\)\.click\(\)/)
  assert.match(e2e, /waitForEvent\("framenavigated"\)/)
  assert.match(e2e, /PWA update refresh should reload the current document/)
})

test("browser E2E text assertions reject mojibake fallbacks", () => {
  const e2e = readBrowserE2ESources()

  assert.match(e2e, /async function verifyKanaStrokeBoardRendered/)
  assert.match(e2e, /getByTestId\("kana-stroke-board"\)/)
  assert.match(e2e, /querySelector\("svg"\)/)
  assert.match(e2e, /querySelector\("\[data-stroke-index\]"\)/)
  assert.match(e2e, /getAttribute\("data-active-stroke"\)/)
  assert.match(e2e, /activeStroke > 0/)
  assert.match(e2e, /getByTestId\("quiz-score"\)/)
  assert.doesNotMatch(e2e, /绗旈/) // mojibake-ok detector fixture
  assert.doesNotMatch(e2e, /寰楀垎/) // mojibake-ok detector fixture
})
