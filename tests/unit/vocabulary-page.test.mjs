import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const root = path.resolve(import.meta.dirname, "..", "..")
const model = await loadTsModule("src/lib/vocabulary-page-model.ts")

const sample = [
  {
    id: "sur-g-1",
    kana: "こんにちは",
    romaji: "konnichiwa",
    meaning: "hello",
    category: "greetings",
    level: "survival",
  },
  {
    id: "sur-food-1",
    kana: "みせ",
    kanji: "店",
    romaji: "mise",
    meaning: "shop",
    category: "food",
    level: "survival",
  },
  {
    id: "sur-food-2",
    kana: "みず",
    kanji: "水",
    romaji: "mizu",
    meaning: "water",
    category: "food",
    level: "survival",
  },
]

test("vocabulary page loads the active level through the dynamic loader", () => {
  const source = fs.readFileSync(path.join(root, "src/app/vocabulary/page.tsx"), "utf8")
  const hook = fs.readFileSync(path.join(root, "src/components/vocabulary/use-vocabulary-level-data.ts"), "utf8")

  assert.match(source, /useVocabularyLevelData\(currentLevel\)/)
  assert.match(hook, /loadVocabularyLevel\(level\)/)
  assert.match(source, /filterVocabularyItems/)
  assert.match(source, /getVocabularyCategories/)
  assert.match(source, /getVocabularyProgress/)
  assert.doesNotMatch(source, /loadVocabularyLevel/)
  assert.doesNotMatch(source, /vocabByLevel/)
  assert.doesNotMatch(source, /from\s+["']@\/data\/vocabulary["']/)
})

test("vocabulary page model filters by kana, kanji, romaji, meaning, and learned state", () => {
  const learned = new Set(["sur-food-1"])
  const isLearned = (id) => learned.has(id)

  assert.deepEqual(model.filterVocabularyItems({ items: sample, searchQuery: "みせ", onlyUnlearned: false, isLearned }).map((v) => v.id), [
    "sur-food-1",
  ])
  assert.deepEqual(model.filterVocabularyItems({ items: sample, searchQuery: "店", onlyUnlearned: false, isLearned }).map((v) => v.id), [
    "sur-food-1",
  ])
  assert.deepEqual(model.filterVocabularyItems({ items: sample, searchQuery: "MIZ", onlyUnlearned: false, isLearned }).map((v) => v.id), [
    "sur-food-2",
  ])
  assert.deepEqual(model.filterVocabularyItems({ items: sample, searchQuery: "HELLO", onlyUnlearned: false, isLearned }).map((v) => v.id), [
    "sur-g-1",
  ])
  assert.deepEqual(model.filterVocabularyItems({ items: sample, searchQuery: "", onlyUnlearned: true, isLearned }).map((v) => v.id), [
    "sur-g-1",
    "sur-food-2",
  ])
})

test("vocabulary page model preserves category order, progress, and modal indexes", () => {
  const learned = new Set(["sur-g-1", "sur-food-2"])
  const isLearned = (id) => learned.has(id)

  assert.deepEqual(model.getVocabularyCategories(sample), ["greetings", "food"])
  assert.deepEqual(model.getVocabularyProgress(sample, isLearned), { learned: 2, total: 3 })
  assert.equal(model.findVocabularyIndex(sample, "sur-food-1"), 1)
  assert.equal(model.findVocabularyIndex(sample, "missing"), -1)
  assert.deepEqual(model.getVocabularyItemsByCategory(sample, "food").map((v) => v.id), ["sur-food-1", "sur-food-2"])
})
