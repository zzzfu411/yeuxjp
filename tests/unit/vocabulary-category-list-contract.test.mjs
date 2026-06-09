import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("vocabulary page delegates categorized card grid and status copy to VocabularyCategoryList", () => {
  const page = read("src/app/vocabulary/page.tsx")

  assert.match(page, /from "@\/components\/vocabulary\/vocabulary-category-list"/)
  assert.match(page, /<VocabularyCategoryList\b/)
  assert.match(page, /const \[reloadNonce, setReloadNonce\] = useState\(0\)/)
  assert.match(page, /const handleRetryLoad = useCallback/)
  assert.match(page, /setReloadNonce\(\(value\) => value \+ 1\)/)
  assert.match(page, /\[currentLevel, reloadNonce\]/)
  assert.match(page, /onRetry=\{handleRetryLoad\}/)
  assert.match(page, /onExpand=\{\(index\) =>/)
  assert.match(page, /openAt\(index\)/)
  assert.match(page, /setIsModalFlipped\(false\)/)
  assert.doesNotMatch(page, /<Flashcard\b/)
  assert.doesNotMatch(page, /<CategoryIcon\b/)
  assert.doesNotMatch(page, /getVocabularyItemsByCategory/)
  assert.doesNotMatch(page, /findVocabularyIndex/)
  assert.doesNotMatch(page, /正在加载词汇/)
  assert.doesNotMatch(page, /词汇加载失败/)
})

test("VocabularyCategoryList owns category sections, cards, indexes, and status states", () => {
  const source = read("src/components/vocabulary/vocabulary-category-list.tsx")

  assert.match(source, /export function VocabularyCategoryList/)
  assert.match(source, /from "@\/components\/ui\/button"/)
  assert.match(source, /onRetry: \(\) => void/)
  assert.match(source, /<CategoryIcon category=\{category\}/)
  assert.match(source, /<Flashcard/)
  assert.match(source, /getVocabularyItemsByCategory\(items, category\)/)
  assert.match(source, /findVocabularyIndex\(items, vocab\.id\)/)
  assert.match(source, /onExpand\(findVocabularyIndex\(items, vocab\.id\)\)/)
  assert.match(source, /loading &&/)
  assert.match(source, /!loading && error/)
  assert.match(source, /onClick=\{onRetry\}/)
  assert.match(source, /data-testid="vocabulary-retry-load"/)
  assert.match(source, /!loading && !error && items\.length === 0/)
  assert.match(source, /\\u6b63\\u5728\\u52a0\\u8f7d\\u8bcd\\u6c47/)
  assert.match(source, /\\u8bcd\\u6c47\\u52a0\\u8f7d\\u5931\\u8d25/)
  assert.match(source, /\\u91cd\\u65b0\\u52a0\\u8f7d/)
  assert.match(source, /\\u8be5\\u7b49\\u7ea7\\u6682\\u65e0\\u5339\\u914d\\u8bcd\\u6c47/)
})
