import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("review runner delegates kana deck sessions to KanaReviewSession", () => {
  const runner = read("src/components/review/review-runner.tsx")

  assert.match(runner, /import dynamic from "next\/dynamic"/)
  assert.match(runner, /import\("@\/components\/review\/kana-review-session"\)/)
  assert.match(runner, /const KanaReviewSession = dynamic\(/)
  assert.match(runner, /<KanaReviewSession ids=\{ids\}/)
  assert.doesNotMatch(runner, /function KanaReviewSession/)
  assert.doesNotMatch(runner, /makeKanaReviewQuestion\(item\.romaji\)/)
  assert.doesNotMatch(runner, /<KanaReviewPrompt\b/)
})

test("KanaReviewSession owns kana queue, prompt, question, and SRS grading", () => {
  const source = read("src/components/review/kana-review-session.tsx")

  assert.match(source, /export function KanaReviewSession/)
  assert.match(source, /useReviewSessionState\(ids\)/)
  assert.match(source, /getKanaById\(currentId\)/)
  assert.match(source, /const \{ dropCurrent \} = review/)
  assert.match(source, /if \(!currentId \|\| item\) return/)
  assert.match(source, /queueMicrotask\(\(\) => \{/)
  assert.match(source, /if \(cancelled\) return/)
  assert.match(source, /dropCurrent\(\)/)
  assert.match(source, /cancelled = true/)
  assert.doesNotMatch(source, /if \(currentId && !item\) \{\s*dropCurrent\(\)/)
  assert.match(source, /const question = useMemo\(/)
  assert.match(source, /makeKanaReviewQuestion\(item\.id\)/)
  assert.doesNotMatch(source, /Promise\.resolve\(\)\.then/)
  assert.doesNotMatch(source, /useState<Question/)
  assert.match(source, /autoPlayText: question \? item\?\.kana\[item\.script\] : undefined/)
  assert.match(source, /ReviewEmptyQuestionState/)
  assert.match(source, /当前假名复习题不足/)
  assert.match(source, /if \(!item\) \{/)
  assert.match(source, /return null/)
  assert.match(source, /if \(!question\) \{/)
  assert.match(source, /<KanaReviewPrompt glyph=\{item\.kana\[item\.script\]\} script=\{item\.script\}/)
  assert.match(source, /if \(!item\) return false/)
  assert.match(source, /return srs\.has\(item\.id\)/)
  assert.match(source, /return srs\.gradeExisting\(item\.id/)
  assert.doesNotMatch(source, /srs\.(?:has|gradeExisting)\(item\.romaji/)
  assert.match(source, /shouldShowReviewSaveError\(recorded\)/)
  assert.match(source, /setSaveError\(shouldShowReviewSaveError\(recorded\)\)/)
  assert.match(source, /<PracticeSaveError show=\{saveError\} \/>/)
  assert.match(source, /correctAnswer=\{question\.correctAnswer\}/)
  assert.match(source, /acceptedAnswers=\{question\.acceptedAnswers\}/)
  assert.doesNotMatch(source, /correctAnswer=\{item\.romaji\}/)
  assert.match(source, /optionClassName="text-lg font-medium"/)
})

test("kana-review missing-entry drop cancels the first Strict Mode effect so the next valid head is kept", () => {
  const source = read("src/components/review/kana-review-session.tsx")
  const effect = source.match(/useEffect\(\(\) => \{[\s\S]*?\[currentId, dropCurrent, item\]\)/)
  assert.ok(effect, "kana-review must own a missing-entry drop effect")
  assert.match(effect[0], /if \(!currentId \|\| item\) return/)
  assert.match(effect[0], /let cancelled = false/)
  assert.match(effect[0], /queueMicrotask\(\(\) => \{/)
  assert.match(effect[0], /if \(cancelled\) return/)
  assert.match(effect[0], /dropCurrent\(\)/)
  assert.match(effect[0], /cancelled = true/)
  assert.doesNotMatch(effect[0], /if \(currentId && !item\) \{\s*dropCurrent\(\)/)
})
