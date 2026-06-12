import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("useVocabularyLevelData owns vocabulary level loading, retry, and safe empty data", () => {
  const source = read("src/components/vocabulary/use-vocabulary-level-data.ts")

  assert.match(source, /"use client"/)
  assert.match(source, /import \{ loadVocabularyLevel \} from "@\/data\/vocabulary\/loader"/)
  assert.match(source, /const EMPTY_VOCAB: Vocabulary\[\] = \[\]/)
  assert.match(source, /const \[reloadToken, setReloadToken\] = useState\(0\)/)
  assert.match(source, /loadVocabularyLevel\(level\)/)
  assert.match(source, /\[level, reloadToken\]/)
  assert.match(source, /let cancelled = false/)
  assert.match(source, /if \(cancelled\) return/)
  assert.match(source, /setState\(\{ level, data, error: null \}\)/)
  assert.match(source, /const VOCABULARY_LEVEL_LOAD_ERROR = "\u8bcd\u6c47\u52a0\u8f7d\u5931\u8d25"/)
  assert.match(source, /error: VOCABULARY_LEVEL_LOAD_ERROR/)
  assert.doesNotMatch(source, /err instanceof Error \? err\.message : String\(err\)/)
  assert.match(source, /const loading = state\.level !== level/)
  assert.match(source, /setReloadToken\(\(value\) => value \+ 1\)/)
  assert.match(source, /data: loading \? EMPTY_VOCAB : state\.data/)
  assert.match(source, /error: loading \? null : state\.error/)
})
