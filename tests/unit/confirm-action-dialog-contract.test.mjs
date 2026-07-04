import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("ConfirmActionDialog provides an accessible in-app destructive confirmation", () => {
  const source = read("src/components/ui/confirm-action-dialog.tsx")
  const modal = read("src/components/ui/modal.tsx")

  assert.match(source, /export function ConfirmActionDialog/)
  assert.match(source, /from "@\/components\/ui\/modal"/)
  assert.match(source, /from "@\/components\/ui\/button"/)
  assert.match(source, /ariaLabelledBy=\{titleId\}/)
  assert.match(source, /ariaDescribedBy=\{descriptionId\}/)
  assert.match(source, /id=\{titleId\}/)
  assert.match(source, /id=\{descriptionId\}/)
  assert.match(source, /data-testid=\{testId\}/)
  assert.match(source, /data-testid=\{`\$\{testId\}-cancel`\}/)
  assert.match(source, /data-testid=\{`\$\{testId\}-confirm`\}/)
  assert.match(source, /variant="destructive"/)
  assert.match(source, /onClose=\{onCancel\}/)
  assert.match(source, /onClick=\{onCancel\}/)
  assert.match(source, /onClick=\{onConfirm\}/)
  assert.match(modal, /aria-labelledby=\{ariaLabelledBy\}/)
  assert.match(modal, /aria-describedby=\{ariaDescribedBy\}/)
})
