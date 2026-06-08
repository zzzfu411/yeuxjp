import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("review page exposes local learning data management through the shared store facade", () => {
  const dashboard = read("src/components/review/review-dashboard.tsx")
  const panel = read("src/components/review/learning-data-panel.tsx")

  assert.match(dashboard, /<LearningDataPanel \/>/)
  assert.match(panel, /createLearningBackup/)
  assert.match(panel, /parseLearningBackup/)
  assert.match(panel, /restoreLearningBackup/)
  assert.match(panel, /resetLearningData/)
  assert.doesNotMatch(panel, /localStorage\./)
  assert.match(panel, /data-testid="learning-data-panel"/)
  assert.match(panel, /data-testid="learning-data-export"/)
  assert.match(panel, /data-testid="learning-data-import"/)
  assert.match(panel, /data-testid="learning-data-reset"/)
})
