import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const { getLessonPresentation, isComposingAnswer } = await loadTsModule("src/lib/lesson-presentation.ts")
const { STARTER_LESSONS } = await loadTsModule("src/data/lessons.ts")
const { normalizeAnswer } = await loadTsModule("src/lib/questions.ts")

test("course option order is reproducible and does not preserve the first-answer bias", () => {
  const histogram = [0, 0, 0, 0]
  for (const lesson of STARTER_LESSONS) {
    for (const step of lesson.steps.filter(s => s.type === "multipleChoice")) {
      const seed = `${lesson.id}:100`
      const view = getLessonPresentation(step, seed)
      assert.deepEqual(view, getLessonPresentation(step, seed))
      assert.deepEqual([...view.options].sort(), [...step.options].sort())
      histogram[view.options.indexOf(step.answer)]++
    }
  }
  assert.ok(histogram.every(n => n > 100 && n < 300), JSON.stringify(histogram))
  const step = STARTER_LESSONS[0].steps.find(s => s.type === "multipleChoice")
  assert.ok(new Set(Array.from({length: 20}, (_,i) => JSON.stringify(getLessonPresentation(step, String(i)).options))).size > 3)
})

test("sentence tiles retain duplicate identities without revealing the complete answer", () => {
  for (const lesson of STARTER_LESSONS) {
    for (const step of lesson.steps.filter(s => s.type === "sentenceBuild")) {
      const {chunks} = getLessonPresentation(step, "attempt")
      assert.deepEqual(chunks.map(x => x.idx).sort((a,b) => a-b), step.chunks.map((_,i) => i))
      assert.deepEqual(chunks.map(x => x.chunk).sort(), [...step.chunks].sort())
      if (new Set(step.chunks).size > 1) assert.notEqual(normalizeAnswer(chunks.map(x => x.chunk).join("")), normalizeAnswer(step.answer), step.id)
    }
  }
})

test("IME composition is distinguished from ordinary answer confirmation", () => {
  assert.equal(isComposingAnswer({isComposing:true}), true)
  assert.equal(isComposingAnswer({isComposing:false,keyCode:229}), true)
  assert.equal(isComposingAnswer({isComposing:false,keyCode:13}), false)
})
