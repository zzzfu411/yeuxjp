import type { Kana } from "@/data/kana-data"
import type { Vocabulary } from "@/data/vocabulary/types"
import {
  generateAudioContrastQuestion,
  generateKanaQuizQuestion,
  generateParticleQuestion,
  generateVerbConjugationQuestion,
  generateVocabularyQuizQuestion,
} from "@/lib/quiz-question-builders"
import type { QuizMode } from "@/lib/quiz-types"
import type { Question } from "@/lib/questions"
import { verbConjFormsForCourse } from "@/lib/verb-conjugation"

export { LONG_VOWEL_MINIMAL_PAIRS, PARTICLE_QUESTIONS, SOKUON_MINIMAL_PAIRS } from "@/lib/quiz-data"
export { filterUnlearnedVocab, filterUnmasteredKana, getKanaPool } from "@/lib/quiz-pools"
export { parseQuizMode, QUIZ_MODE_SET } from "@/lib/quiz-types"
export type { KanaQuizScope, QuizMode, VocabQuizScope } from "@/lib/quiz-types"

export function generateQuizQuestion({
  mode,
  kanaBasePool,
  kanaTargetPool,
  vocabBasePool,
  vocabTargetPool,
  random = Math.random,
  nextTrack,
  allLessonsDone = false,
}: {
  mode: QuizMode
  kanaBasePool: Kana[]
  kanaTargetPool: Kana[]
  vocabBasePool: Vocabulary[]
  vocabTargetPool: Vocabulary[]
  random?: () => number
  nextTrack?: string | null
  allLessonsDone?: boolean
}): Question | null {
  if (mode === "hiragana-romaji" || mode === "audio-kana") {
    return generateKanaQuizQuestion({
      mode,
      basePool: kanaBasePool,
      targetPool: kanaTargetPool,
      random,
    })
  }

  if (mode === "particle") return generateParticleQuestion(random)

  if (mode === "audio-sokuon" || mode === "audio-longvowel") {
    return generateAudioContrastQuestion(mode, random)
  }

  if (mode === "verb-conjugation") {
    return generateVerbConjugationQuestion(random, verbConjFormsForCourse(nextTrack, allLessonsDone))
  }

  return generateVocabularyQuizQuestion({
    mode,
    basePool: vocabBasePool,
    targetPool: vocabTargetPool,
    random,
  })
}
