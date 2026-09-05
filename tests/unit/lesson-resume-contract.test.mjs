import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("LessonRunner restores a saved lesson step only after progress storage has loaded", () => {
  const source = read("src/components/lesson/use-lesson-runner-state.ts")

  assert.match(source, /const \{ lessons, results, loaded, startLesson, completeLesson, saveLessonPosition \} = progress/)
  assert.match(source, /if \(!loaded\) return 0/)
  assert.match(source, /resolveLessonResumeStepIndex\(savedLessonProgress, lesson\.steps\)/)
  assert.match(source, /manualStep\?\.lessonId === lesson\.id && manualStep\.attemptId === savedLessonProgress\?\.attemptId \? manualStep\.index : resumedStepIndex/)
  assert.doesNotMatch(source, /setStepIndex/)
  assert.doesNotMatch(source, /setState.*resumeIndex/)
})

test("LessonRunner restores answered practice state from persisted results", () => {
  const source = read("src/components/lesson/use-lesson-runner-state.ts")
  const runner = read("src/components/lesson/lesson-runner.tsx")
  const session = read("src/lib/lesson-session.ts")

  assert.match(source, /getLatestLessonStepAnswers/)
  assert.match(source, /getLatestLessonStepAnswers\(lesson\.id, lesson\.steps, results, savedLessonProgress\?\.attemptId\)/)
  assert.match(source, /mergeLessonStepAnswers/)
  assert.match(source, /persistedStepAnswers/)
  assert.match(source, /getLessonAnsweredFromStepMap\(persistedStepAnswers\)/)
  assert.match(source, /answeredDraft/)
  assert.match(source, /\.\.\.restoredAnswered, \.\.\.answeredDraft\.answers/)
  assert.match(source, /setAnsweredForLesson/)
  assert.match(source, /buildLessonRunnerViewModel\(\{/)
  assert.match(source, /answered,/)
  assert.match(session, /countCorrectLessonAnswers/)
  assert.match(session, /const correctCount = countCorrectLessonAnswers\(answered\)/)
  assert.match(runner, /persistedAnswers: persistedStepAnswers/)
  assert.match(runner, /restoredAnswer: persistedStepAnswers\[current\.id\]/)
})

test("LessonRunner saves step position through the shared learning progress facade", () => {
  const source = read("src/components/lesson/use-lesson-runner-state.ts")
  const runner = read("src/components/lesson/lesson-runner.tsx")

  assert.match(source, /if \(!loaded\) return/)
  assert.match(source, /if \(!lessonUnlocked\) return/)
  assert.match(source, /runLearningWrite\(\(\) => !cancelled && startLesson\(lesson\.id\)\)/)
  assert.match(source, /saveLessonPosition\(lesson\.id, stepIndex, step\?\.id, \{ attemptId: savedLessonProgress\?\.attemptId \}\)/)
  assert.match(source, /then\(saved => \{ if \(!cancelled\) setSaveError\(!saved\) \}\)/)
  assert.match(source, /return \(\) => \{ cancelled = true \}/)
  assert.match(source, /return completeLesson\(lesson\.id, score, \{ attemptId: savedLessonProgress\?\.attemptId \}\)/)
  assert.match(source, /buildLessonRunnerViewModel/)
  assert.match(source, /completionScore/)
  assert.match(source, /setManualStep\(\{ lessonId: lesson\.id, index, attemptId: savedLessonProgress\?\.attemptId \}\)/)
  assert.match(runner, /setManualStepIndex\(Math\.min\(stepIndex \+ 1, lesson\.steps\.length - 1\)\)/)
  assert.match(runner, /setManualStepIndex\(Math\.max\(stepIndex - 1, 0\)\)/)
  assert.doesNotMatch(source, /localStorage\.setItem/)
})

test("LessonRunner warns on locked direct lesson visits without auto-starting progress", () => {
  const source = read("src/components/lesson/lesson-runner.tsx")
  const state = read("src/components/lesson/use-lesson-runner-state.ts")
  const preview = read("src/components/lesson/lesson-locked-preview.tsx")

  assert.match(state, /from "@\/lib\/learning-entry"/)
  assert.match(source, /from "@\/components\/lesson\/lesson-locked-preview"/)
  assert.match(state, /isLessonUnlocked\(lesson, progress\.completedLessonIds, kanaLevel\)/)
  assert.match(state, /getNextLesson\(progress\.completedLessonIds, kanaLevel\)/)
  assert.match(state, /if \(!loaded\) return/)
  assert.match(state, /if \(!lessonUnlocked\) return/)
  assert.match(source, /<LessonLockedPreview recommendedLesson=\{recommendedLesson\} \/>/)
  assert.match(preview, /data-testid="lesson-locked-preview"/)
  assert.match(preview, /这节课还没有解锁/)
  assert.match(preview, /去推荐课程/)
  assert.match(preview, /查看学习路径/)
})

test("LessonRunner keeps locked lesson previews read-only", () => {
  const source = read("src/components/lesson/lesson-runner.tsx")
  const state = read("src/components/lesson/use-lesson-runner-state.ts")
  const navigation = read("src/components/lesson/lesson-navigation-bar.tsx")
  const practice = read("src/components/lesson/use-lesson-step-practice.ts")

  assert.match(source, /lessonReadOnly/)
  assert.match(state, /buildLessonRunnerViewModel/)
  assert.doesNotMatch(source, /const lessonReadOnly = !loaded \|\| !lessonUnlocked/)
  assert.match(source, /readOnly: lessonReadOnly/)
  assert.match(practice, /if \(readOnly\) return/)
  assert.match(source, /readOnly=\{lessonReadOnly\}/)
  assert.match(source, /<LessonNavigationBar/)
  assert.match(navigation, /disabled=\{!loaded \|\| \(!lessonUnlocked && isLast\) \|\| \(lessonUnlocked && isPracticeStep\(current\) && !result\)\}/)
  assert.match(navigation, /!lessonUnlocked \? \(isLast \? "预览结束" : "继续预览"\) : isLast \? "完成课程" : "继续"/)
})

test("LessonRunner exposes stable completed lesson follow-up targets", () => {
  const source = read("src/components/lesson/lesson-runner.tsx")
  const recap = read("src/components/lesson/lesson-completion-recap.tsx")
  const navigation = read("src/components/lesson/lesson-navigation-bar.tsx")

  assert.match(source, /from "@\/components\/lesson\/lesson-completion-recap"/)
  assert.match(source, /<LessonCompletionRecap lesson=\{lesson\}/)
  assert.match(recap, /data-testid="lesson-completed-summary"/)
  assert.match(recap, /prefetch=\{false\}/)
  assert.match(source, /<LessonNavigationBar/)
  assert.match(navigation, /data-testid="lesson-review-link"/)
  assert.match(navigation, /data-testid="lesson-next-lesson-link"/)
  assert.match(navigation, /href="\/review"/)
  assert.match(navigation, /href=\{nextLesson \? `\/learn\/\$\{nextLesson\.id\}` : "\/"\}/)
})

test("learning progress preserves compatible lesson keys while adding resume fields", () => {
  const progress = read("src/lib/learning-progress.ts")
  const storage = read("src/lib/learning-progress-storage.ts")
  const model = read("src/lib/learning-progress-model.ts") + read("src/lib/learning-progress-types.ts")

  assert.match(storage, /normalizeLessonProgressMap/)
  assert.match(progress, /normalizeStepIndex/)
  assert.match(progress, /saveLessonPosition/)
  assert.match(progress, /readLessonProgressMapResult\(\)/)
  assert.match(progress, /if \(!currentResult\.ok\) return false/)
  assert.match(progress, /const base = currentResult\.value/)
  assert.match(progress, /const current = base\[lessonId\]/)
  assert.match(progress, /if \(!current\) return false/)
  assert.doesNotMatch(progress, /saveLessonPosition[\s\S]*status: current\?\.status \?\? \("started" as const\)/)
  assert.doesNotMatch(progress, /saveLessonPosition[\s\S]*startedAt: current\?\.startedAt \?\? now/)
  assert.doesNotMatch(progress, /mergeLessonProgressState/)
  assert.match(progress, /loaded/)
  assert.match(model, /mergeLessonProgressMaps/)
  assert.match(model, /currentStepIndex\?: number/)
  assert.match(model, /lastStepId\?: string/)
  assert.match(model, /lessonStepId\?: string/)
  assert.match(model, /updatedAt\?: number/)
})

test("learning progress listens for cross-tab storage updates", () => {
  const progress = read("src/lib/learning-progress.ts") + read("src/lib/learning-profile.ts")
  const keys = read("src/lib/learning-progress-keys.ts")

  assert.match(progress, /from "@\/lib\/learning-progress-keys"/)
  assert.match(progress, /if \(!isProfileStorageKey\(event\.key\)\) return/)
  assert.match(progress, /const onStorage = \(event: StorageEvent\) =>/)
  assert.match(progress, /isProgressStorageKey\(detail\?\.key\)/)
  assert.match(progress, /includesProgressStorageKey\(detail\?\.keys\)/)
  assert.match(progress, /isProgressStorageKey\(event\.key\)/)
  assert.match(progress, /window\.addEventListener\("storage", onStorage\)/)
  assert.match(progress, /window\.removeEventListener\("storage", onStorage\)/)
  assert.doesNotMatch(progress, /function isProfileStorageKey/)
  assert.doesNotMatch(progress, /const PROGRESS_STORAGE_KEYS = \[/)
  assert.match(keys, /export function isProfileStorageKey/)
  assert.match(keys, /export const PROGRESS_STORAGE_KEYS = \[/)
  assert.match(keys, /STORAGE_KEYS\.LESSON_PROGRESS/)
  assert.match(keys, /STORAGE_KEYS\.ITEM_PROGRESS/)
  assert.match(keys, /STORAGE_KEYS\.PRACTICE_RESULTS/)
  assert.match(keys, /export function includesProgressStorageKey/)
  assert.match(keys, /export function isProgressStorageKey/)
})

test("learning profile saves from the current storage snapshot", () => {
  const progress = read("src/lib/learning-profile.ts")

  assert.match(progress, /function readUserProfile\(\)/)
  assert.match(progress, /const currentResult = readUserProfileResult\(\)/)
  assert.match(progress, /if \(!currentResult\.ok\) return false/)
  assert.match(progress, /const current = currentResult\.value/)
  assert.match(progress, /createdAt: current\?\.createdAt \?\? now/)
  assert.match(progress, /writeLearningJson\(STORAGE_KEYS\.USER_PROFILE, next, \{ expectedRaw: currentResult\.raw \}\)/)
  assert.match(progress, /setProfileState\(next\)/)
  assert.match(progress, /return true/)
  assert.doesNotMatch(progress, /profile\?\.createdAt/)
  assert.match(progress, /}, \[\]\)/)
})

test("lesson progress updates state only after storage writes succeed", () => {
  const progress = read("src/lib/learning-progress.ts")

  const guardedWrites = progress.match(/if \(!writeLearningJson\(STORAGE_KEYS\.LESSON_PROGRESS, next, \{ expectedRaw: (?:current|currentResult)\.raw \}\)\) return false/g) ?? []
  assert.equal(guardedWrites.length, 3)
  assert.match(progress, /prepareStudyCalendarWrite\(now\)/)
  assert.match(progress, /setLessons\(next\)/)
  assert.match(progress, /return true/)
  assert.doesNotMatch(progress, /writeLearningJson\(STORAGE_KEYS\.LESSON_PROGRESS, next\) \? next : prev/)
})
