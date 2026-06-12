import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("review runner delegates today deck sessions to TodayReviewSession", () => {
  const runner = read("src/components/review/review-runner.tsx")

  assert.match(runner, /from "@\/components\/review\/today-review-session"/)
  assert.match(runner, /<TodayReviewSession/)
  assert.match(runner, /kanaSrs=\{kanaSrs\}/)
  assert.match(runner, /vocabSrs=\{vocabSrs\}/)
  assert.match(runner, /mistakeSrs=\{mistakeSrs\}/)
  assert.doesNotMatch(runner, /makeKanaReviewQuestion/)
  assert.doesNotMatch(runner, /makeVocabReviewQuestion/)
  assert.doesNotMatch(runner, /mistakeToQuestion\(item\)/)
  assert.doesNotMatch(runner, /useVocabularyReviewPool/)
})

test("TodayReviewSession owns mixed queue data, shared prompts, and all SRS deck grading", () => {
  const source = read("src/components/review/today-review-session.tsx")

  assert.match(source, /export function TodayReviewSession/)
  assert.match(source, /useReviewSessionState\(items\)/)
  assert.match(source, /const \{ dropCurrent \} = review/)
  assert.match(source, /const vocabIds = useMemo/)
  assert.match(source, /useVocabularyReviewPool\(vocabIds, vocabIds\.length > 0\)/)
  assert.match(source, /ReviewErrorState/)
  assert.match(source, /if \(vocabulary\.error\)/)
  assert.match(source, /onRetry=\{vocabulary\.retry\}/)
  assert.match(source, /今日复习题库加载失败/)
  assert.match(source, /makeKanaReviewQuestion\(current\.id\)/)
  assert.match(source, /makeVocabReviewQuestion\(current\.id, vocabulary\.data\)/)
  assert.match(source, /mistakeToQuestion\(item\)/)
  assert.match(source, /if \(current\.deck === "vocab" && \(vocabulary\.loading \|\| vocabulary\.error\)\) return/)
  assert.match(source, /if \(data\) return/)
  assert.match(source, /dropCurrent\(\)/)
  assert.match(source, /return null/)
  assert.match(source, /<MixedReviewPrompt\b/)
  assert.match(source, /<ReviewAnswerFeedback/)
  assert.match(source, /if \(!current\) return false/)
  assert.match(source, /return kanaSrs\.has\(current\.id\)/)
  assert.match(source, /return vocabSrs\.has\(current\.id\)/)
  assert.match(source, /return mistakeSrs\.has\(current\.id\)/)
  assert.match(source, /return kanaSrs\.gradeExisting\(current\.id/)
  assert.match(source, /return vocabSrs\.gradeExisting\(current\.id/)
  assert.match(source, /return mistakeSrs\.gradeExisting\(current\.id/)
  assert.match(source, /return false/)
  assert.match(source, /const currentKey = current \? `\$\{current\.deck\}:\$\{current\.id\}` : null/)
  assert.match(source, /const saveError = !!currentKey && saveErrorKey === currentKey/)
  assert.match(source, /setSaveErrorKey\(recorded \? null : currentKey\)/)
  assert.match(source, /<PracticeSaveError show=\{saveError\} \/>/)
  assert.match(source, /data-testid="review-remaining"/)
})
