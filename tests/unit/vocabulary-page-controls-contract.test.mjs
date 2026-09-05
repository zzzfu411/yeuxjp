import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("vocabulary controls persist filters and pagination in the URL", () => {
  const source = read("src/components/vocabulary/use-vocabulary-page-controls.ts")
  for (const name of ["level", "category", "q", "unlearned", "page"]) assert.ok(source.includes(`query.get("${name}")`))
  assert.match(source, /window\.history\.replaceState/)
  assert.match(source, /Number\.isSafeInteger\(requestedPage\)/)
  assert.match(source, /setPage\(1\)/)
  assert.match(source, /clearTimeout\(timer\)/)
  assert.match(source, /useLearningProfile\(\)/)
})

test("vocabulary page delegates toolbar state to useVocabularyPageControls", () => {
  const page = read("src/components/vocabulary/vocabulary-page.tsx")

  assert.match(page, /from "@\/components\/vocabulary\/use-vocabulary-page-controls"/)
  assert.match(page, /useVocabularyPageControls\(\)/)
  assert.match(page, /handleLevelChange: setVocabularyLevel/)
  assert.match(page, /handleSearchChange: setVocabularySearch/)
  assert.match(page, /handleToggleOnlyUnlearned: toggleOnlyUnlearned/)
  assert.match(page, /setVocabularyLevel\(level\)/)
  assert.match(page, /setVocabularySearch\(value\)/)
  assert.match(page, /toggleOnlyUnlearned\(\)/)
  assert.match(page, /resetSelection\(\)/)
  assert.doesNotMatch(page, /useSearchParams\(\)/)
  assert.doesNotMatch(page, /const \[currentLevel, setCurrentLevel\]/)
  assert.doesNotMatch(page, /const \[activeCategory, setActiveCategory\]/)
  assert.doesNotMatch(page, /const \[searchQuery, setSearchQuery\]/)
  assert.doesNotMatch(page, /const \[onlyUnlearned, setOnlyUnlearned\]/)
})
