import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("SpeechPreferencesProvider reloads preferences after learning data restore or reset", () => {
  const source = read("src/components/ui/speech-preferences.tsx")

  assert.match(source, /from "@\/lib\/learning-store"/)
  assert.match(source, /from "@\/lib\/storage-keys"/)
  assert.match(source, /const syncPreferences = \(\) => \{/)
  assert.match(source, /loadSpeechPreferences\(storageKey\)/)
  assert.match(source, /window\.addEventListener\(LEARNING_STORE_EVENT, onLearningStore\)/)
  assert.match(source, /window\.removeEventListener\(LEARNING_STORE_EVENT, onLearningStore\)/)
  assert.match(source, /detail\?\.keys\?\.includes\(STORAGE_KEYS\.SPEECH_PREFS\)/)
})
