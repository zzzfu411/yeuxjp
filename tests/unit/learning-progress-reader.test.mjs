import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"
import { createElement } from "react"
import { renderToString } from "react-dom/server"
import ts from "typescript"
import { loadTsModule } from "./load-ts-module.mjs"

const reader = await loadTsModule("src/lib/learning-progress-reader.ts")
const practice = await loadTsModule("src/lib/learning-progress-practice.ts")
const full = await loadTsModule("src/lib/learning-progress.ts")
const { runLearningStorageTransaction } = await loadTsModule("src/lib/learning-storage-transaction.ts")
const { STORAGE_KEYS } = await loadTsModule("src/lib/storage-keys.ts")
const { LEARNING_EVENT } = await loadTsModule("src/lib/learning-storage.ts")
const { LEARNING_STORE_EVENT } = await loadTsModule("src/lib/learning-events.ts")
const root = path.resolve(import.meta.dirname, "..", "..")

function installWindow({ failKey } = {}) {
  const previous = global.window
  const map = new Map()
  const target = new EventTarget()
  let reads = 0
  target.localStorage = {
    getItem(key) { reads++; return map.get(key) ?? null },
    setItem(key, value) {
      if (key === failKey) throw new DOMException("Storage full", "QuotaExceededError")
      map.set(key, String(value))
    },
    removeItem(key) { map.delete(key) },
  }
  global.window = target
  return { map, target, get reads() { return reads }, restore() { global.window = previous } }
}

function renderHook(useProgress) {
  let value
  function Harness() { value = useProgress(); return null }
  renderToString(createElement(Harness))
  return value
}

function storageEvent(key) {
  const event = new Event("storage")
  Object.defineProperty(event, "key", { value: key })
  return event
}

test("all three progress APIs keep empty hydration state without reading storage during render", () => {
  const env = installWindow()
  try {
    const snapshotKeys = ["lessons", "items", "results", "loaded", "completedLessonIds", "streak", "studyCalendar", "currentLocalDay"]
    const lessonActions = ["startLesson", "completeLesson", "restartLesson", "resumeLessonUpdates", "saveLessonPosition", "saveLessonStepAnswer", "revealLessonHint"]
    for (const [useProgress, actions] of [
      [reader.useLearningProgressSnapshot, []],
      [practice.useLearningPractice, ["recordPractice"]],
      [full.useLearningProgress, ["recordPractice", ...lessonActions]],
    ]) {
      const value = renderHook(useProgress)
      assert.deepEqual(Object.keys(value).sort(), [...snapshotKeys, ...actions].sort())
      assert.deepEqual(value.lessons, {})
      assert.deepEqual(value.items, {})
      assert.deepEqual(value.results, [])
      assert.equal(value.loaded, false)
      assert.equal(value.completedLessonIds.size, 0)
      assert.equal(value.streak, 0)
      assert.deepEqual(value.studyCalendar, {})
      assert.ok(value.currentLocalDay instanceof Date)
      for (const action of actions) assert.equal(typeof value[action], "function")
    }
    assert.equal(env.reads, 0)
  } finally { env.restore() }
})

test("shared subscription defers initial load, filters updates, and fully cleans up", async () => {
  const env = installWindow()
  let unsubscribe
  try {
    let calls = 0
    unsubscribe = reader.subscribeLearningProgress(() => { calls++ })
    assert.equal(calls, 0)
    await Promise.resolve()
    assert.equal(calls, 1)
    env.target.dispatchEvent(storageEvent(STORAGE_KEYS.USER_PROFILE))
    env.target.dispatchEvent(storageEvent(null))
    env.target.dispatchEvent(new CustomEvent(LEARNING_EVENT, { detail: { key: STORAGE_KEYS.USER_PROFILE } }))
    env.target.dispatchEvent(new CustomEvent(LEARNING_STORE_EVENT, { detail: { keys: [STORAGE_KEYS.SRS_VOCAB] } }))
    assert.equal(calls, 1)
    env.target.dispatchEvent(storageEvent(STORAGE_KEYS.ITEM_PROGRESS))
    env.target.dispatchEvent(new CustomEvent(LEARNING_EVENT, { detail: { key: STORAGE_KEYS.PRACTICE_RESULTS } }))
    env.target.dispatchEvent(new CustomEvent(LEARNING_STORE_EVENT, { detail: { keys: [STORAGE_KEYS.USER_PROFILE, STORAGE_KEYS.STUDY_CALENDAR] } }))
    assert.equal(calls, 4)
    unsubscribe()
    env.target.dispatchEvent(storageEvent(STORAGE_KEYS.LESSON_PROGRESS))
    env.target.dispatchEvent(new CustomEvent(LEARNING_EVENT, { detail: { key: STORAGE_KEYS.ITEM_PROGRESS } }))
    env.target.dispatchEvent(new CustomEvent(LEARNING_STORE_EVENT, { detail: { keys: [STORAGE_KEYS.STUDY_CALENDAR] } }))
    assert.equal(calls, 4)
  } finally { unsubscribe?.(); env.restore() }
})

test("unmount before the initial microtask prevents a stale load; remount gets exactly one load", async () => {
  const env = installWindow()
  let unsubscribe
  try {
    let calls = 0
    const cancel = reader.subscribeLearningProgress(() => { calls++ })
    cancel()
    await Promise.resolve()
    assert.equal(calls, 0)
    unsubscribe = reader.subscribeLearningProgress(() => { calls++ })
    await Promise.resolve()
    assert.equal(calls, 1)
    env.target.dispatchEvent(storageEvent(STORAGE_KEYS.LESSON_PROGRESS))
    assert.equal(calls, 2)
  } finally { unsubscribe?.(); env.restore() }
})

test("practice and full APIs keep cross-key writes atomic and publish only final snapshots", async () => {
  for (const useProgress of [practice.useLearningPractice, full.useLearningProgress]) {
    for (const fail of [false, true]) {
      const env = installWindow({ failKey: fail ? STORAGE_KEYS.ITEM_PROGRESS : undefined })
      let unsubscribe
      try {
        const api = renderHook(useProgress)
        const snapshots = []
        const keys = [STORAGE_KEYS.PRACTICE_RESULTS, STORAGE_KEYS.ITEM_PROGRESS, STORAGE_KEYS.STUDY_CALENDAR]
        unsubscribe = reader.subscribeLearningProgress(() => snapshots.push(keys.map(key => env.map.has(key))))
        await Promise.resolve()
        snapshots.length = 0
        assert.equal(api.recordPractice({ itemId: "hiragana:a", itemType: "kana", mode: "recognition", correct: true }), !fail)
        assert.ok(snapshots.length > 0)
        assert.ok(snapshots.every(row => row.every(present => present === !fail)))
        if (fail) assert.equal(env.map.size, 0)
        else {
          assert.equal(JSON.parse(env.map.get(STORAGE_KEYS.PRACTICE_RESULTS)).length, 1)
          assert.equal(api.recordPractice({ itemId: "hiragana:a", itemType: "kana", mode: "recognition", correct: false }), true)
          assert.equal(JSON.parse(env.map.get(STORAGE_KEYS.PRACTICE_RESULTS)).length, 2)
        }
      } finally { unsubscribe?.(); env.restore() }
    }
  }
})

test("the legacy lesson answer API still defers notifications and rolls back inside an outer transaction", async () => {
  const env = installWindow()
  let unsubscribe
  try {
    const api = renderHook(full.useLearningProgress)
    assert.equal(api.startLesson("lesson-test"), true)
    const before = env.map.get(STORAGE_KEYS.LESSON_PROGRESS)
    const snapshots = []
    unsubscribe = reader.subscribeLearningProgress(() => snapshots.push(env.map.get(STORAGE_KEYS.LESSON_PROGRESS)))
    await Promise.resolve()
    snapshots.length = 0
    assert.equal(runLearningStorageTransaction(() => {
      assert.equal(api.saveLessonStepAnswer("lesson-test", "step-test", { answer: "a", correct: true, createdAt: 1 }), true)
      assert.equal(snapshots.length, 0)
      return false
    }), false)
    assert.equal(env.map.get(STORAGE_KEYS.LESSON_PROGRESS), before)
    assert.ok(snapshots.length > 0)
    assert.ok(snapshots.every(value => value === before))
  } finally { unsubscribe?.(); env.restore() }
})

function runtimeDependencies(sourcePath) {
  const source = fs.readFileSync(path.join(root, sourcePath), "utf8")
  const emitted = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.Preserve }, fileName: sourcePath,
  }).outputText
  const ast = ts.createSourceFile(sourcePath, emitted, ts.ScriptTarget.Latest, true)
  const dependencies = []
  for (const node of ast.statements) {
    if ((!ts.isImportDeclaration(node) && !ts.isExportDeclaration(node)) || !node.moduleSpecifier || !ts.isStringLiteral(node.moduleSpecifier)) continue
    const specifier = node.moduleSpecifier.text
    const stem = specifier.startsWith("@/") ? `src/${specifier.slice(2)}` : specifier.startsWith(".") ? path.join(path.dirname(sourcePath), specifier) : null
    if (!stem) continue
    const resolved = [stem, `${stem}.ts`, `${stem}.tsx`, `${stem}/index.ts`, `${stem}/index.tsx`]
      .find(file => fs.existsSync(path.join(root, file)) && fs.statSync(path.join(root, file)).isFile())
    assert.ok(resolved, `resolve ${specifier} from ${sourcePath}`)
    if (/\.[jt]sx?$/.test(resolved)) dependencies.push(resolved.replaceAll("\\", "/"))
  }
  return dependencies
}

test("home and practice-only progress exclude lesson editing and legacy question compatibility", () => {
  const visited = new Set()
  const pending = ["src/components/home/home-page.tsx", "src/lib/learning-progress-practice.ts"]
  const forbidden = ["learning-progress.ts", "learning-store.ts", "learning-backup.ts", "lesson-attempt.ts", "lesson-content-version.ts", "legacy-question-versions.ts"]
  while (pending.length) {
    const sourcePath = pending.pop()
    if (visited.has(sourcePath)) continue
    visited.add(sourcePath)
    assert.ok(!forbidden.includes(path.basename(sourcePath)), `unexpected runtime dependency: ${sourcePath}`)
    pending.push(...runtimeDependencies(sourcePath))
  }
  assert.ok(visited.has("src/lib/learning-progress-reader.ts"))
  assert.ok(visited.has("src/lib/learning-progress-practice.ts"))
  assert.ok(visited.has("src/lib/learning-storage-transaction.ts"))
})
