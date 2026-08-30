import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const root = path.resolve(import.meta.dirname, "..", "..")
const stats = await loadTsModule("src/data/vocabulary/stats.ts")
const loader = await loadTsModule("src/data/vocabulary/loader.ts")
const levels = await loadTsModule("src/data/vocabulary/levels.ts")

function listSourceFiles(relativeDir) {
  const absoluteDir = path.join(root, relativeDir)
  const entries = fs.readdirSync(absoluteDir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const relativePath = path.join(relativeDir, entry.name)
    if (entry.isDirectory()) {
      files.push(...listSourceFiles(relativePath))
      continue
    }

    if (/\.(?:ts|tsx)$/.test(entry.name)) {
      files.push(relativePath)
    }
  }

  return files
}

test("vocabulary level counts stay aligned with the real data files", async () => {
  for (const level of levels.VOCABULARY_LEVEL_IDS) {
    const data = await loader.loadVocabularyLevel(level)
    assert.equal(stats.vocabLevelCounts[level], data.length)
  }
})

test("vocabulary ids keep level prefixes aligned with dynamic chunk loading", async () => {
  const expectedPrefixes = {
    survival: "sur-",
    daily: "day-",
    fluent: "flu-",
  }

  for (const [level, prefix] of Object.entries(expectedPrefixes)) {
    const data = await loader.loadVocabularyLevel(level)

    assert.equal(data.every((item) => item.id.startsWith(prefix)), true)
    assert.equal(data.every((item) => stats.getVocabLevelForId(item.id) === level), true)
  }
})

test("learned vocabulary ids are summarized by stable level prefixes", () => {
  const summary = stats.summarizeLearnedVocabIds(["sur-g-1", "sur-v-1", "day-v-1", "flu-abs-1", "sur-g-999", "unknown-1"])

  assert.equal(summary.survival.done, 2)
  assert.equal(summary.daily.done, 1)
  assert.equal(summary.fluent.done, 1)
  assert.equal(summary.survival.total, stats.vocabLevelCounts.survival)
  assert.equal(summary.survival.ratio, 2 / stats.vocabLevelCounts.survival)
})

test("vocabulary stats build counts and summaries from the shared level registry", () => {
  const source = fs.readFileSync(path.join(root, "src/data/vocabulary/stats.ts"), "utf8")

  assert.match(source, /mapVocabularyLevels/)
  assert.match(source, /vocabLevelCounts/)
  assert.doesNotMatch(source, /survival:\s*505/)
  assert.doesNotMatch(source, /daily:\s*240/)
  assert.doesNotMatch(source, /fluent:\s*195/)
})

test("recommendation surfaces do not import the aggregated vocabulary dataset", () => {
  const surfaceFiles = [
    "src/components/learning/next-step-card.tsx",
    "src/components/path/skill-tree-page.tsx",
  ]

  for (const file of surfaceFiles) {
    const source = fs.readFileSync(path.join(root, file), "utf8")
    assert.doesNotMatch(source, /vocabByLevel/)
    assert.match(source, /useLearningRecommendation/)
  }

  const recommendationHook = fs.readFileSync(path.join(root, "src/lib/learning-recommendation.ts"), "utf8")
  const recommendationModel = fs.readFileSync(path.join(root, "src/lib/learning-recommendation-model.ts"), "utf8")
  assert.doesNotMatch(recommendationHook, /vocabByLevel/)
  assert.doesNotMatch(recommendationHook, /summarizeLearnedVocabIds/)
  assert.doesNotMatch(recommendationModel, /vocabByLevel/)
  assert.match(recommendationModel, /summarizeLearnedVocabIds/)
})

test("home and review dashboard surfaces do not import eager vocabulary datasets", () => {
  const surfaceFiles = [
    "src/components/home/home-page.tsx",
    "src/lib/home-page-model.ts",
    "src/components/review/review-page.tsx",
    "src/components/review/review-dashboard.tsx",
    "src/lib/review-dashboard-model.ts",
  ]
  const forbidden = [
    /@\/data\/vocabulary\/(?:survival|daily|fluent)/,
    /vocabByLevel/,
    /vocabData/,
    /\b(?:survivalVocab|dailyVocab|fluentVocab)\b/,
  ]

  for (const file of surfaceFiles) {
    const source = fs.readFileSync(path.join(root, file), "utf8")
    for (const pattern of forbidden) {
      assert.doesNotMatch(source, pattern, `${file} should not eagerly import full vocabulary data`)
    }
  }
})

test("runtime app, component, and lib modules do not eagerly import vocabulary chunks", () => {
  const scannedFiles = ["src/app", "src/components", "src/lib"].flatMap(listSourceFiles)
  const forbidden = [
    /@\/data\/vocabulary\/(?:survival|daily|fluent)/,
    /(?:\.\.?\/)+data\/vocabulary\/(?:survival|daily|fluent)/,
    /\bvocabByLevel\b/,
    /\bvocabData\b/,
    /\b(?:survivalVocab|dailyVocab|fluentVocab)\b/,
  ]

  for (const file of scannedFiles) {
    const source = fs.readFileSync(path.join(root, file), "utf8")
    for (const pattern of forbidden) {
      assert.doesNotMatch(source, pattern, `${file} should use the dynamic vocabulary loader instead of eager chunks`)
    }
  }
})

test("vocabulary public index does not re-export eager aggregate datasets", () => {
  const source = fs.readFileSync(path.join(root, "src/data/vocabulary/index.ts"), "utf8")

  assert.doesNotMatch(source, /survivalVocab/)
  assert.doesNotMatch(source, /dailyVocab/)
  assert.doesNotMatch(source, /fluentVocab/)
  assert.doesNotMatch(source, /vocabData/)
  assert.doesNotMatch(source, /vocabByLevel/)
  assert.match(source, /loadVocabularyLevel/)
  assert.match(source, /loadVocabularyScope/)
  assert.match(source, /vocabLevelCounts/)
})
