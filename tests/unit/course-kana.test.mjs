import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"
const { STARTER_LESSONS } = await loadTsModule("src/data/lessons.ts")
const { getCourseKanaIds, getUntestedCourseKanaIds, makeCourseKanaQuestion } = await loadTsModule("src/lib/course-kana.ts")
const { getKanaById } = await loadTsModule("src/lib/kana-id.ts")
const { createSeededRandom } = await loadTsModule("src/lib/seeded-random.ts")

test("every declared kana, including those with no original individual step, has recognition and listening questions", () => {
  const covered = new Set()
  const individual = new Set(STARTER_LESSONS.flatMap(l => l.steps.filter(s => s.itemType === "kana").map(s => s.itemId)))
  for (const lesson of STARTER_LESSONS) {
    const ids = getCourseKanaIds(lesson)
    assert.deepEqual(ids, [...new Set(lesson.newItemIds.filter(i => i.type === "kana").map(i => i.id))])
    for (const id of ids) {
      covered.add(id)
      const parsed = getKanaById(id)
      for (const direction of ["recognition", "listening"]) {
        const q = makeCourseKanaQuestion(id, direction, () => 0.4)
        assert.ok(q, id)
        assert.equal(q.itemId, id)
        assert.equal(q.mode, direction)
        assert.equal(q.correctAnswer, parsed.romaji)
        assert.equal(q.options.length, 4)
        assert.ok(q.questionVersion)
        if (direction === "listening") {
          assert.equal(q.questionText, undefined)
          assert.equal(q.questionAudio, parsed.kana[parsed.script])
          assert.equal(q.options.find(o => o.value === q.correctAnswer).display, parsed.kana[parsed.script])
        } else {
          assert.equal(q.questionText, parsed.kana[parsed.script])
          assert.equal(q.questionAudio, undefined)
        }
      }
    }
  }
  assert.equal([...covered].filter(id => !individual.has(id)).length, 39)
})

test("both scripts exclude equivalent isolated-audio spellings and preserve the target script", () => {
  const sound = value => ({ di: "ji", du: "zu", wo: "o" })[value] ?? value
  for (const script of ["hiragana", "katakana"]) for (const romaji of ["ji", "di", "zu", "du", "o", "wo"]) {
    for (let seed = 0; seed < 25; seed++) {
      const q = makeCourseKanaQuestion(`${script}:${romaji}`, "listening", createSeededRandom(`${seed}`))
      assert.equal(new Set(q.options.map(o => sound(o.value))).size, q.options.length)
      for (const option of q.options) assert.equal(option.display, getKanaById(`${script}:${option.value}`).kana[script])
    }
  }
})

test("reading and listening coverage stay separate; self-marked and old aggregate scores remain untested", () => {
  const ids = ["hiragana:a", "katakana:a", "hiragana:i"]
  const items = {
    "hiragana:a": { itemType: "kana", recognition: 100, attempts: 10 },
    "katakana:a": { itemType: "kana", assessmentEvidence: { recognition: { attempts: 1, correct: 0, score: 0 } } },
    "hiragana:i": { itemType: "kana", assessmentEvidence: { listening: { attempts: 1, correct: 1, score: 18 } } },
  }
  assert.deepEqual(getUntestedCourseKanaIds(ids, items, "recognition"), ["hiragana:a", "hiragana:i"])
  assert.deepEqual(getUntestedCourseKanaIds(ids, items, "listening"), ["hiragana:a", "katakana:a"])
})
