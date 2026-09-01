import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("useSrsDeck mutates decks from current storage snapshots", () => {
  const source = read("src/lib/srs.ts")

  const reads = source.match(/const current = readSrsMapResult\(storageKey\)/g) ?? []
  assert.equal(reads.length, 2)
  assert.match(source, /if \(!current\.ok\) return false/)
  assert.match(source, /const refreshDeck = useCallback\(\(\) => \{/)
  assert.match(source, /queueLearningNotification/)
  assert.match(source, /setMap\(readSrsMap\(storageKey\)\)/)
  assert.match(source, /setNow\(Date\.now\(\)\)/)
  assert.match(source, /refreshDeck\(\)/)
  assert.match(source, /canStoreSrsId\(storageKey, id\)/)
  assert.match(source, /setMap\(filterSrsMapForStorage\(storageKey, next\)\)/)
  assert.match(source, /setNow\(now\)/)
  assert.match(source, /gradeSrs\(storageKey, id, result\)/)
  assert.match(source, /gradeExistingSrs\(storageKey, id, result\)/)
  assert.match(source, /queueLearningNotification\(refreshDeck\)/)
  assert.match(source, /hasSrs\(storageKey, id\)/)
  assert.match(source, /if \(!writeSrsMap\(storageKey, next, \{ expectedRaw: current\.raw \}\)\) return false/)
  assert.match(source, /if \(!writeSrsMap\(storageKey, \{\}, \{ replaceInvalid: true \}\)\) return false/)
  assert.match(source, /return \{ map, dueIds, loaded, enroll, remove, grade, gradeExisting, has, clear \}/)
  assert.match(source, /return true/)
  assert.match(source, /return false/)
  assert.match(source, /setMap\(next\)/)
  assert.match(source, /setMap\(\{\}\)/)
  assert.match(source, /}, \[refreshDeck, storageKey\]\)/)
})
