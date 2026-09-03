import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("Modal traps keyboard focus while preserving escape close behavior", () => {
  const source = read("src/components/ui/modal.tsx")

  assert.match(source, /const FOCUSABLE_SELECTOR = \[/)
  assert.match(source, /querySelectorAll<HTMLElement>\(FOCUSABLE_SELECTOR\)/)
  assert.match(source, /e\.key === "Escape"/)
  assert.match(source, /e\.key !== "Tab"/)
  assert.match(source, /focusableElements\.length === 0/)
  assert.match(source, /dialog\.focus\(\)/)
  assert.match(source, /e\.shiftKey/)
  assert.match(source, /activeElement === dialog/)
  assert.match(source, /lastElement\.focus\(\)/)
  assert.match(source, /firstElement\.focus\(\)/)
  assert.match(source, /const openModalStack: HTMLDivElement\[\] = \[\]/)
  assert.match(source, /onCloseRef/)
  assert.match(source, /openModalStack\.length > 0 && openModalStack\.at\(-1\) !== dialog/)
  assert.match(source, /addEventListener\("keydown", onKey, true\)/)
  assert.match(source, /fixed inset-0 z-\[100\] !mt-0 flex/)
  assert.match(source, /from "react-dom"/)
  assert.match(source, /createPortal/)
  assert.match(source, /setPortalTarget\(document\.body\)/)
  assert.match(source, /if \(!show \|\| !portalTarget\) return null/)
  assert.match(source, /return createPortal\(/)
  assert.match(source, /portalTarget\n  \)/)
  assert.match(source, /if \(!isOpen \|\| !show \|\| !portalTarget\) return/)
  assert.match(source, /\[getFocusableElements, isOpen, portalTarget, show\]/)
  assert.doesNotMatch(source, /\[getFocusableElements, isOpen, onClose, show\]/)
})

test("Modal exposes labelledby and describedby hooks to callers", () => {
  const source = read("src/components/ui/modal.tsx")

  assert.match(source, /ariaLabelledBy\?: string/)
  assert.match(source, /ariaDescribedBy\?: string/)
  assert.match(source, /aria-labelledby=\{ariaLabelledBy\}/)
  assert.match(source, /aria-describedby=\{ariaDescribedBy\}/)
})
