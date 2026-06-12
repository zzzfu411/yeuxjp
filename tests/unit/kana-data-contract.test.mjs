import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("kana data keeps AnimCJK as the single stroke source", () => {
  const source = read("src/data/kana-data.ts")

  assert.doesNotMatch(source, /\bstrokes\??:/)
  assert.doesNotMatch(source, /KanjiVG/)
  assert.doesNotMatch(source, /No strokes yet/)
})

test("KanaCard renders stroke affordance only from checked AnimCJK availability", () => {
  const source = read("src/components/kana/kana-card.tsx")

  assert.match(source, /hasStrokes: propHasStrokes/)
  assert.match(source, /\{propHasStrokes && \(/)
  assert.doesNotMatch(source, /kana\.strokes/)
  assert.doesNotMatch(source, /!!kana\.strokes/)
  assert.match(source, /title="笔顺可用"/)
  assert.match(source, /title="已掌握"/)
})
