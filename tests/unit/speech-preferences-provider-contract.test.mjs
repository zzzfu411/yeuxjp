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

test("SpeechPreferencesProvider reloads preferences after same-tab speech preference events", () => {
  const source = read("src/components/ui/speech-preferences.tsx")

  assert.match(source, /SPEECH_PREFS_EVENT/)
  assert.match(source, /const onSpeechPrefs = \(event: Event\) => \{/)
  assert.match(source, /detail\?\.storageKey !== storageKey/)
  assert.match(source, /window\.addEventListener\(SPEECH_PREFS_EVENT, onSpeechPrefs\)/)
  assert.match(source, /window\.removeEventListener\(SPEECH_PREFS_EVENT, onSpeechPrefs\)/)
})

test("SpeechPreferencesProvider reloads preferences after cross-tab storage changes", () => {
  const source = read("src/components/ui/speech-preferences.tsx")

  assert.match(source, /const onStorage = \(event: StorageEvent\) => \{/)
  assert.match(source, /if \(event\.key !== storageKey\) return/)
  assert.match(source, /window\.addEventListener\("storage", onStorage\)/)
  assert.match(source, /window\.removeEventListener\("storage", onStorage\)/)
})

test("SpeechSettingsBar reports preference persistence failures", () => {
  const source = read("src/components/ui/speech-preferences.tsx")

  assert.match(source, /from "@\/components\/practice\/practice-save-error"/)
  assert.match(source, /updateSpeechPreferencesWithStatus/)
  assert.match(source, /resetSpeechPreferencesWithStatus/)
  assert.match(source, /return result\.saved/)
  assert.match(source, /const \[saveError, setSaveError\] = React\.useState\(false\)/)
  assert.match(source, /setSaveError\(!await update\(patch\)\)/)
  assert.match(source, /setSaveError\(!await reset\(\)\)/)
  assert.match(source, /data-testid=\{`speech-repeat-\$\{n\}`\}/)
  assert.match(source, /data-testid="speech-preferences-reset"/)
  assert.match(source, /<PracticeSaveError/)
  assert.match(source, /title="语音设置没有保存成功"/)
})
