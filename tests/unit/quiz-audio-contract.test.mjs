import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("quiz session delegates speech preferences and autoplay timers to useQuizAudio", () => {
  const source = read("src/components/quiz/use-quiz-session.ts")

  assert.match(source, /from "@\/components\/quiz\/use-quiz-audio"/)
  assert.match(source, /useQuizAudio\(\{/)
  assert.match(source, /autoPlayText: currentQuestion\?\.questionAudio/)
  assert.match(source, /autoPlayKey: currentQuestion/)
  assert.match(source, /autoPlayEnabled: Boolean\(currentQuestion\?\.autoPlayAudio\)/)
  assert.doesNotMatch(source, /useSpeechPreferences/)
  assert.doesNotMatch(source, /speakJapaneseRepeated/)
  assert.doesNotMatch(source, /setTimeout\(\(\) => playAudio/)
  assert.doesNotMatch(source, /speech\?\.prefs/)
})

test("useQuizAudio owns repeated speech, autoplay timing, and cleanup", () => {
  const source = read("src/components/quiz/use-quiz-audio.ts")

  assert.match(source, /useSpeechPreferences/)
  assert.match(source, /speakJapaneseRepeated\(text, \{ repeat, gapMs \}\)/)
  assert.match(source, /autoPlayText/)
  assert.match(source, /autoPlayKey/)
  assert.match(source, /autoPlayEnabled/)
  assert.match(source, /setTimeout\(\(\) => playAudio\(autoPlayText\), autoPlayDelayMs\)/)
  assert.match(source, /clearTimeout\(timer\)/)
  assert.match(source, /useEffect\(\(\) => \(\) => cancelJapaneseSpeech\(\), \[autoPlayKey\]\)/)
})
