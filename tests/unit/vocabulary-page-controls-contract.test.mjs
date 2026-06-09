import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("useVocabularyPageControls owns URL level and vocabulary toolbar state", () => {
  const source = read("src/components/vocabulary/use-vocabulary-page-controls.ts")

  assert.match(source, /"use client"/)
  assert.match(source, /useSearchParams\(\)/)
  assert.match(source, /const \[currentLevel, setCurrentLevel\] = useState<VocabLevel>\("survival"\)/)
  assert.match(source, /const \[activeCategory, setActiveCategory\] = useState<string \| null>\(null\)/)
  assert.match(source, /const \[searchQuery, setSearchQuery\] = useState\(""\)/)
  assert.match(source, /const \[onlyUnlearned, setOnlyUnlearned\] = useState\(false\)/)
  assert.match(source, /function parseVocabularyLevel/)
  assert.match(source, /value === "survival" \|\| value === "daily" \|\| value === "fluent"/)
  assert.match(source, /const parsedLevel = parseVocabularyLevel\(urlLevel\)/)
  assert.match(source, /if \(parsedLevel\) setCurrentLevel\(parsedLevel\)/)
  assert.match(source, /cancelled = true/)
  assert.match(source, /const handleLevelChange = useCallback/)
  assert.match(source, /setActiveCategory\(null\)/)
  assert.match(source, /window\.scrollTo\(\{ top: 0 \}\)/)
  assert.match(source, /const handleSearchChange = useCallback/)
  assert.match(source, /setSearchQuery\(value\)/)
  assert.match(source, /const handleToggleOnlyUnlearned = useCallback/)
  assert.match(source, /setOnlyUnlearned\(\(value\) => !value\)/)
  assert.match(source, /const scrollToCategory = useCallback/)
  assert.match(source, /document\.getElementById\(`cat-\$\{category\}`\)/)
  assert.match(source, /behavior: "smooth"/)
})

test("vocabulary page delegates toolbar state to useVocabularyPageControls", () => {
  const page = read("src/app/vocabulary/page.tsx")

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
