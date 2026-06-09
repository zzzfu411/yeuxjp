import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const model = await loadTsModule("src/lib/grammar-page-model.ts")

const sample = [
  {
    id: "n5-wa",
    title: "Topic は",
    structure: "N + は",
    explanation: "Marks the topic",
    examples: [{ japanese: "私は学生です。", romaji: "watashi wa gakusei desu", meaning: "I am a student" }],
    level: "N5",
  },
  {
    id: "n5-ni",
    title: "Location に",
    structure: "Place + に",
    explanation: "Marks existence",
    examples: [{ japanese: "学校にいます。", romaji: "gakkou ni imasu", meaning: "I am at school" }],
    level: "N5",
  },
]

test("grammar page model parses only known grammar level URL values", () => {
  assert.deepEqual(model.GRAMMAR_LEVELS, ["N5", "N4", "N3", "N2", "N1", "Anime"])
  assert.equal(model.parseGrammarLevel("N5"), "N5")
  assert.equal(model.parseGrammarLevel("Anime"), "Anime")
  assert.equal(model.parseGrammarLevel("n5"), null)
  assert.equal(model.parseGrammarLevel("unknown"), null)
  assert.equal(model.parseGrammarLevel(null), null)
})

test("grammar page model filters by title, structure, explanation, meaning, and Japanese examples", () => {
  assert.deepEqual(model.filterGrammarPoints(sample, "").map((point) => point.id), ["n5-wa", "n5-ni"])
  assert.deepEqual(model.filterGrammarPoints(sample, "topic").map((point) => point.id), ["n5-wa"])
  assert.deepEqual(model.filterGrammarPoints(sample, "PLACE").map((point) => point.id), ["n5-ni"])
  assert.deepEqual(model.filterGrammarPoints(sample, "existence").map((point) => point.id), ["n5-ni"])
  assert.deepEqual(model.filterGrammarPoints(sample, "student").map((point) => point.id), ["n5-wa"])
  assert.deepEqual(model.filterGrammarPoints(sample, "学校").map((point) => point.id), ["n5-ni"])
})
