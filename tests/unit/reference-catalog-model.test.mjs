import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const { readReferenceCatalogState, referenceContextHref, filterReferenceEntries, referenceResultPage } = await loadTsModule("src/lib/reference-catalog-model.ts")

test("reference query and page survive detail, adjacent-item and catalog links", () => {
  const state = readReferenceCatalogState(new URLSearchParams("q=知る+使い方&page=3"))
  assert.deepEqual(state, { query: "知る 使い方", page: 3 })
  for (const href of ["/semantics", "/semantics/s-shiru-wakaru", "/semantics/s-miru-kinds"]) {
    const url = new URL(referenceContextHref(href, state), "https://local.test")
    assert.equal(url.pathname, href)
    assert.equal(url.searchParams.get("q"), "知る 使い方")
    assert.equal(url.searchParams.get("page"), "3")
  }
})

test("malformed and unsafe page values fall back to the first page", () => {
  for (const page of ["-1", "0", "1.5", "NaN", "Infinity", "1e4", "9007199254740992", ""]) {
    assert.equal(readReferenceCatalogState(new URLSearchParams({ page })).page, 1, page)
  }
  assert.equal(referenceResultPage(90, 100), 9)
  assert.equal(referenceResultPage(3, 0), 1)
})

test("clearing a search removes only catalog context and preserves a link fragment", () => {
  assert.equal(referenceContextHref("/semantics?item=s-shiru-wakaru&q=old&page=9#examples", { query: "", page: 1 }), "/semantics?item=s-shiru-wakaru#examples")
})

test("search combines words and normalizes full-width characters without mutating content", () => {
  const entries = [{ title: "ABC 使用", japanese: "わかる", description: "理解一个说明" }, { title: "ABC", japanese: "知る", description: "知道消息" }]
  assert.deepEqual(filterReferenceEntries(entries, "ＡＢＣ 理解"), [entries[0]])
  assert.deepEqual(filterReferenceEntries(entries, "不存在"), [])
  assert.equal(entries.length, 2)
})

test("query delimiters remain data and cannot change the destination path", () => {
  const query = "&page=999#fragment /?q=other"
  const result = new URL(referenceContextHref("/pragmatics/p-aisatsu-morning", { query, page: 2 }), "https://local.test")
  assert.equal(result.pathname, "/pragmatics/p-aisatsu-morning")
  assert.equal(result.searchParams.get("q"), query)
  assert.equal(result.searchParams.get("page"), "2")
  assert.equal(result.hash, "")
})
