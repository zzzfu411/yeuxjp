import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const session = await loadTsModule("src/lib/learning-session.ts")
const storeFacade = await loadTsModule("src/lib/learning-store.ts")
const storage = await loadTsModule("src/lib/storage-keys.ts")
const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

function listSourceFiles(dir) {
  const files = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const absPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...listSourceFiles(absPath))
      continue
    }
    if (/\.(ts|tsx)$/.test(entry.name)) files.push(absPath)
  }
  return files
}

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

test("correct practice only enrolls reviewable kana and vocabulary SRS items", () => {
  const store = installLocalStorage()
  const progress = { recordPractice: () => true }

  assert.equal(session.recordPracticeResult(progress, {
    itemId: "a",
    itemType: "kana",
    mode: "recognition",
    correct: true,
    answer: "a",
  }), true)
  assert.equal(session.recordPracticeResult(progress, {
    itemId: "sokuon:きって",
    itemType: "kana",
    mode: "audio",
    correct: true,
    answer: "きって",
  }), true)
  assert.equal(session.recordPracticeResult(progress, {
    itemId: "sur-g-1",
    itemType: "vocab",
    mode: "meaning",
    correct: true,
    answer: "sur-g-1",
  }), true)
  assert.equal(session.recordPracticeResult(progress, {
    itemId: "sur-g-999",
    itemType: "vocab",
    mode: "meaning",
    correct: true,
    answer: "sur-g-999",
  }), true)

  const kanaSrs = JSON.parse(store.get(storage.STORAGE_KEYS.SRS_KANA))
  const vocabSrs = JSON.parse(store.get(storage.STORAGE_KEYS.SRS_VOCAB))
  assert.ok(kanaSrs.a)
  assert.equal(kanaSrs["sokuon:きって"], undefined)
  assert.ok(vocabSrs["sur-g-1"])
  assert.equal(vocabSrs["sur-g-999"], undefined)
})

test("review enrollment predicate matches actual SRS eligibility", () => {
  assert.equal(session.canEnrollReviewItem("kana", "a"), true)
  assert.equal(session.canEnrollReviewItem("kana", "sokuon:きって"), false)
  assert.equal(session.canEnrollReviewItem("vocab", "sur-g-1"), true)
  assert.equal(session.canEnrollReviewItem("vocab", "sur-g-999"), false)
  assert.equal(session.canEnrollReviewItem("grammar", "n5-wa"), false)
  assert.equal(session.canEnrollReviewItem("sentence", "sentence-intro-student"), false)
})

test("wrong practice records progress but does not enroll SRS", () => {
  const store = installLocalStorage()
  const recorded = []
  const progress = {
    recordPractice: (result) => {
      recorded.push(result)
      return true
    },
  }

  assert.equal(session.recordPracticeResult(progress, {
    itemId: "ka",
    itemType: "kana",
    mode: "recognition",
    correct: false,
    answer: "a",
  }), true)

  assert.equal(recorded.length, 1)
  assert.equal(store.get(storage.STORAGE_KEYS.SRS_KANA), undefined)
})

test("failed practice writes do not enroll SRS", () => {
  const store = installLocalStorage()
  const progress = { recordPractice: () => false }

  assert.equal(session.recordPracticeResult(progress, {
    itemId: "a",
    itemType: "kana",
    mode: "recognition",
    correct: true,
    answer: "a",
  }), false)

  assert.equal(store.get(storage.STORAGE_KEYS.SRS_KANA), undefined)
})

test("recordQuestionPractice returns false when progress recording fails before mistakes are written", () => {
  installLocalStorage()
  let mistakeRecorded = false
  const progress = { recordPractice: () => false }
  const notebook = {
    recordWrong: () => {
      mistakeRecorded = true
      return true
    },
  }

  const ok = session.recordQuestionPractice({
    progress,
    notebook,
    result: {
      question: {
        type: "kana",
        itemId: "a",
        itemType: "kana",
        mode: "recognition",
        correctAnswer: "a",
        options: [{ value: "a", display: "a" }],
      },
      selectedAnswer: "ka",
      correct: false,
      answeredAt: 123,
    },
  })

  assert.equal(ok, false)
  assert.equal(mistakeRecorded, false)
})

test("recordQuestionPractice refuses progress-backed questions without progress metadata", () => {
  installLocalStorage()
  let practiceRecorded = false
  let mistakeRecorded = false
  const progress = {
    recordPractice: () => {
      practiceRecorded = true
      return true
    },
  }
  const notebook = {
    recordWrong: () => {
      mistakeRecorded = true
      return true
    },
  }

  const ok = session.recordQuestionPractice({
    progress,
    notebook,
    result: {
      question: {
        type: "custom-quiz",
        questionText: "prompt",
        correctAnswer: "right",
        options: [{ value: "right", display: "right" }],
      },
      selectedAnswer: "wrong",
      correct: false,
      answeredAt: 123,
    },
  })

  assert.equal(ok, false)
  assert.equal(practiceRecorded, false)
  assert.equal(mistakeRecorded, false)
})

test("recordQuestionPractice keeps legacy mistake review questions compatible without progress metadata", () => {
  installLocalStorage()
  let practiceRecorded = false
  let mistakeRecorded = false
  const progress = {
    recordPractice: () => {
      practiceRecorded = true
      return false
    },
  }
  const notebook = {
    recordWrong: () => {
      mistakeRecorded = true
      return true
    },
  }

  const ok = session.recordQuestionPractice({
    progress,
    notebook,
    result: {
      question: {
        type: "legacy-mistake",
        mistakeId: "legacy",
        questionText: "prompt",
        correctAnswer: "right",
        options: [{ value: "right", display: "right" }],
      },
      selectedAnswer: "wrong",
      correct: false,
      answeredAt: 123,
    },
  })

  assert.equal(ok, true)
  assert.equal(practiceRecorded, false)
  assert.equal(mistakeRecorded, true)
})

test("recordQuestionPractice rolls back managed storage when a later notebook write fails", () => {
  const store = installLocalStorage()
  store.set(storage.STORAGE_KEYS.PRACTICE_RESULTS, "[]")
  const progress = {
    recordPractice: () => {
      storeFacade.writeManagedLearningStorage(storage.STORAGE_KEYS.PRACTICE_RESULTS, "[{\"itemId\":\"a\"}]")
      return true
    },
  }
  const notebook = { recordWrong: () => false }

  const ok = session.recordQuestionPractice({
    progress,
    notebook,
    result: {
      question: {
        type: "kana",
        itemId: "a",
        itemType: "kana",
        mode: "recognition",
        correctAnswer: "a",
        options: [{ value: "a", display: "a" }],
      },
      selectedAnswer: "ka",
      correct: false,
      answeredAt: 123,
    },
  })

  assert.equal(ok, false)
  assert.equal(store.get(storage.STORAGE_KEYS.PRACTICE_RESULTS), "[]")
})

test("recordQuestionPractice public entrypoint is wrapped in a managed storage transaction", () => {
  const source = read("src/lib/learning-session.ts")

  assert.match(source, /runLearningStorageTransaction/)
  assert.match(source, /function recordPracticeResultWithoutTransaction\(/)
  assert.match(source, /export function canEnrollReviewItem\(/)
  assert.match(source, /export function isRecordableQuestion\(/)
  assert.match(source, /export function recordPracticeResult\(/)
  assert.match(source, /return runLearningStorageTransaction\(\(\) => recordPracticeResultWithoutTransaction\(progress, result\)\)/)
  assert.match(source, /export function recordQuestionPractice\(/)
  assert.match(source, /return runLearningStorageTransaction\(\(\) => recordQuestionPracticeWithoutTransaction\(\{/)
  assert.match(source, /export function recordQuestionPracticeWithoutTransaction\(/)
  assert.match(source, /recordPracticeResultWithoutTransaction\(progress, \{/)
})

test("recordQuestionPracticeWithoutTransaction stays limited to explicit transaction callers", () => {
  const allowedImporters = new Set([
    path.normalize(path.join(root, "src", "components", "review", "use-review-answer-recorder.ts")),
    path.normalize(path.join(root, "src", "lib", "review-answer-recording.ts")),
  ])
  const unsafeImport = /import\s+\{[^}]*\brecordQuestionPracticeWithoutTransaction\b[^}]*\}\s+from\s+["']@\/lib\/learning-session["']/m

  for (const absPath of listSourceFiles(path.join(root, "src"))) {
    const normalized = path.normalize(absPath)
    const source = fs.readFileSync(absPath, "utf8")
    if (!unsafeImport.test(source)) continue
    assert.ok(
      allowedImporters.has(normalized),
      `${path.relative(root, absPath)} should call recordQuestionPractice instead of the non-transaction helper`
    )
  }

  const reviewRecorder = read("src/components/review/use-review-answer-recorder.ts")
  const reviewRecording = read("src/lib/review-answer-recording.ts")
  assert.match(reviewRecorder, /recordReviewQuestionPractice\(\{/)
  assert.match(reviewRecording, /runLearningStorageTransaction\(\(\) => \{/)
  assert.match(reviewRecording, /recordQuestionPracticeWithoutTransaction\(\{/)
})
