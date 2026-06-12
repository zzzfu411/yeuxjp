import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("SpeakButton defaults to localized accessible copy", () => {
  const source = read("src/components/ui/speak-button.tsx")

  assert.match(source, /aria-label=\{label \?\? "朗读"\}/)
  assert.match(source, /title=\{label \?\? "朗读"\}/)
  assert.doesNotMatch(source, /Pronounce/)
})
