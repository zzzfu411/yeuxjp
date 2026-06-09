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
  assert.match(panel, /tryCreateLearningBackup/)
  assert.match(panel, /parseLearningBackup/)
  assert.match(panel, /restoreLearningBackup/)
  assert.match(panel, /resetLearningData/)
  assert.match(panel, /document\.body\.appendChild\(anchor\)/)
  assert.match(panel, /anchor\?\.remove\(\)/)
  assert.match(panel, /URL\.revokeObjectURL\(url\)/)
  assert.match(panel, /无法读取本地学习数据，导出失败。/)
  assert.match(panel, /备份文件生成失败。/)
  assert.doesNotMatch(panel, /localStorage\./)
  assert.match(panel, /data-testid="learning-data-panel"/)
  assert.match(panel, /data-testid="learning-data-export"/)
  assert.match(panel, /data-testid="learning-data-import"/)
  assert.match(panel, /data-testid="learning-data-reset"/)
})
