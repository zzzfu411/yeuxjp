import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const kind = await loadTsModule("src/lib/mistake-review-kind.ts")

test("mistake review kind follows the same rules as deck labels", () => {
  assert.equal(kind.mistakeReviewKind({ itemType: "grammar", type: "quiz" }), "grammar")
  assert.equal(kind.mistakeReviewKind({ type: "verb-masu" }), "grammar")
  assert.equal(kind.mistakeReviewKind({ type: "grammar-practice" }), "grammar")
  assert.equal(kind.mistakeReviewKind({ itemType: "sentence", type: "particle" }), "sentence")
  assert.equal(kind.mistakeReviewKind({ itemType: "kana", type: "kana" }), "kana")
  assert.equal(kind.mistakeReviewKind({ itemType: "vocab", type: "review:vocab" }), "vocab")
  assert.equal(kind.mistakeReviewKind({ itemType: "lesson", type: "lesson" }), "other")

  assert.equal(kind.mistakeReviewDeckLabel({ itemType: "vocab", type: "review:vocab" }), "词汇错题")
  assert.equal(kind.mistakeReviewDeckLabel({ itemType: "grammar", type: "grammar-practice" }), "语法错题")
  assert.equal(kind.mistakeReviewDeckLabel({ type: "verb-te" }), "语法错题")
  assert.equal(kind.mistakeReviewDeckLabel({ itemType: "kana", type: "kana" }), "假名错题")
  assert.equal(kind.mistakeReviewDeckLabel({ itemType: "sentence", type: "particle" }), "造句错题")
  assert.equal(kind.mistakeReviewDeckLabel({ type: "unknown" }), "错题")
})

test("due mistake kind counts only due ids and treat missing items as other", () => {
  const counts = kind.countDueMistakesByKind(
    ["vocab-1", "grammar-1", "verb-1", "kana-1", "missing"],
    [
      { id: "vocab-1", itemType: "vocab", type: "review:vocab" },
      { id: "grammar-1", itemType: "grammar", type: "grammar-practice" },
      { id: "verb-1", type: "verb-masu" },
      { id: "kana-1", itemType: "kana", type: "kana" },
      { id: "sentence-idle", itemType: "sentence", type: "particle" },
    ]
  )

  assert.deepEqual(counts, { vocab: 1, grammar: 2, kana: 1, sentence: 0, other: 1 })
})

test("mistake kind due labels omit zeros and keep 词汇/语法/假名/造句/其他 order", () => {
  assert.equal(kind.formatMistakeKindDue(kind.emptyReviewMistakeKindDue()), "")
  assert.equal(
    kind.formatMistakeKindDue({ vocab: 1, grammar: 2, kana: 0, sentence: 3, other: 4 }),
    "词汇 1 · 语法 2 · 造句 3 · 其他 4"
  )
  assert.equal(
    kind.formatMistakeKindDue({ vocab: 1, grammar: 2, kana: 3, sentence: 4, other: 5 }),
    "词汇 1 · 语法 2 · 假名 3 · 造句 4 · 其他 5"
  )
})
