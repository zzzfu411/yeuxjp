import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

for (const relPath of ["src/lib/kana-progress.ts", "src/lib/vocab-progress.ts"]) {
  test(`${relPath} delegates string-list persistence to progress-list-storage`, () => {
    const source = read(relPath)

    assert.match(source, /from "@\/lib\/progress-list-storage"/)
    assert.match(source, /runLearningStorageTransaction/)
    assert.match(source, /readProgressListResult\(storageKey, STORAGE_LABEL\)/)
    assert.match(source, /writeProgressList\(\s*storageKey,/)
    if (relPath.includes("vocab-progress")) {
      assert.match(source, /filterKnownVocabularyIds\(result\.value\)/)
      assert.match(source, /const current = readLearned\(\)/)
    } else {
      assert.match(source, /isReviewableKanaId/)
      assert.match(source, /normalizeKanaIdList\(result\.value\)/)
      assert.match(source, /const current = readMastered\(\)/)
    }
    assert.match(source, /if \(!current\.ok\) return false/)
    assert.match(source, /const base = new Set\(current\.value\)/)
    assert.match(source, /const srsSuccess =/)
    assert.match(source, /return srsSuccess && writeProgressList\(/)
    assert.match(source, /clearSrs\(/)
    assert.match(source, /if \(!saved\)|if \(saved\)/)
    assert.match(source, /return false/)
    assert.match(source, /return true/)
    assert.doesNotMatch(source, /readSrsMap/)
    assert.doesNotMatch(source, /writeSrsMap/)
    assert.doesNotMatch(source, /notifySrs/)
    assert.match(source, /notifyProgressList\(storageKey\)/)
    assert.match(source, /PROGRESS_UPDATE_EVENT/)
    assert.doesNotMatch(source, /window\.localStorage/)
    assert.doesNotMatch(source, /function readList/)
    assert.doesNotMatch(source, /function writeList/)
    assert.doesNotMatch(source, /const PROGRESS_UPDATE_EVENT =/)
  })
}

test("progress-list-storage normalizes learned item arrays before read and write", () => {
  const source = read("src/lib/progress-list-storage.ts")

  assert.match(source, /export function normalizeProgressList\(input: unknown\)/)
  assert.match(source, /const seen = new Set<string>\(\)/)
  assert.match(source, /const item = value\.trim\(\)/)
  assert.match(source, /if \(!item \|\| seen\.has\(item\)\) continue/)
  assert.match(source, /const normalized = normalizeProgressList\(input\)/)
  assert.match(source, /validJsonStorageValue\(normalized\)/)
  assert.match(source, /JSON\.stringify\(normalizeProgressList\(list\)\)/)
})
