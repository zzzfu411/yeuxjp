import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("review runner delegates status UI and vocabulary loading to sessions and shared modules", () => {
  const source = read("src/components/review/review-runner.tsx")

  assert.doesNotMatch(source, /function ReviewDone/)
  assert.doesNotMatch(source, /function useAllVocabulary/)
  assert.doesNotMatch(source, /ReviewLoadingState/)
  assert.doesNotMatch(source, /useAllVocabulary/)
  assert.doesNotMatch(source, /loadVocabularyScope/)
  assert.doesNotMatch(source, /state-complete\.webp/)
})

test("review status owns completion and loading surfaces", () => {
  const source = read("src/components/review/review-status.tsx")

  assert.match(source, /export function ReviewLoadingState/)
  assert.match(source, /export function ReviewErrorState/)
  assert.match(source, /export function ReviewDone/)
  assert.match(source, /state-complete\.webp/)
  assert.match(source, /border-destructive\/30/)
  assert.match(source, /onRetry\?: \(\) => void/)
  assert.match(source, /data-testid="review-retry-load"/)
  assert.match(source, /onClick=\{onRetry\}/)
})

test("review vocabulary hook owns scoped vocabulary loading", () => {
  const source = read("src/components/review/review-vocabulary.ts")

  assert.doesNotMatch(source, /export function useAllVocabulary/)
  assert.doesNotMatch(source, /loadVocabularyScope/)
  assert.match(source, /export function useVocabularyReviewPool/)
  assert.match(source, /loadVocabularyReviewPool\(reviewIds\)/)
  assert.match(source, /const \[retryToken, setRetryToken\] = useState\(0\)/)
  assert.match(source, /const retry = useCallback/)
  assert.match(source, /setRetryToken\(\(value\) => value \+ 1\)/)
  assert.match(source, /\[enabled, key, retryToken\]/)
  assert.match(source, /retry,/)

  for (const relPath of [
    "src/components/review/vocab-review-session.tsx",
    "src/components/review/today-review-session.tsx",
  ]) {
    assert.doesNotMatch(read(relPath), /useAllVocabulary\(/)
    assert.doesNotMatch(read(relPath), /loadVocabularyScope/)
  }
})
