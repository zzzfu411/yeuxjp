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

  const reads = source.match(/const previous = readSrsMap\(storageKey\)/g) ?? []
  assert.equal(reads.length, 2)
  assert.match(source, /canStoreSrsId\(storageKey, id\)/)
  assert.match(source, /setMap\(filterSrsMapForStorage\(storageKey, next\)\)/)
  assert.match(source, /gradeSrs\(storageKey, id, result\)/)
  assert.match(source, /setMap\(readSrsMap\(storageKey\)\)/)
  assert.match(source, /if \(!writeSrsMap\(storageKey, next\)\) return false/)
  assert.match(source, /if \(!writeSrsMap\(storageKey, \{\}\)\) return false/)
  assert.match(source, /return true/)
  assert.match(source, /return false/)
  assert.match(source, /setMap\(next\)/)
  assert.match(source, /setMap\(\{\}\)/)
})
