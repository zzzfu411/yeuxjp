import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("KanaGrid delegates kana detail modal rendering to KanaDetailModal", () => {
  const source = read("src/components/kana/kana-grid.tsx")

  assert.match(source, /from "\.\/kana-detail-modal"/)
  assert.match(source, /<KanaDetailModal\b/)
  assert.match(source, /onToggleWriting=\{\(\) => setIsWriting\(\(prev\) => !prev\)\}/)
  assert.doesNotMatch(source, /<Modal\b/)
  assert.doesNotMatch(source, /data-testid="kana-stroke-toggle"/)
  assert.doesNotMatch(source, /当前字符暂无可用 AnimCJK/)
})

test("KanaDetailModal owns stroke, speech, mastery, and navigation controls", () => {
  const source = read("src/components/kana/kana-detail-modal.tsx")

  assert.match(source, /export function KanaDetailModal/)
  assert.match(source, /<Modal isOpen=\{selectedIndex !== null\}/)
  assert.match(source, /<KanaStrokeAnimCJK/)
  assert.match(source, /data-testid="kana-stroke-toggle"/)
  assert.match(source, /data-testid="kana-mastery-toggle"/)
  assert.match(source, /isCheckingStrokeResource/)
  assert.match(source, /正在确认 AnimCJK 笔顺资源/)
  assert.match(source, /当前字符暂无可用 AnimCJK 笔顺资源/)
  assert.match(source, /aria-live="polite"/)
  assert.match(source, /<Volume2/)
  assert.match(source, /<CheckCircle2/)
  assert.match(source, /<ChevronLeft/)
  assert.match(source, /<ChevronRight/)
  assert.match(source, /aria-label="上一个假名"/)
  assert.match(source, /aria-label="下一个假名"/)
  assert.match(source, /onToggleMastered/)
})
