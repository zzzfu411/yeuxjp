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

  assert.match(page, /from "@\/components\/kana\/kana-learning-section"/)
  assert.match(page, /<KanaLearningSection\b/)
  assert.match(page, /banner="seion"/)
  assert.match(page, /banner="dakuon"/)
  assert.match(page, /banner="yoon"/)
  assert.match(page, /banner="sokuon"/)
  assert.match(page, /banner="all"/)
  assert.match(page, /data=\{visibleSeion\}/)
  assert.match(page, /data=\{visibleDakuonHandakuon\}/)
  assert.match(page, /data=\{visibleYoon\}/)
  assert.match(page, /data=\{visibleSpecial\}/)
  assert.match(page, /data=\{visibleSeionDakuon\}/)
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
