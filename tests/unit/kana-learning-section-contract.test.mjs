import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("kana page delegates repeated section rendering to KanaLearningSection", () => {
  const page = read("src/components/kana/kana-page.tsx")
  const sections = read("src/components/kana/kana-page-sections.tsx")

  assert.match(page, /from "@\/components\/kana\/kana-page-sections"/)
  assert.match(page, /<KanaPageSections\b/)
  assert.match(page, /pageData=\{pageData\}/)
  assert.doesNotMatch(page, /from "@\/components\/kana\/kana-learning-section"/)
  assert.doesNotMatch(page, /<KanaLearningSection\b/)

  assert.match(sections, /from "@\/components\/kana\/kana-learning-section"/)
  assert.match(sections, /export function KanaPageSections/)
  assert.match(sections, /<KanaLearningSection\b/)
  assert.match(sections, /banner="seion"/)
  assert.match(sections, /banner="dakuon"/)
  assert.match(sections, /banner="yoon"/)
  assert.match(sections, /banner="sokuon"/)
  assert.match(sections, /banner="all"/)
  assert.match(sections, /data=\{visibleSeion\}/)
  assert.match(sections, /data=\{visibleDakuonHandakuon\}/)
  assert.match(sections, /data=\{visibleYoon\}/)
  assert.match(sections, /data=\{visibleSpecial\}/)
  assert.match(sections, /data=\{visibleSeionDakuon\}/)
  assert.doesNotMatch(page, /from "@\/components\/kana\/kana-grid"/)
  assert.doesNotMatch(page, /from "@\/components\/kana\/kana-banner"/)
  assert.doesNotMatch(page, /<KanaGrid\b/)
  assert.doesNotMatch(page, /<KanaBanner\b/)
})

test("KanaLearningSection owns banner, heading, description, and grid wiring", () => {
  const source = read("src/components/kana/kana-learning-section.tsx")

  assert.match(source, /export function KanaLearningSection/)
  assert.match(source, /type KanaBannerKey/)
  assert.match(source, /import type \{ KanaMode \}/)
  assert.match(source, /<KanaBanner banner=\{banner\}/)
  assert.match(source, /<h2 className="text-lg font-bold">\{title\}<\/h2>/)
  assert.match(source, /<KanaGrid/)
  assert.match(source, /data=\{data\}/)
  assert.match(source, /mode=\{mode\}/)
  assert.match(source, /rows=\{\[\.\.\.rows\]\}/)
  assert.match(source, /columns=\{columns\}/)
  assert.match(source, /showRomaji=\{showRomaji\}/)
  assert.match(source, /isMastered=\{isMastered\}/)
  assert.match(source, /onToggleMastered=\{onToggleMastered\}/)
})

test("KanaPageHero owns static kana intro copy", () => {
  const source = read("src/components/kana/kana-page-hero.tsx")

  assert.match(source, /export function KanaPageHero/)
  assert.match(source, /五十音图 \(Gojūon\)/)
  assert.match(source, /termId="hiragana"/)
  assert.match(source, /termId="katakana"/)
  assert.match(source, /平假名/)
  assert.match(source, /片假名/)
})
