import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("quiz runner delegates vocabulary loading to useQuizVocabularyPools", () => {
  const runner = read("src/components/quiz/quiz-runner.tsx")
  const source = read("src/components/quiz/use-quiz-session.ts")
  const emptyState = read("src/components/quiz/quiz-empty-state.tsx")

  assert.match(source, /from "@\/components\/quiz\/use-quiz-vocabulary-pools"/)
  assert.match(runner, /from "@\/components\/quiz\/quiz-empty-state"/)
  assert.match(source, /from "@\/lib\/quiz-runner-model"/)
  assert.match(source, /useQuizVocabularyPools\(\{ mode, vocabScope \}\)/)
  assert.match(source, /error: vocabError/)
  assert.match(source, /retry: retryVocabulary/)
  assert.match(source, /getQuizPreflightEmptyReason/)
  assert.match(source, /vocabLoading/)
  assert.match(source, /vocabError/)
  assert.match(source, /setEmptyReason\(preflightReason\)/)
  assert.match(runner, /onRetryVocabulary=\{retryVocabulary\}/)
  assert.match(emptyState, /data-testid="quiz-retry-vocabulary"/)
  assert.match(emptyState, /onClick=\{onRetryVocabulary\}/)
  assert.doesNotMatch(source, /loadVocabularyScope/)
  assert.doesNotMatch(source, /setVocabPools/)
  assert.doesNotMatch(source, /vocabPools/)
})

test("useQuizVocabularyPools owns scoped vocabulary loading without all-vocabulary fallback", () => {
  const source = read("src/components/quiz/use-quiz-vocabulary-pools.ts")
  const runner = read("src/components/quiz/quiz-runner.tsx")
  const session = read("src/components/quiz/use-quiz-session.ts")
  const generators = read("src/lib/quiz-generators.ts")
  const builders = read("src/lib/quiz-question-builders.ts")
  const pools = read("src/lib/quiz-pools.ts")

  assert.match(source, /export function useQuizVocabularyPools/)
  assert.match(source, /const \[retryToken, setRetryToken\] = useState\(0\)/)
  assert.match(source, /const retry = useCallback/)
  assert.match(source, /loadVocabularyScope\(vocabScope\)/)
  assert.match(source, /mode !== "meaning-vocab"/)
  assert.match(source, /error: "词汇题库加载失败"/)
  assert.doesNotMatch(source, /Failed to load vocabulary/)
  assert.match(source, /setRetryToken\(\(value\) => value \+ 1\)/)
  assert.match(source, /\[mode, retryToken, vocabScope\]/)
  assert.match(source, /loading = mode === "meaning-vocab" && state\.scope !== vocabScope/)
  assert.match(source, /basePool/)
  assert.match(source, /retry,/)
  assert.doesNotMatch(source, /loadVocabularyScope\("all"\)/)
  assert.doesNotMatch(source, /fallbackPool/)
  assert.doesNotMatch(runner, /fallbackPool/)
  assert.doesNotMatch(session, /fallbackPool/)
  assert.doesNotMatch(runner, /allVocab/)
  assert.doesNotMatch(session, /allVocab/)
  assert.doesNotMatch(generators, /allVocab/)
  assert.doesNotMatch(builders, /allVocab/)
  assert.doesNotMatch(pools, /getVocabPool/)
})
