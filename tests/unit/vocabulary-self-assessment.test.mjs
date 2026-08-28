import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const assessment = await loadTsModule("src/lib/vocabulary-self-assessment.ts")
const storeFacade = await loadTsModule("src/lib/learning-store.ts")
const { STORAGE_KEYS } = await loadTsModule("src/lib/storage-keys.ts")

function installLocalStorage() {
  const store = new Map()
  globalThis.window = {
    localStorage: {
      getItem: (key) => store.get(key) ?? null,
      setItem: (key, value) => store.set(key, String(value)),
      removeItem: (key) => store.delete(key),
    },
    dispatchEvent: () => {},
  }
  globalThis.CustomEvent = class CustomEvent extends Event {
    constructor(type, init = {}) {
      super(type)
      this.detail = init.detail
    }
  }
  return store
}

test("vocabulary self-assessment options have distinct practice and SRS semantics", () => {
  assert.deepEqual(
    assessment.VOCABULARY_SELF_ASSESSMENT_OPTIONS.map(({ id, correct, srsResult }) => ({ id, correct, srsResult })),
    [
      { id: "again", correct: false, srsResult: "again" },
      { id: "hard", correct: false, srsResult: "hard" },
      { id: "good", correct: true, srsResult: "good" },
    ]
  )
})

test("hard vocabulary self-assessment records meaning practice and a short SRS interval", () => {
  const store = installLocalStorage()
  const recorded = []
  const now = 1_700_000_000_000
  const originalDateNow = Date.now
  Date.now = () => now
  try {
    const saved = assessment.recordVocabularySelfAssessment({
      progress: {
        recordPractice: (result) => {
          recorded.push(result)
          return true
        },
      },
      itemId: "sur-g-1",
      rating: "hard",
    })

    assert.equal(saved, true)
    assert.deepEqual(recorded, [{
      itemId: "sur-g-1",
      itemType: "vocab",
      mode: "meaning",
      correct: false,
      answer: "hard",
    }])
    const srs = JSON.parse(store.get(STORAGE_KEYS.SRS_VOCAB))
    assert.equal(srs["sur-g-1"].box, 1)
    assert.equal(srs["sur-g-1"].dueAt, now + 10 * 60 * 1000)
    assert.equal(srs["sur-g-1"].lastReviewedAt, now)
    assert.equal(srs["sur-g-1"].right, 0)
    assert.equal(srs["sur-g-1"].wrong, 0)
  } finally {
    Date.now = originalDateNow
  }
})

test("good and again vocabulary ratings create different review schedules", () => {
  const now = 1_700_000_000_000
  const originalDateNow = Date.now
  Date.now = () => now
  try {
    const goodStore = installLocalStorage()
    assert.equal(assessment.recordVocabularySelfAssessment({
      progress: { recordPractice: () => true },
      itemId: "sur-g-1",
      rating: "good",
    }), true)
    const good = JSON.parse(goodStore.get(STORAGE_KEYS.SRS_VOCAB))["sur-g-1"]
    assert.equal(good.box, 2)
    assert.equal(good.dueAt, now + 24 * 60 * 60 * 1000)
    assert.equal(good.right, 1)

    const againStore = installLocalStorage()
    assert.equal(assessment.recordVocabularySelfAssessment({
      progress: { recordPractice: () => true },
      itemId: "sur-g-1",
      rating: "again",
    }), true)
    const again = JSON.parse(againStore.get(STORAGE_KEYS.SRS_VOCAB))["sur-g-1"]
    assert.equal(again.box, 0)
    assert.equal(again.dueAt, now)
    assert.equal(again.wrong, 1)
  } finally {
    Date.now = originalDateNow
  }
})

test("self-assessment rolls practice writes back when SRS persistence fails", () => {
  const store = installLocalStorage()
  store.set(STORAGE_KEYS.PRACTICE_RESULTS, "[]")
  store.set(STORAGE_KEYS.SRS_VOCAB, "{broken")

  const saved = assessment.recordVocabularySelfAssessment({
    progress: {
      recordPractice: () => {
        storeFacade.writeManagedLearningStorage(STORAGE_KEYS.PRACTICE_RESULTS, '[{"itemId":"sur-g-1"}]')
        return true
      },
    },
    itemId: "sur-g-1",
    rating: "good",
  })

  assert.equal(saved, false)
  assert.equal(store.get(STORAGE_KEYS.PRACTICE_RESULTS), "[]")
  assert.equal(store.get(STORAGE_KEYS.SRS_VOCAB), "{broken")
})

test("self-assessment rejects unknown vocabulary ids before recording", () => {
  installLocalStorage()
  let called = false
  assert.equal(assessment.recordVocabularySelfAssessment({
    progress: {
      recordPractice: () => {
        called = true
        return true
      },
    },
    itemId: "missing-vocab",
    rating: "good",
  }), false)
  assert.equal(called, false)
})
