import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("kana page delegates mode, set, filter, and progress controls to KanaControls", () => {
  const route = read("src/app/kana/page.tsx")
  const page = read("src/components/kana/kana-page.tsx")

  assert.doesNotMatch(route, /"use client"/)
  assert.match(route, /from "@\/components\/kana\/kana-page"/)
  assert.match(route, /<KanaPage \/>/)
  assert.match(page, /from "@\/components\/kana\/kana-controls"/)
  assert.match(page, /from "@\/components\/kana\/use-kana-page-controls"/)
  assert.match(page, /useKanaPageControls\(\)/)
  assert.match(page, /<KanaControls\b/)
  assert.match(page, /mode=\{mode\}/)
  assert.match(page, /kanaSet=\{kanaSet\}/)
  assert.match(page, /progress=\{activeProgress\}/)
  assert.match(page, /hint=\{kanaSetHint\}/)
  assert.match(page, /onModeChange=\{setMode\}/)
  assert.match(page, /onKanaSetChange=\{setKanaSet\}/)
  assert.match(page, /onToggleRomaji=\{toggleShowRomaji\}/)
  assert.match(page, /onToggleOnlyUnmastered=\{toggleOnlyUnmastered\}/)
  assert.match(page, /onClearMastered=\{handleClearMastered\}/)
  assert.match(page, /from "@\/components\/practice\/practice-save-error"/)
  assert.match(page, /const \[saveError, setSaveError\] = useState\(false\)/)
  assert.match(page, /const saved = clearMastered\(\)/)
  assert.match(page, /const saved = toggleMastered\(romaji\)/)
  assert.match(page, /setSaveError\(!saved\)/)
  assert.match(page, /<PracticeSaveError show=\{saveError\} \/>/)
  assert.doesNotMatch(page, /EyeOff/)
  assert.doesNotMatch(page, /setShowRomaji\(v => !v\)/)
  assert.doesNotMatch(page, /useSearchParams/)
  assert.doesNotMatch(page, /parseKanaSet\(urlSet\)/)
  assert.doesNotMatch(page, /setOnlyUnmastered\(\(value\) => !value\)/)
})

test("KanaControls owns kana mode tabs, set tabs, filters, and progress copy", () => {
  const source = read("src/components/kana/kana-controls.tsx")

  assert.match(source, /export function KanaControls/)
  assert.match(source, /onModeChange\("hiragana"\)/)
  assert.match(source, /onModeChange\("katakana"\)/)
  assert.match(source, /onKanaSetChange\(set\.id\)/)
  assert.match(source, /onToggleRomaji/)
  assert.match(source, /onToggleOnlyUnmastered/)
  assert.match(source, /onClearMastered/)
  assert.match(source, /Progress: \{progress\.learned\}\/\{progress\.total\}/)
  assert.match(source, /<EyeOff/)
  assert.match(source, /<GlossaryButton/)
})
