import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("reference modal navigation hook owns selected index and arrow-key behavior", () => {
  const source = read("src/lib/use-indexed-modal-navigation.ts")

  assert.match(source, /export function useIndexedModalNavigation\(itemCount: number\)/)
  assert.match(source, /useState<number \| null>\(null\)/)
  assert.match(source, /rawSelectedIndex === null \|\| itemCount <= 0/)
  assert.match(source, /openAt/)
  assert.match(source, /Math\.min\(rawSelectedIndex, itemCount - 1\)/)
  assert.match(source, /selectedPosition/)
  assert.match(source, /event\.key === "ArrowRight"/)
  assert.match(source, /event\.key === "ArrowLeft"/)
  assert.match(source, /window\.addEventListener\("keydown", handleKeyDown\)/)
  assert.match(source, /window\.removeEventListener\("keydown", handleKeyDown\)/)
})

test("grammar, semantics, and pragmatics pages delegate modal navigation to the shared hook", () => {
  const pages = [
    "src/app/grammar/page.tsx",
    "src/app/semantics/page.tsx",
    "src/app/pragmatics/page.tsx",
  ]

  for (const relPath of pages) {
    const source = read(relPath)

    assert.match(source, /from "@\/lib\/use-indexed-modal-navigation"/, relPath)
    assert.match(source, /useIndexedModalNavigation\(/, relPath)
    assert.match(source, /openAt\(index\)/, relPath)
    assert.match(source, /onClose=\{close\}/, relPath)
    assert.match(source, /onClick=\{goPrev\}/, relPath)
    assert.match(source, /onClick=\{goNext\}/, relPath)
    assert.match(source, /selectedPosition/, relPath)
    assert.doesNotMatch(source, /window\.addEventListener\("keydown"/, relPath)
    assert.doesNotMatch(source, /setSelectedIndex\(\(prev\)/, relPath)
  }
})

test("vocabulary page keeps card-specific flip behavior while sharing indexed navigation", () => {
  const source = read("src/app/vocabulary/page.tsx")

  assert.match(source, /from "@\/lib\/use-indexed-modal-navigation"/)
  assert.match(source, /useIndexedModalNavigation\(currentDataLength\)/)
  assert.match(source, /onExpand=\{\(index\) => \{/)
  assert.match(source, /openAt\(index\)/)
  assert.match(source, /onClose=\{resetSelection\}/)
  assert.match(source, /onNext=\{handleNext\}/)
  assert.match(source, /onPrev=\{handlePrev\}/)
  assert.match(source, /goNext\(\)/)
  assert.match(source, /goPrev\(\)/)
  assert.match(source, /setIsModalFlipped\(false\)/)
  assert.match(source, /e\.key === " "/)
  assert.doesNotMatch(source, /e\.key === "ArrowRight"/)
  assert.doesNotMatch(source, /e\.key === "ArrowLeft"/)
  assert.doesNotMatch(source, /setSelectedIndex\(\(prev\)/)
})
