import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("review runner delegates speech preferences and autoplay to useReviewAudio", () => {
  const source = read("src/components/review/review-runner.tsx")

  assert.match(source, /from "@\/components\/review\/use-review-audio"/)
  assert.equal(source.match(/useReviewAudio\(/g)?.length, 4)
  assert.doesNotMatch(source, /useSpeechPreferences/)
  assert.doesNotMatch(source, /speakJapaneseRepeated/)
  assert.doesNotMatch(source, /setTimeout\(\(\) => playAudio/)
})

test("useReviewAudio owns repeated speech, autoplay timing, and per-item replay keys", () => {
  const source = read("src/components/review/use-review-audio.ts")

  assert.match(source, /useSpeechPreferences/)
  assert.match(source, /speakJapaneseRepeated\(text, \{ repeat, gapMs \}\)/)
  assert.match(source, /autoPlay = speech\?\.prefs\.autoPlay \?\? true/)
  assert.match(source, /setTimeout\(\(\) => playAudio\(autoPlayText\), autoPlayDelayMs\)/)
  assert.match(source, /clearTimeout\(timer\)/)
  assert.match(source, /autoPlayKey/)
})
