import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

test("KanaStrokeAnimCJK delegates timeline math to animcjk helpers", () => {
  const source = fs.readFileSync(path.join(root, "src/components/kana/kana-stroke-animcjk.tsx"), "utf8")

  assert.match(source, /getAnimCjkTotalStrokes\(svgs\)/)
  assert.match(source, /getAnimCjkStrokeOffsets\(svgs\)/)
  assert.match(source, /getAnimCjkTimelineEvents\(\{ startFrom, totalStrokes, speed \}\)/)
  assert.match(source, /getAnimCjkLocalActiveStroke\(\{/)
  assert.match(source, /getNextAnimCjkSpeed\(cur\)/)
  assert.match(source, /getAnimCjkSpeedLabel\(speed\)/)
  assert.doesNotMatch(source, /const SPEEDS =/)
  assert.doesNotMatch(source, /Math\.max\(0, Math\.min\(svg\.strokeCount \+ 1, activeStroke - offset\)\)/)
  assert.doesNotMatch(source, /const baseMs = 800 \* speed/)
})
