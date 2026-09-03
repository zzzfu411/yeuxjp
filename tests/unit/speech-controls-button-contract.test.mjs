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
  assert.match(source, /from "@\/components\/ui\/modal"/)
  assert.match(source, /<Modal/)
  assert.match(source, /const titleId = "speech-controls-modal-title"/)
  assert.match(source, /const descriptionId = "speech-controls-modal-description"/)
  assert.match(source, /ariaLabelledBy=\{titleId\}/)
  assert.match(source, /ariaDescribedBy=\{descriptionId\}/)
  assert.match(source, /<h2 id=\{titleId\}/)
  assert.match(source, /<p id=\{descriptionId\}/)
  assert.match(source, /<SpeechSettingsBar showQuizOptions \/>/)
})

test("Speech controls stay in the navbar while Modal portals above paper grain", () => {
  const modal = read("src/components/ui/modal.tsx")
  const navbar = read("src/components/layout/navbar.tsx")
  const speech = read("src/components/ui/speech-controls-button.tsx")
  const grain = read("src/app/globals.css")
  const layout = read("src/app/layout.tsx")

  assert.match(modal, /createPortal/)
  assert.match(modal, /setPortalTarget\(document\.body\)/)
  assert.match(modal, /fixed inset-0 z-\[100\] !mt-0 flex/)

  assert.match(navbar, /<SpeechControlsButton \/>/)
  assert.match(navbar, /paper-nav fixed inset-x-0 top-0 z-\[60\]/)
  assert.doesNotMatch(navbar, /z-\[(?:8\d|9\d|1\d{2,})\]/)

  assert.match(speech, /<Modal/)
  assert.doesNotMatch(speech, /GlossaryProvider|createPortal/)

  assert.match(grain, /\.paper-grain \{[\s\S]*?z-index: 80;/)
  assert.match(grain, /\.paper-vignette \{[\s\S]*?z-index: 81;/)

  assert.match(layout, /<PaperGrain \/>/)
  assert.match(layout, /<Navbar \/>/)
})
