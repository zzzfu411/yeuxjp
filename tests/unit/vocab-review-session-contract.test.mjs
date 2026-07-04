import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("review runner delegates vocab deck sessions to VocabReviewSession", () => {
  const runner = read("src/components/review/review-runner.tsx")

  assert.match(runner, /from "@\/components\/review\/vocab-review-session"/)
  assert.match(runner, /<VocabReviewSession ids=\{ids\}/)
  assert.doesNotMatch(runner, /function VocabReviewSession/)
  assert.doesNotMatch(runner, /makeVocabReviewQuestion\(item\.id, vocabulary\.data\)/)
  assert.doesNotMatch(runner, /<VocabReviewPrompt\b/)
  assert.doesNotMatch(runner, /useVocabularyReviewPool/)
})

test("VocabReviewSession owns vocabulary loading, prompt, question, and SRS grading", () => {
  const source = read("src/components/review/vocab-review-session.tsx")

  assert.match(source, /export function VocabReviewSession/)
  assert.match(source, /useVocabularyReviewPool\(ids, ids\.length > 0\)/)
  assert.match(source, /useReviewSessionState\(ids\)/)
  assert.match(source, /const \{ dropCurrent \} = review/)
  assert.match(source, /const missingReviewEntry = !!currentId && !item/)
  assert.match(source, /const insufficientQuestionOptions = !!item && !question/)
  assert.match(source, /if \(!currentId \|\| vocabulary\.loading \|\| vocabulary\.error\) return/)
  assert.match(source, /if \(missingReviewEntry\) \{/)
  assert.match(source, /dropCurrent\(\)/)
  assert.match(source, /const question = useMemo\(\(\) => \(item \? makeVocabReviewQuestion\(item, vocabulary\.data\) : null\)/)
  assert.doesNotMatch(source, /makeVocabReviewQuestion\(item\.id, vocabulary\.data\)/)
  assert.match(source, /<VocabReviewPrompt\b/)
  assert.match(source, /ReviewLoadingState/)
  assert.match(source, /ReviewErrorState/)
  assert.match(source, /ReviewEmptyQuestionState/)
  assert.match(source, /if \(vocabulary\.error\)/)
  assert.match(source, /onRetry=\{vocabulary\.retry\}/)
  assert.match(source, /单词复习题库加载失败/)
  assert.match(source, /if \(insufficientQuestionOptions\)/)
  assert.match(source, /当前单词复习题不足/)
  assert.match(source, /if \(!item \|\| !question\)/)
  assert.match(source, /return null/)
  assert.match(source, /if \(!item\) return false/)
  assert.match(source, /return srs\.has\(item\.id\)/)
  assert.match(source, /return srs\.gradeExisting\(item\.id/)
  assert.match(source, /setSaveError\(!recorded\)/)
  assert.match(source, /<PracticeSaveError show=\{saveError\} \/>/)
  assert.match(source, /correctAnswer=\{question\.correctAnswer\}/)
  assert.match(source, /acceptedAnswers=\{question\.acceptedAnswers\}/)
  assert.doesNotMatch(source, /correctAnswer=\{item\.id\}/)
})
