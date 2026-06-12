import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const root = path.resolve(import.meta.dirname, "..", "..")
const model = await loadTsModule("src/lib/glossary-model.ts")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("GlossaryProvider delegates filtering, grouping, and modal rendering", () => {
  const source = read("src/components/ui/glossary.tsx")

  assert.match(source, /export function GlossaryProvider/)
  assert.match(source, /from "@\/components\/ui\/glossary-modal"/)
  assert.match(source, /from "@\/lib\/glossary-model"/)
  assert.match(source, /filterGlossaryEntries\(query\)/)
  assert.match(source, /groupGlossaryEntriesByCategory\(filtered\)/)
  assert.match(source, /<GlossaryModal/)
  assert.match(source, /onQueryChange=\{setQuery\}/)
  assert.match(source, /onActivate=\{setActiveId\}/)
  assert.doesNotMatch(source, /GLOSSARY_CATEGORY_LABEL/)
  assert.doesNotMatch(source, /Object\.keys\(byCategory\)/)
  assert.doesNotMatch(source, /glossary-term-\$\{entry\.id\}/)
  assert.doesNotMatch(source, /Examples/)
})

test("GlossaryModal owns localized glossary presentation", () => {
  const source = read("src/components/ui/glossary-modal.tsx")

  assert.match(source, /export function GlossaryModal/)
  assert.match(source, /hasGlossaryMatches/)
  assert.match(source, /type GlossaryCategoryMap/)
  assert.match(source, /Object\.keys\(byCategory\)/)
  assert.match(source, /GLOSSARY_CATEGORY_LABEL\[category\]/)
  assert.match(source, /id=\{`glossary-term-\$\{entry\.id\}`\}/)
  assert.match(source, /例子/)
  assert.match(source, /查看全部/)
  assert.match(source, /搜索术语/)
  assert.match(source, /const hasMatches = hasGlossaryMatches\(byCategory\)/)
  assert.match(source, /没有找到匹配术语/)
  assert.match(source, /试试换一个关键词/)
  assert.doesNotMatch(source, /Examples/)
})

test("glossary model filters and groups entries by category", () => {
  const entries = [
    { id: "kana", term: "假名", category: "kana", short: "文字", examples: [{ jp: "かな", note: "kana note" }] },
    { id: "particle", term: "助词", category: "grammar", short: "语法小词", detail: "は/が/を" },
    { id: "jlpt", term: "JLPT", category: "levels", short: "等级" },
  ]

  assert.equal(model.normalizeGlossaryQuery("  Kana  "), "kana")
  assert.deepEqual(model.filterGlossaryEntries("", entries).map((entry) => entry.id), ["kana", "particle", "jlpt"])
  assert.deepEqual(model.filterGlossaryEntries("KANA NOTE", entries).map((entry) => entry.id), ["kana"])
  assert.deepEqual(model.filterGlossaryEntries("は", entries).map((entry) => entry.id), ["particle"])

  const grouped = model.groupGlossaryEntriesByCategory(entries)
  assert.deepEqual(grouped.kana.map((entry) => entry.id), ["kana"])
  assert.deepEqual(grouped.grammar.map((entry) => entry.id), ["particle"])
  assert.deepEqual(grouped.levels.map((entry) => entry.id), ["jlpt"])
  assert.deepEqual(grouped.pronunciation, [])
  assert.equal(model.hasGlossaryMatches(grouped), true)
  assert.equal(model.hasGlossaryMatches(model.groupGlossaryEntriesByCategory([])), false)
})
