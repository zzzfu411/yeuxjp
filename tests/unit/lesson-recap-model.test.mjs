import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const recap = await loadTsModule("src/lib/lesson-recap-model.ts")
const coverage = await loadTsModule("src/lib/lesson-item-coverage.ts")
const lessons = await loadTsModule("src/data/lessons.ts")

test("lesson recap keeps vocabulary mastery copy and also counts kana", () => {
  const day1 = lessons.STARTER_LESSONS[0]
  const model = recap.buildLessonCompletionRecapModel(day1, () => false)
  const day1VocabId = day1.newItemIds.find((item) => item.type === "vocab")?.id

  assert.match(model.summary, /本课词汇掌握 0\/1/)
  assert.match(model.summary, /假名 0\/5/)
  assert.ok(model.highlights.includes("あ"))
  assert.ok(day1VocabId)
  assert.ok(model.vocabIds.includes(day1VocabId))
  assert.match(model.href, /\/vocabulary/)
  assert.match(model.cta, /用闪卡把本课词评成记住/)
})

test("lesson recap vocab labels prefer kanji and fall back to kana", () => {
  assert.ok(recap.lessonRecapVocabLabels([{ kana: "こんにちは", meaning: "你好" }]).includes("こんにちは"))
  assert.deepEqual(recap.lessonRecapVocabLabels([{ kanji: "大丈夫", kana: "だいじょうぶ" }]), ["大丈夫（だいじょうぶ）"])
  assert.deepEqual(
    recap.lessonRecapVocabWords([{ id: "sur-g-1", kana: "こんにちは", meaning: "你好" }]),
    [{ id: "sur-g-1", label: "こんにちは", meaning: "你好" }]
  )
})

test("lesson recap does not pin mixed-level vocabulary to the first word's flashcard level", () => {
  const day46 = lessons.STARTER_LESSONS.find((lesson) => lesson.id === "day-46-n4-tara")
  const model = recap.buildLessonCompletionRecapModel(day46, () => false)

  assert.equal(model.href, "/vocabulary")
  assert.ok(model.vocabIds.includes("day-gw-8"))
  assert.ok(model.vocabIds.includes("sur-v-1"))
})

test("lesson recap counts sentence-build steps because course data does not list sentence new items", () => {
  const day4 = lessons.STARTER_LESSONS.find((lesson) => lesson.id === "day-4-na-ha-ma-intro-sentence")
  const model = recap.buildLessonCompletionRecapModel(day4, () => false)

  assert.match(model.summary, /造句 1/)
  assert.match(model.summary, /本课词汇掌握/)
  assert.match(model.summary, /语法点 2/)
})

test("kana-only lessons recap to the kana page instead of pretending there are no new items", () => {
  const day21 = lessons.STARTER_LESSONS.find((lesson) => lesson.id === "day-21-kana-graduation")
  const mastered = new Set(day21.newItemIds.filter((item) => item.type === "kana").slice(0, 2).map((item) => item.id))
  const model = recap.buildLessonCompletionRecapModel(day21, () => false, (id) => mastered.has(id))

  assert.match(model.summary, /假名 2\//)
  assert.doesNotMatch(model.summary, /复习课没有新词/)
  assert.equal(model.href, "/kana")
})

test("course vocab coverage counts unique lesson vocabulary ids", () => {
  const count = coverage.countLessonItemIds(lessons.STARTER_LESSONS, "vocab")
  assert.ok(count > 50)
  assert.ok(count < 1066)
  const hello = coverage.getVocabLessonAppearances(lessons.STARTER_LESSONS, "sur-g-1")
  assert.ok(hello.some((item) => item.id === "day-1-a-row-hello"))
  assert.equal(hello[0].order, 1)
})
