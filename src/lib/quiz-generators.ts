import { kanaData, type Kana } from "@/data/kana-data"
import type { VocabLevel, Vocabulary } from "@/data/vocabulary/types"
import { VERB_CONJ_FORMS, VERB_CONJ_VERBS, conjugateVerb, explainConjugation } from "@/lib/verb-conjugation"
import type { Question } from "@/lib/questions"
import { shuffleList } from "@/lib/review-questions"

export type QuizMode =
  | "hiragana-romaji"
  | "audio-kana"
  | "audio-sokuon"
  | "audio-longvowel"
  | "verb-conjugation"
  | "particle"
  | "meaning-vocab"

export type KanaQuizScope = "seion" | "all"
export type VocabQuizScope = VocabLevel | "all"

export const QUIZ_MODE_SET = new Set<string>([
  "hiragana-romaji",
  "audio-kana",
  "audio-sokuon",
  "audio-longvowel",
  "verb-conjugation",
  "particle",
  "meaning-vocab",
])

export function parseQuizMode(value: string | null): QuizMode | null {
  if (!value) return null
  return QUIZ_MODE_SET.has(value) ? (value as QuizMode) : null
}

export const SOKUON_MINIMAL_PAIRS = [
  { plain: "きて", special: "きって" },
  { plain: "かた", special: "かった" },
  { plain: "いて", special: "いって" },
  { plain: "さか", special: "さっか" },
] as const

export const LONG_VOWEL_MINIMAL_PAIRS = [
  { plain: "おばさん", special: "おばあさん" },
  { plain: "おじさん", special: "おじいさん" },
  { plain: "ゆき", special: "ゆうき" },
  { plain: "ビル", special: "ビール" },
] as const

export const PARTICLE_QUESTIONS = [
  {
    sentence: "わたし＿がくせいです。",
    full: "わたしはがくせいです。",
    answer: "は",
    options: ["は", "が", "を", "に"],
    explanation: "「は」标记主题（Topic）。句子在说明“关于我”的信息。",
  },
  {
    sentence: "ねこ＿います。",
    full: "ねこがいます。",
    answer: "が",
    options: ["は", "が", "を", "に"],
    explanation: "「いる/ある」表示“存在”时，常用「が」来引入主语（有什么/谁在）。",
  },
  {
    sentence: "パン＿たべます。",
    full: "パンをたべます。",
    answer: "を",
    options: ["は", "が", "を", "に"],
    explanation: "「を」标记直接宾语（吃“什么”）。",
  },
  {
    sentence: "いえ＿います。",
    full: "いえにいます。",
    answer: "に",
    options: ["に", "で", "を", "が"],
    explanation: "「いる/ある」的“所在地点”用「に」（在哪里“存在/待着”）。",
  },
  {
    sentence: "がっこう＿べんきょうします。",
    full: "がっこうでべんきょうします。",
    answer: "で",
    options: ["に", "で", "を", "と"],
    explanation: "动作发生的场所用「で」（在哪里“做事”）。",
  },
  {
    sentence: "バス＿いきます。",
    full: "バスでいきます。",
    answer: "で",
    options: ["で", "に", "へ", "を"],
    explanation: "交通工具/手段常用「で」（用巴士去）。",
  },
  {
    sentence: "ともだち＿はなします。",
    full: "ともだちとはなします。",
    answer: "と",
    options: ["と", "に", "で", "を"],
    explanation: "和谁一起做（对话对象）常用「と」（和朋友说话）。",
  },
  {
    sentence: "すし＿すきです。",
    full: "すしがすきです。",
    answer: "が",
    options: ["は", "が", "を", "に"],
    explanation: "「すき/きらい/ほしい」常用「が」标记对象（喜欢“什么”）。",
  },
  {
    sentence: "8じ＿おきます。",
    full: "8じにおきます。",
    answer: "に",
    options: ["に", "で", "を", "が"],
    explanation: "具体时间点常用「に」（在8点起床）。",
  },
  {
    sentence: "きょう＿さむいです。",
    full: "きょうはさむいです。",
    answer: "は",
    options: ["は", "が", "を", "に"],
    explanation: "时间作为话题时常用「は」（今天“就…而言”很冷）。",
  },
  {
    sentence: "わたし＿いきます。",
    full: "わたしもいきます。",
    answer: "も",
    options: ["は", "が", "も", "に"],
    explanation: "「も」表示“也/同样”。",
  },
] as const

export function getKanaPool(scope: KanaQuizScope) {
  return scope === "all" ? kanaData : kanaData.filter((k) => k.type === "seion")
}

export function filterUnmasteredKana(pool: Kana[], isMastered: (id: string) => boolean, onlyUnmastered: boolean) {
  if (!onlyUnmastered) return pool
  const filtered = pool.filter((k) => !isMastered(k.romaji))
  return filtered.length ? filtered : pool
}

export function getVocabPool(scope: VocabQuizScope, vocabByLevel: Record<VocabLevel, Vocabulary[]>, allVocab: Vocabulary[]) {
  return scope === "all" ? allVocab : vocabByLevel[scope]
}

export function filterUnlearnedVocab(pool: Vocabulary[], isLearned: (id: string) => boolean, onlyUnlearned: boolean) {
  if (!onlyUnlearned) return pool
  const filtered = pool.filter((v) => !isLearned(v.id))
  return filtered.length ? filtered : pool
}

export function generateQuizQuestion({
  mode,
  kanaBasePool,
  kanaTargetPool,
  vocabBasePool,
  vocabTargetPool,
  allVocab,
  random = Math.random,
}: {
  mode: QuizMode
  kanaBasePool: Kana[]
  kanaTargetPool: Kana[]
  vocabBasePool: Vocabulary[]
  vocabTargetPool: Vocabulary[]
  allVocab: Vocabulary[]
  random?: () => number
}): Question | null {
  if (mode === "hiragana-romaji" || mode === "audio-kana") {
    if (kanaTargetPool.length === 0) return null
    const target = kanaTargetPool[Math.floor(random() * kanaTargetPool.length)]
    const wrong = shuffleList(kanaBasePool.filter((k) => k.romaji !== target.romaji), random).slice(0, 3)
    const options = shuffleList([target, ...wrong], random)

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

  if (mode === "particle") {
    const item = PARTICLE_QUESTIONS[Math.floor(random() * PARTICLE_QUESTIONS.length)]
    return {
      type: mode,
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

  if (mode === "audio-sokuon" || mode === "audio-longvowel") {
    const pairs = mode === "audio-sokuon" ? SOKUON_MINIMAL_PAIRS : LONG_VOWEL_MINIMAL_PAIRS
    const pair = pairs[Math.floor(random() * pairs.length)]
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

  if (mode === "verb-conjugation") {
    const verb = VERB_CONJ_VERBS[Math.floor(random() * VERB_CONJ_VERBS.length)]
    const form = VERB_CONJ_FORMS[Math.floor(random() * VERB_CONJ_FORMS.length)]
    const correct = conjugateVerb(verb.dict, verb.kind, form.id)
    const optionSet = new Set<string>([correct])

    for (const f of VERB_CONJ_FORMS) {
      if (f.id !== form.id) optionSet.add(conjugateVerb(verb.dict, verb.kind, f.id))
    }

    while (optionSet.size < 4) {
      const other = VERB_CONJ_VERBS[Math.floor(random() * VERB_CONJ_VERBS.length)]
      optionSet.add(conjugateVerb(other.dict, other.kind, form.id))
    }

    return {
      type: mode,
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

  const base = vocabBasePool.length >= 4 ? vocabBasePool : allVocab
  const targetSource = vocabTargetPool.length ? vocabTargetPool : base
  if (targetSource.length === 0) return null

  const target = targetSource[Math.floor(random() * targetSource.length)]
  const wrong = shuffleList(base.filter((v) => v.id !== target.id), random).slice(0, 3)
  return {
    type: mode,
    itemId: target.id,
    itemType: "vocab",
    mode: "meaning",
    questionText: target.kana,
    correctAnswer: target.id,
    options: shuffleList([target, ...wrong], random).map((v) => ({ value: v.id, display: v.meaning })),
  }
}
