import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("SpeechControlsButton labels the shared speech settings modal", () => {
  const source = read("src/components/ui/speech-controls-button.tsx")

  assert.match(source, /export function SpeechControlsButton/)
  assert.match(source, /const titleId = "speech-controls-modal-title"/)
  assert.match(source, /const descriptionId = "speech-controls-modal-description"/)
  assert.match(source, /ariaLabelledBy=\{titleId\}/)
  assert.match(source, /ariaDescribedBy=\{descriptionId\}/)
  assert.match(source, /<h2 id=\{titleId\}/)
  assert.match(source, /<p id=\{descriptionId\}/)
  assert.match(source, /<SpeechSettingsBar showQuizOptions \/>/)
})
