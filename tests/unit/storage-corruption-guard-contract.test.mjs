import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("incremental learning mutations reject untrusted storage snapshots", () => {
  const learning = read("src/lib/learning-progress.ts")
  const kana = read("src/lib/kana-progress.ts")
  const vocab = read("src/lib/vocab-progress.ts")
  const mistakes = read("src/lib/mistake-notebook.ts")
  const srs = read("src/lib/srs-storage.ts")
  const speech = read("src/lib/speech.ts")

  assert.match(learning, /if \(!currentResult\.ok\) return false/)
  assert.match(learning, /if \(!previousResultsResult\.ok \|\| !previousItemsResult\.ok\) return false/)
  assert.match(kana, /if \(!current\.ok\) return false/)
  assert.match(vocab, /if \(!current\.ok\) return false/)
  assert.match(mistakes, /readMistakeListResult\(storageKey\)/)
  assert.match(mistakes, /if \(!current\.ok\) return false/)
  assert.match(srs, /readSrsMapResult\(storageKey\)/)
  assert.match(srs, /if \(!current\.ok\) return false/)
  assert.match(speech, /if \(!current\.ok\) return \{ prefs: current\.value, saved: false \}/)
})

test("destructive reset paths explicitly replace invalid storage", () => {
  assert.match(read("src/lib/kana-progress.ts"), /writeProgressList\([\s\S]*replaceInvalid: true/)
  assert.match(read("src/lib/vocab-progress.ts"), /writeProgressList\([\s\S]*replaceInvalid: true/)
  assert.match(read("src/lib/mistake-notebook.ts"), /writeMistakeList\([\s\S]*replaceInvalid: true/)
  assert.match(read("src/lib/srs-storage.ts"), /writeSrsMap\(storageKey, \{\}, \{ replaceInvalid: true \}\)/)
  assert.match(read("src/lib/speech.ts"), /writeSpeechPreferences\(DEFAULT_SPEECH_PREFERENCES, storageKey, \{ replaceInvalid: true \}\)/)
})

test("incremental writes compare the raw snapshot before persistence", () => {
  for (const relPath of [
    "src/lib/learning-progress.ts",
    "src/lib/kana-progress.ts",
    "src/lib/vocab-progress.ts",
    "src/lib/mistake-notebook.ts",
    "src/lib/srs-storage.ts",
    "src/lib/srs.ts",
    "src/lib/speech.ts",
  ]) {
    assert.match(read(relPath), /expectedRaw:/, relPath)
  }
})
