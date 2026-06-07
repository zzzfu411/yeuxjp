import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const root = path.resolve(import.meta.dirname, "..", "..")
const stats = await loadTsModule("src/data/vocabulary/stats.ts")
const loader = await loadTsModule("src/data/vocabulary/loader.ts")

test("vocabulary level counts stay aligned with the real data files", async () => {
  for (const level of ["survival", "daily", "fluent"]) {
    const data = await loader.loadVocabularyLevel(level)
    assert.equal(stats.vocabLevelCounts[level], data.length)
  }
})

test("learned vocabulary ids are summarized by stable level prefixes", () => {
  const summary = stats.summarizeLearnedVocabIds(["sur-g-1", "sur-v-1", "day-v-1", "flu-abs-1", "unknown-1"])

  assert.equal(summary.survival.done, 2)
  assert.equal(summary.daily.done, 1)
  assert.equal(summary.fluent.done, 1)
  assert.equal(summary.survival.total, stats.vocabLevelCounts.survival)
  assert.equal(summary.survival.ratio, 2 / stats.vocabLevelCounts.survival)
})

test("recommendation surfaces do not import the aggregated vocabulary dataset", () => {
  const files = [
    "src/components/learning/next-step-card.tsx",
    "src/app/path/page.tsx",
  ]

  for (const file of files) {
    const source = fs.readFileSync(path.join(root, file), "utf8")
    assert.doesNotMatch(source, /vocabByLevel/)
    assert.match(source, /summarizeLearnedVocabIds/)
  }
})
