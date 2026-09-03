import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const quiz = await loadTsModule("src/lib/quiz-generators.ts")
const builders = await loadTsModule("src/lib/quiz-question-builders.ts")
const verbConjugation = await loadTsModule("src/lib/verb-conjugation.ts")

const vocab = [
  { id: "v1", kana: "みず", romaji: "mizu", meaning: "水", category: "food", level: "survival" },
  { id: "v2", kana: "ちゃ", romaji: "cha", meaning: "茶", category: "food", level: "survival" },
  { id: "v3", kana: "ごはん", romaji: "gohan", meaning: "饭", category: "food", level: "survival" },
  { id: "v4", kana: "パン", romaji: "pan", meaning: "面包", category: "food", level: "survival" },
]

test("parseQuizMode accepts only known quiz modes", () => {
  assert.equal(quiz.parseQuizMode("meaning-vocab"), "meaning-vocab")
  assert.equal(quiz.parseQuizMode("unknown"), null)
})

test("kana quiz generators return shared Question objects", () => {
  const base = quiz.getKanaPool("seion")
  const question = quiz.generateQuizQuestion({
    mode: "hiragana-romaji",
    kanaBasePool: base,
    kanaTargetPool: base,
    vocabBasePool: vocab,
    vocabTargetPool: vocab,
    random: () => 0,
  })

  assert.equal(question.itemType, "kana")
  assert.equal(question.itemId, "hiragana:a")
  assert.equal(question.mode, "recognition")
  assert.equal(question.correctAnswer, "a")
  assert.equal(question.options.length, 4)
})

test("quiz generators tolerate invalid injected random values", () => {
  const base = quiz.getKanaPool("seion")
  const kanaQuestion = quiz.generateQuizQuestion({
    mode: "hiragana-romaji",
    kanaBasePool: base,
    kanaTargetPool: base,
    vocabBasePool: vocab,
    vocabTargetPool: vocab,
    random: () => Number.POSITIVE_INFINITY,
  })
  const vocabQuestion = quiz.generateQuizQuestion({
    mode: "meaning-vocab",
    kanaBasePool: [],
    kanaTargetPool: [],
    vocabBasePool: vocab,
    vocabTargetPool: vocab,
    random: () => Number.NaN,
  })

  assert.equal(kanaQuestion.itemType, "kana")
  assert.equal(kanaQuestion.correctAnswer, "a")
  assert.equal(kanaQuestion.options.length, 4)
  assert.equal(vocabQuestion.itemType, "vocab")
  assert.equal(vocabQuestion.correctAnswer, "v1")
  assert.equal(vocabQuestion.options.length, 4)
})

test("kana quiz generators require enough unique options", () => {
  const base = quiz.getKanaPool("seion").slice(0, 3)
  const question = quiz.generateQuizQuestion({
    mode: "hiragana-romaji",
    kanaBasePool: base,
    kanaTargetPool: base,
    vocabBasePool: vocab,
    vocabTargetPool: vocab,
    random: () => 0,
  })

  assert.equal(question, null)
})

test("kana unmastered filter stays empty when every item is mastered", () => {
  const base = quiz.getKanaPool("seion").slice(0, 4)

  assert.deepEqual(
    quiz.filterUnmasteredKana(base, () => true, true),
    []
  )
  assert.deepEqual(
    quiz.filterUnmasteredKana(base, () => true, false),
    base
  )
})

test("kana unmastered filter checks hiragana progress IDs", () => {
  const base = quiz.getKanaPool("seion").slice(0, 2)
  const checkedIds = []

  const filtered = quiz.filterUnmasteredKana(
    base,
    (id) => {
      checkedIds.push(id)
      return id === "hiragana:a"
    },
    true
  )

  assert.deepEqual(checkedIds, ["hiragana:a", "hiragana:i"])
  assert.deepEqual(filtered.map((item) => item.romaji), ["i"])
})

test("audio kana questions use hiragana progress IDs", () => {
  const base = quiz.getKanaPool("seion")
  const question = quiz.generateQuizQuestion({
    mode: "audio-kana",
    kanaBasePool: base,
    kanaTargetPool: base,
    vocabBasePool: vocab,
    vocabTargetPool: vocab,
    random: () => 0,
  })

  assert.equal(question.itemId, "hiragana:a")
  assert.equal(question.mode, "listening")
})

test("vocabulary quiz generators return meaning questions", () => {
  const question = quiz.generateQuizQuestion({
    mode: "meaning-vocab",
    kanaBasePool: [],
    kanaTargetPool: [],
    vocabBasePool: vocab,
    vocabTargetPool: vocab,
    random: () => 0,
  })

  assert.equal(question.itemType, "vocab")
  assert.equal(question.mode, "meaning")
  assert.equal(question.correctAnswer, "v1")
  assert.equal(question.options.length, 4)
})

test("vocabulary meaning questions de-duplicate visible meanings", () => {
  const duplicateMeaningVocab = [
    { id: "v1", kana: "やすむ", romaji: "yasumu", meaning: "休息", category: "verbs", level: "survival" },
    { id: "v2", kana: "やすみ", romaji: "yasumi", meaning: "休息", category: "time", level: "survival" },
    { id: "v3", kana: "みず", romaji: "mizu", meaning: "水", category: "food", level: "survival" },
    { id: "v4", kana: "ちゃ", romaji: "cha", meaning: "茶", category: "food", level: "survival" },
    { id: "v5", kana: "パン", romaji: "pan", meaning: "面包", category: "food", level: "survival" },
  ]

  const question = quiz.generateQuizQuestion({
    mode: "meaning-vocab",
    kanaBasePool: [],
    kanaTargetPool: [],
    vocabBasePool: duplicateMeaningVocab,
    vocabTargetPool: [duplicateMeaningVocab[0]],
    random: () => 0,
  })

  assert.equal(question.correctAnswer, "v1")
  assert.equal(question.options.length, 4)
  assert.equal(new Set(question.options.map((option) => option.display)).size, question.options.length)
  assert.ok(question.options.some((option) => option.value === "v1"))
})

test("vocabulary quiz generators require enough unique options", () => {
  const smallVocab = vocab.slice(0, 3)
  const question = quiz.generateQuizQuestion({
    mode: "meaning-vocab",
    kanaBasePool: [],
    kanaTargetPool: [],
    vocabBasePool: smallVocab,
    vocabTargetPool: smallVocab,
    random: () => 0,
  })

  assert.equal(question, null)
})

test("vocabulary quiz generators do not fall back to the base pool when the target pool is empty", () => {
  const question = quiz.generateQuizQuestion({
    mode: "meaning-vocab",
    kanaBasePool: [],
    kanaTargetPool: [],
    vocabBasePool: vocab,
    vocabTargetPool: [],
    random: () => 0,
  })

  assert.equal(question, null)
})

test("vocabulary unlearned filter stays empty when every item is learned", () => {
  assert.deepEqual(
    quiz.filterUnlearnedVocab(vocab, () => true, true),
    []
  )
  assert.deepEqual(
    quiz.filterUnlearnedVocab(vocab, () => true, false),
    vocab
  )
})

test("audio contrast and verb conjugation modes include explanations or audio", () => {
  const audio = quiz.generateQuizQuestion({
    mode: "audio-sokuon",
    kanaBasePool: [],
    kanaTargetPool: [],
    vocabBasePool: vocab,
    vocabTargetPool: vocab,
    random: () => 0,
  })
  const verb = quiz.generateQuizQuestion({
    mode: "verb-conjugation",
    kanaBasePool: [],
    kanaTargetPool: [],
    vocabBasePool: vocab,
    vocabTargetPool: vocab,
    random: () => 0,
  })

  assert.equal(audio.itemType, "kana")
  assert.ok(audio.questionAudio)
  assert.equal(verb.itemType, "grammar")
  assert.ok(verb.explanation)
  assert.match(verb.questionText, /（吃）/)
  assert.doesNotMatch(verb.questionText, /\{verb\.meaning\}/)
})

test("verb conjugation quiz withholds potential and causative until N4", () => {
  const n5 = quiz.generateQuizQuestion({
    mode: "verb-conjugation",
    kanaBasePool: [],
    kanaTargetPool: [],
    vocabBasePool: vocab,
    vocabTargetPool: vocab,
    nextTrack: "starter-45",
    random: () => 0.7,
  })
  const n4 = quiz.generateQuizQuestion({
    mode: "verb-conjugation",
    kanaBasePool: [],
    kanaTargetPool: [],
    vocabBasePool: vocab,
    vocabTargetPool: vocab,
    nextTrack: "n4-core",
    random: () => 0.7,
  })

  assert.equal(n5.meta.askedForm.id, "te")
  assert.equal(n4.meta.askedForm.id, "potential")
})

test("verb conjugation questions exclude できる from potential and causative", () => {
  const forceDekiru = (formIndex) => {
    let call = 0
    const values = [
      (27 + 0.25) / verbConjugation.VERB_CONJ_VERBS.length,
      (formIndex + 0.25) / verbConjugation.VERB_CONJ_FORMS.length,
    ]
    return () => values[call++] ?? 0
  }

  for (const formIndex of [4, 5]) {
    const question = builders.generateVerbConjugationQuestion(
      forceDekiru(formIndex),
      verbConjugation.VERB_CONJ_FORMS
    )
    assert.notEqual(question.meta.verb.dict, "できる")
    assert.notEqual(question.correctAnswer, "できられる")
    assert.notEqual(question.correctAnswer, "できさせる")
  }
})

test("basic できる questions keep only learner-facing forms in their options", () => {
  const question = builders.generateVerbConjugationQuestion(
    (() => {
      let call = 0
      const values = [
        (27 + 0.25) / verbConjugation.VERB_CONJ_VERBS.length,
        0.25 / verbConjugation.VERB_CONJ_FORMS.length,
      ]
      return () => values[call++] ?? 0
    })(),
    verbConjugation.VERB_CONJ_FORMS
  )

  assert.equal(question.meta.verb.dict, "できる")
  assert.equal(question.options.length, 4)
  assert.ok(question.options.every((option) => !["できられる", "できさせる"].includes(option.value)))
})

function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a += 0x6d2b79f5
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

test("potential and causative distractors never include malformed できる forms", () => {
  const malformed = ["できられる", "できさせる"]
  const potentialOnly = verbConjugation.VERB_CONJ_FORMS.filter((form) => form.id === "potential")
  const causativeOnly = verbConjugation.VERB_CONJ_FORMS.filter((form) => form.id === "causative")

  for (const pool of [potentialOnly, causativeOnly]) {
    for (let seed = 0; seed < 200; seed += 1) {
      const question = builders.generateVerbConjugationQuestion(mulberry32(seed), pool)
      assert.notEqual(question.meta.verb.dict, "できる")
      assert.ok(
        question.options.every((option) => !malformed.includes(option.value)),
        `seed ${seed} ${pool[0].id} included ${question.options.map((option) => option.value).join(", ")}`
      )
    }
  }
})
