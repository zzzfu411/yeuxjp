import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const verbs = await loadTsModule("src/lib/verb-conjugation.ts")

test("ichidan verbs drop ru before common beginner forms", () => {
  assert.equal(verbs.conjugateVerb("たべる", "ichidan", "masu"), "たべます")
  assert.equal(verbs.conjugateVerb("たべる", "ichidan", "nai"), "たべない")
  assert.equal(verbs.conjugateVerb("たべる", "ichidan", "te"), "たべて")
  assert.equal(verbs.conjugateVerb("たべる", "ichidan", "ta"), "たべた")
})

test("irregular verbs produce beginner forms", () => {
  assert.equal(verbs.conjugateVerb("くる", "kuru", "masu"), "きます")
  assert.equal(verbs.conjugateVerb("くる", "kuru", "nai"), "こない")
  assert.equal(verbs.conjugateVerb("する", "suru", "te"), "して")
  assert.equal(verbs.conjugateVerb("べんきょうする", "suru", "ta"), "べんきょうした")
})

test("godan iku keeps its te/ta exception", () => {
  assert.equal(verbs.conjugateVerb("いく", "godan", "masu"), "いきます")
  assert.equal(verbs.conjugateVerb("いく", "godan", "nai"), "いかない")
  assert.equal(verbs.conjugateVerb("いく", "godan", "te"), "いって")
  assert.equal(verbs.conjugateVerb("いく", "godan", "ta"), "いった")
})

test("godan pool covers u/gu/nu endings used by N5 verbs", () => {
  assert.equal(verbs.conjugateVerb("かう", "godan", "masu"), "かいます")
  assert.equal(verbs.conjugateVerb("かう", "godan", "nai"), "かわない")
  assert.equal(verbs.conjugateVerb("かう", "godan", "te"), "かって")
  assert.equal(verbs.conjugateVerb("かう", "godan", "ta"), "かった")
  assert.equal(verbs.conjugateVerb("およぐ", "godan", "masu"), "およぎます")
  assert.equal(verbs.conjugateVerb("およぐ", "godan", "nai"), "およがない")
  assert.equal(verbs.conjugateVerb("およぐ", "godan", "te"), "およいで")
  assert.equal(verbs.conjugateVerb("およぐ", "godan", "ta"), "およいだ")
  assert.equal(verbs.conjugateVerb("しぬ", "godan", "masu"), "しにます")
  assert.equal(verbs.conjugateVerb("しぬ", "godan", "nai"), "しなない")
  assert.equal(verbs.conjugateVerb("しぬ", "godan", "te"), "しんで")
  assert.equal(verbs.conjugateVerb("しぬ", "godan", "ta"), "しんだ")
})

test("godan-ru and ichidan kinds stay distinct for N5 lookalikes", () => {
  assert.equal(verbs.conjugateVerb("かえる", "godan", "masu"), "かえります")
  assert.equal(verbs.conjugateVerb("はしる", "godan", "te"), "はしって")
  assert.equal(verbs.conjugateVerb("わかる", "godan", "nai"), "わからない")
  assert.equal(verbs.conjugateVerb("でる", "ichidan", "te"), "でて")
  assert.equal(verbs.conjugateVerb("できる", "ichidan", "masu"), "できます")
  assert.equal(verbs.conjugateVerb("おしえる", "ichidan", "ta"), "おしえた")

  const dicts = verbs.VERB_CONJ_VERBS.map((verb) => verb.dict)
  for (const dict of ["およぐ", "しぬ", "かう", "あう", "つかう", "わかる", "のる", "つくる", "はたらく", "あるく", "やすむ", "もつ", "でる", "できる", "おしえる"]) {
    assert.ok(dicts.includes(dict), `VERB_CONJ_VERBS should include ${dict}`)
  }
  assert.equal(verbs.VERB_CONJ_VERBS.find((verb) => verb.dict === "いく")?.kind, "godan")
  assert.equal(verbs.VERB_CONJ_VERBS.find((verb) => verb.dict === "かえる")?.kind, "godan")
  assert.equal(verbs.VERB_CONJ_VERBS.find((verb) => verb.dict === "はしる")?.kind, "godan")
})

test("potential and causative cover ichidan, godan, and irregulars", () => {
  assert.equal(verbs.conjugateVerb("たべる", "ichidan", "potential"), "たべられる")
  assert.equal(verbs.conjugateVerb("たべる", "ichidan", "causative"), "たべさせる")
  assert.equal(verbs.conjugateVerb("かく", "godan", "potential"), "かける")
  assert.equal(verbs.conjugateVerb("かく", "godan", "causative"), "かかせる")
  assert.equal(verbs.conjugateVerb("かう", "godan", "potential"), "かえる")
  assert.equal(verbs.conjugateVerb("かう", "godan", "causative"), "かわせる")
  assert.equal(verbs.conjugateVerb("いく", "godan", "potential"), "いける")
  assert.equal(verbs.conjugateVerb("いく", "godan", "causative"), "いかせる")
  assert.equal(verbs.conjugateVerb("する", "suru", "potential"), "できる")
  assert.equal(verbs.conjugateVerb("する", "suru", "causative"), "させる")
  assert.equal(verbs.conjugateVerb("べんきょうする", "suru", "potential"), "べんきょうできる")
  assert.equal(verbs.conjugateVerb("べんきょうする", "suru", "causative"), "べんきょうさせる")
  assert.equal(verbs.conjugateVerb("くる", "kuru", "potential"), "こられる")
  assert.equal(verbs.conjugateVerb("くる", "kuru", "causative"), "こさせる")
  assert.match(verbs.explainConjugation({ dict: "たべる", kanji: "食べる", meaning: "吃", kind: "ichidan" }, "potential"), /たべられる/)
  assert.match(verbs.explainConjugation({ dict: "かく", kanji: "書く", meaning: "写", kind: "godan" }, "causative"), /かかせる/)
})

test("verb conjugation quiz forms stay on N5 until the course reaches N4", () => {
  const n5Ids = verbs.verbConjFormsForCourse().map((form) => form.id)
  assert.deepEqual(n5Ids, ["masu", "nai", "te", "ta"])
  assert.deepEqual(verbs.verbConjFormsForCourse("starter-45").map((form) => form.id), n5Ids)
  assert.ok(verbs.verbConjFormsForCourse("n4-core").some((form) => form.id === "potential"))
  assert.ok(verbs.verbConjFormsForCourse("n3-core").some((form) => form.id === "causative"))
  assert.equal(verbs.verbConjFormsForCourse(null, true), verbs.VERB_CONJ_FORMS)
})
