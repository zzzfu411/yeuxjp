import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8")
}

test("kana and vocabulary clear confirmations describe the SRS data they remove", () => {
  for (const source of [
    read("src/components/kana/kana-page.tsx"),
    read("src/components/vocabulary/vocabulary-page.tsx"),
  ]) {
    assert.match(source, /SRS 箱位、到期时间会被清空/)
    assert.match(source, /练习历史、错题本和由练习成绩推导的掌握状态会保留/)
    assert.doesNotMatch(source, /复习记录.*不会被删除/)
  }
})
