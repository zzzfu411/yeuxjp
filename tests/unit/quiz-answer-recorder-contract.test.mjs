import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("quiz runner delegates shared answer recording to useQuizAnswerRecorder", () => {
  const runner = read("src/components/quiz/quiz-runner.tsx")
  const source = read("src/components/quiz/use-quiz-session.ts")

  assert.match(runner, /from "@\/components\/quiz\/use-quiz-session"/)
  assert.match(runner, /useQuizSession\(mode\)/)
  assert.match(source, /from "@\/lib\/learning-status"/)
  assert.match(source, /const learning = useLearningStatus\(\)/)
  assert.match(source, /progress: learning/)
  assert.match(source, /from "@\/components\/quiz\/use-quiz-answer-recorder"/)
  assert.match(source, /useQuizAnswerRecorder\(/)
  assert.match(source, /canStartQuizAnswerSubmission/)
  assert.match(source, /resolveQuizAnswerSubmission/)
  assert.match(source, /const answerPendingRef = useRef\(false\)/)
  assert.match(source, /recordAnswer\(currentQuestion, val\)/)
  assert.match(source, /answerPending: answerPendingRef\.current/)
  assert.match(source, /hasQuestion: Boolean\(currentQuestion\)/)
  assert.match(source, /answerPendingRef\.current = true/)
  assert.match(source, /resolveQuizAnswerSubmission\(val, Boolean\(result\)\)/)
  assert.match(source, /answerPendingRef\.current = submission\.answerPending/)
  assert.match(source, /setSaveError\(submission\.saveError\)/)
  assert.match(source, /setSelectedOption\(submission\.selectedOption\)/)
  assert.match(runner, /<PracticeSaveError show=\{saveError\} \/>/)
  assert.doesNotMatch(source, /useKanaProgress/)
  assert.doesNotMatch(source, /useVocabProgress/)
  assert.doesNotMatch(source, /useLearningProgress/)
  assert.doesNotMatch(source, /makeQuestionResult/)
  assert.doesNotMatch(source, /recordQuestionPractice/)
  assert.doesNotMatch(source, /recordQuizAnswer/)
})

test("quiz runner delegates empty question states to QuizEmptyState", () => {
  const runner = read("src/components/quiz/quiz-runner.tsx")
  const source = read("src/components/quiz/use-quiz-session.ts")
  const emptyState = read("src/components/quiz/quiz-empty-state.tsx")

  assert.match(runner, /from "@\/components\/quiz\/quiz-empty-state"/)
  assert.match(source, /type QuizEmptyReason/)
  assert.match(source, /from "@\/lib\/quiz-runner-model"/)
  assert.match(source, /getQuizPreflightEmptyReason/)
  assert.match(source, /getQuizNoQuestionReason/)
  assert.match(runner, /<QuizEmptyState/)
  assert.match(source, /setEmptyReason\("loading"\)/)
  assert.match(source, /setEmptyReason\(preflightReason\)/)
  assert.match(source, /setEmptyReason\(/)
  assert.match(source, /vocabError/)
  assert.match(source, /onlyUnmasteredKana/)
  assert.match(source, /onlyUnlearnedVocab/)
  assert.match(source, /filterUnmasteredKana\(kanaBasePool, learning\.isKanaMastered, onlyUnmasteredKana\)/)
  assert.match(source, /filterUnlearnedVocab\(vocabBasePool, learning\.isVocabLearned, onlyUnlearnedVocab\)/)
  assert.match(source, /setCurrentQuestion\(null\)/)
  assert.doesNotMatch(source, /"filter-empty"/)
  assert.doesNotMatch(source, /"pool-too-small"/)
  assert.doesNotMatch(source, /function getQuizEmptyMessage/)
  assert.doesNotMatch(source, /data-testid="quiz-empty-state"/)

  assert.match(emptyState, /export type \{ QuizEmptyReason \} from "@\/lib\/quiz-runner-model"/)
  assert.match(emptyState, /function getQuizEmptyMessage/)
  assert.match(emptyState, /词汇题库加载失败/)
  assert.match(emptyState, /当前范围内的题目太少，无法生成 4 个不同选项/)
  assert.match(emptyState, /data-testid="quiz-empty-state"/)
  assert.match(emptyState, /data-testid="quiz-retry-vocabulary"/)
  assert.match(emptyState, /reason === "load-error"/)
  assert.doesNotMatch(emptyState, /: "加载中\.\.\."\}/)
})

test("useQuizAnswerRecorder owns question result, stats, and learning record writes", () => {
  const source = read("src/components/quiz/use-quiz-answer-recorder.ts")
  const model = read("src/lib/quiz-answer-recording.ts")

  assert.match(source, /export function useQuizAnswerRecorder/)
  assert.match(source, /recordQuizQuestionPractice\(\{/)
  assert.match(source, /updateStats: setQuizStats/)
  assert.doesNotMatch(source, /makeQuestionResult/)
  assert.doesNotMatch(source, /recordQuestionPractice/)
  assert.doesNotMatch(source, /recordQuizAnswer/)
  assert.match(model, /makeQuestionResult\(question, selectedAnswer\)/)
  assert.match(model, /if \(!recordQuestionPractice\(\{ progress, notebook, result \}\)\) return null/)
  assert.match(model, /updateStats\(\(prev\) => recordQuizAnswer\(prev, result\.correct\)\)/)
  assert.match(model, /return result/)
})
