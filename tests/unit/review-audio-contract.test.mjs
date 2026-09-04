import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

function reviewSessionSources() {
  return [
    read("src/components/review/review-runner.tsx"),
    read("src/components/review/today-review-session.tsx"),
    read("src/components/review/kana-review-session.tsx"),
    read("src/components/review/vocab-review-session.tsx"),
    read("src/components/review/mistake-review-session.tsx"),
  ].join("\n")
}

test("review sessions delegate speech preferences and autoplay to useReviewAudio", () => {
  const source = reviewSessionSources()

  assert.equal(source.match(/useReviewAudio\(/g)?.length, 4)
  assert.doesNotMatch(source, /useSpeechPreferences/)
  assert.doesNotMatch(source, /speakJapaneseRepeated/)
  assert.doesNotMatch(source, /setTimeout\(\(\) => playAudio/)
})

test("useReviewAudio owns repeated speech, autoplay timing, and presentation replay keys", () => {
  const source = read("src/components/review/use-review-audio.ts")

  assert.match(source, /useSpeechPreferences/)
  assert.match(source, /useRef/)
  assert.match(source, /const playAudioRef = useRef\(playAudio\)/)
  assert.match(source, /playAudioRef\.current = playAudio/)
  assert.match(source, /speakJapaneseRepeated\(text, \{ repeat, gapMs \}\)/)
  assert.match(source, /autoPlay = speech\?\.prefs\.autoPlay \?\? true/)
  assert.match(source, /setTimeout\(\(\) => \{[\s\S]*?playAudioRef\.current\(autoPlayText\)/)
  assert.doesNotMatch(source, /autoPlayText, playAudio, speech\?\.prefs\.autoPlay/)
  assert.match(source, /clearTimeout\(timer\)/)
  assert.match(source, /clearTimeout\(pendingTimer\)/)
  assert.match(source, /autoPlayTimerRef\.current !== timer/)
  assert.match(source, /autoPlayKey/)
  assert.match(source, /autoPlayKey\?: string \| number \| null/)
  assert.match(source, /useEffect\(\(\) => \(\) => cancelJapaneseSpeech\(\), \[autoPlayKey\]\)/)
})

test("every review session keys audio to its presentation version", () => {
  for (const relPath of [
    "src/components/review/today-review-session.tsx",
    "src/components/review/kana-review-session.tsx",
    "src/components/review/vocab-review-session.tsx",
    "src/components/review/mistake-review-session.tsx",
  ]) {
    assert.match(read(relPath), /autoPlayKey: review\.presentationVersion/)
  }
})
