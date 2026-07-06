import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const root = path.resolve(import.meta.dirname, "..", "..")
const config = await loadTsModule("src/lib/vocabulary-page-config.ts")
const levels = await loadTsModule("src/data/vocabulary/levels.ts")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("vocabulary page keeps static level and category labels in a shared config module", () => {
  const page = read("src/components/vocabulary/vocabulary-page.tsx")
  const source = read("src/lib/vocabulary-page-config.ts")

  assert.match(page, /from "@\/lib\/vocabulary-page-config"/)
  assert.match(page, /VOCABULARY_LEVELS/)
  assert.match(page, /VOCABULARY_CATEGORY_NAMES/)
  assert.match(page, /getVocabularyLevelDescription\(currentLevel\)/)
  assert.doesNotMatch(page, /const levels:/)
  assert.doesNotMatch(page, /const categoryNames:/)
  assert.match(source, /export const VOCABULARY_LEVELS/)
  assert.match(source, /VOCABULARY_LEVEL_METADATA/)
  assert.match(source, /export const VOCABULARY_CATEGORY_NAMES/)
})

test("vocabulary page config exposes known levels, descriptions, and category names", () => {
  assert.deepEqual(config.VOCABULARY_LEVELS.map((level) => level.id), Array.from(levels.VOCABULARY_LEVEL_IDS))

  for (const level of levels.VOCABULARY_LEVEL_METADATA) {
    assert.equal(config.getVocabularyLevelDescription(level.id), level.desc)
  }

  assert.equal(config.VOCABULARY_CATEGORY_NAMES.greetings, "寒暄 (Greetings)")
  assert.equal(config.VOCABULARY_CATEGORY_NAMES.grammar_words, "虚词 (Grammar Words)")
})
