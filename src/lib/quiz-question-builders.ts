import type { Kana } from "@/data/kana-data"
import type { Vocabulary } from "@/data/vocabulary/types"
import { pickUniqueQuestionOptions, shuffleList } from "@/lib/question-options"
import { LONG_VOWEL_MINIMAL_PAIRS, PARTICLE_QUESTIONS, SOKUON_MINIMAL_PAIRS } from "@/lib/quiz-data"
import type { QuizMode } from "@/lib/quiz-types"
import type { Question } from "@/lib/questions"
import { VERB_CONJ_FORMS, VERB_CONJ_VERBS, conjugateVerb, explainConjugation } from "@/lib/verb-conjugation"

type RandomFn = () => number
type MinimalPair = { plain: string; special: string }

function randomItem<T>(items: readonly T[], random: RandomFn) {
  return items[Math.floor(random() * items.length)]
}

export function generateKanaQuizQuestion({
  mode,
  basePool,
  targetPool,
  random = Math.random,
}: {
  mode: Extract<QuizMode, "hiragana-romaji" | "audio-kana">
  basePool: Kana[]
  targetPool: Kana[]
  random?: RandomFn
}): Question | null {
  if (targetPool.length === 0) return null

  const target = randomItem(targetPool, random)
  const options = pickUniqueQuestionOptions({
    target,
    pool: basePool,
    getValue: (kana) => kana.romaji,
    random,
  })
  if (!options) return null

  if (mode === "hiragana-romaji") {
    return {
      type: mode,
      itemId: target.romaji,
      itemType: "kana",
      mode: "recognition",
      questionText: target.hiragana,
      correctAnswer: target.romaji,
      options: options.map((k) => ({ value: k.romaji, display: k.romaji })),
    }
  }

  return {
    type: mode,
    itemId: target.romaji,
    itemType: "kana",
    mode: "listening",
    questionAudio: target.hiragana,
    autoPlayAudio: true,
    correctAnswer: target.romaji,
    options: options.map((k) => ({ value: k.romaji, display: k.hiragana })),
  }
}

export function generateParticleQuestion(random: RandomFn = Math.random): Question {
  const item = randomItem(PARTICLE_QUESTIONS, random)
  return {
    type: "particle",
    itemId: `particle:${item.answer}:${item.full}`,
    itemType: "grammar",
    mode: "recognition",
    questionText: item.sentence,
    questionAudio: item.full,
    autoPlayAudio: false,
    correctAnswer: item.answer,
    acceptedAnswers: [item.answer],
    explanation: item.explanation,
    options: item.options.map((p) => ({ value: p, display: p })),
  }
}

export function generateAudioContrastQuestion(
  mode: Extract<QuizMode, "audio-sokuon" | "audio-longvowel">,
  random: RandomFn = Math.random
): Question {
  const pairs: readonly MinimalPair[] = mode === "audio-sokuon" ? SOKUON_MINIMAL_PAIRS : LONG_VOWEL_MINIMAL_PAIRS
  const pair = randomItem(pairs, random)
  const speakText = random() < 0.5 ? pair.plain : pair.special

  return {
    type: mode,
    itemId: mode === "audio-sokuon" ? `sokuon:${speakText}` : `longvowel:${speakText}`,
    itemType: "kana",
    mode: "listening",
    questionAudio: speakText,
    autoPlayAudio: true,
    questionText: mode === "audio-sokuon" ? "听发音，选择正确的假名（促音 っ）" : "听发音，选择正确的单词（长音）",
    correctAnswer: speakText,
    options: shuffleList([pair.plain, pair.special], random).map((text) => ({ value: text, display: text })),
  }
}

export function generateVerbConjugationQuestion(random: RandomFn = Math.random): Question {
  const verb = randomItem(VERB_CONJ_VERBS, random)
  const form = randomItem(VERB_CONJ_FORMS, random)
  const correct = conjugateVerb(verb.dict, verb.kind, form.id)
  const optionSet = new Set<string>([correct])

  for (const f of VERB_CONJ_FORMS) {
    if (f.id !== form.id) optionSet.add(conjugateVerb(verb.dict, verb.kind, f.id))
  }

  while (optionSet.size < 4) {
    const other = randomItem(VERB_CONJ_VERBS, random)
    optionSet.add(conjugateVerb(other.dict, other.kind, form.id))
  }

  return {
    type: "verb-conjugation",
    itemId: `verb:${verb.dict}:${form.id}`,
    itemType: "grammar",
    mode: "production",
    questionText: `${verb.dict}（${verb.meaning}）→ ${form.label}`,
    correctAnswer: correct,
    options: shuffleList(Array.from(optionSet).slice(0, 4), random).map((text) => ({ value: text, display: text })),
    explanation: explainConjugation(verb, form.id),
    meta: {
      verb: { dict: verb.dict, kanji: verb.kanji, meaning: verb.meaning, kind: verb.kind },
      askedForm: { id: form.id, label: form.label },
    },
  }
}

export function generateVocabularyQuizQuestion({
  mode,
  basePool,
  targetPool,
  allVocab,
  random = Math.random,
}: {
  mode: Extract<QuizMode, "meaning-vocab">
  basePool: Vocabulary[]
  targetPool: Vocabulary[]
  allVocab: Vocabulary[]
  random?: RandomFn
}): Question | null {
  const base = basePool.length >= 4 ? basePool : allVocab
  const targetSource = targetPool.length ? targetPool : base
  if (targetSource.length === 0) return null

  const target = randomItem(targetSource, random)
  const options = pickUniqueQuestionOptions({
    target,
    pool: base,
    getValue: (entry) => entry.id,
    random,
  })
  if (!options) return null

  return {
    type: mode,
    itemId: target.id,
    itemType: "vocab",
    mode: "meaning",
    questionText: target.kana,
    correctAnswer: target.id,
    options: options.map((v) => ({ value: v.id, display: v.meaning })),
  }
}
