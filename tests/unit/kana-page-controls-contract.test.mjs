import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("useKanaPageControls owns URL parsing and kana toolbar state", () => {
  const source = read("src/components/kana/use-kana-page-controls.ts")

  assert.match(source, /"use client"/)
  assert.match(source, /useSearchParams\(\)/)
  assert.match(source, /const \[mode, setMode\] = useState<KanaMode>\("hiragana"\)/)
  assert.match(source, /const \[kanaSet, setKanaSet\] = useState<KanaSet>\("seion"\)/)
  assert.match(source, /const \[showRomaji, setShowRomaji\] = useState\(true\)/)
  assert.match(source, /const \[onlyUnmastered, setOnlyUnmastered\] = useState\(false\)/)
  assert.match(source, /urlMode === "hiragana" \|\| urlMode === "katakana"/)
  assert.match(source, /parseKanaSet\(urlSet\)/)
  assert.match(source, /if \(parsedSet\) setKanaSet\(parsedSet\)/)
  assert.match(source, /cancelled = true/)
  assert.match(source, /const toggleShowRomaji = useCallback/)
  assert.match(source, /setShowRomaji\(\(value\) => !value\)/)
  assert.match(source, /const toggleOnlyUnmastered = useCallback/)
  assert.match(source, /setOnlyUnmastered\(\(value\) => !value\)/)
})
