import assert from "node:assert/strict"
import { loadTsModule } from "../tests/unit/load-ts-module.mjs"

const { COURSE_UNITS } = await loadTsModule("src/data/coursebook/index.ts")
const { STARTER_LESSONS } = await loadTsModule("src/data/lessons.ts")
const { STARTER_LESSONS: catalog } = await loadTsModule("src/data/lesson-catalog.ts")
assert.equal(COURSE_UNITS.length, 35)
assert.equal(STARTER_LESSONS.length, 175)
const unique = (values, label) => assert.equal(new Set(values).size, values.length, `${label}: duplicate content`)
unique(COURSE_UNITS.map(unit => unit.reading), "Unit readings")
unique(COURSE_UNITS.flatMap(unit => unit.focuses.map(focus => focus[1])), "Lesson explanations")
unique(COURSE_UNITS.flatMap(unit => unit.focuses.map(focus => focus[2])), "Production tasks")
const kanaReading = /^[\u3040-\u309f\u30a0-\u30ffー・\s]+$/u
for (const [index, unit] of COURSE_UNITS.entries()) {
  const label = `Unit ${index + 1}`
  assert.equal(unit.start, index * 5 + 1, label)
  assert.equal(unit.focuses.length, 5, label)
  assert.equal(unit.checks.length, 5, label)
  assert.ok(unit.scene.length > 20 && unit.translation.length > 30, label)
  assert.ok(unit.reading.length >= (unit.start > 135 ? 350 : unit.start > 90 ? 180 : unit.start > 45 ? 110 : 50), `${label}: reading too short`)
  assert.ok(unit.dialogue.length >= 4 && unit.words.length >= 6, label)
  assert.ok(!/[\uac00-\ud7af]|TODO|待补充|占位/i.test(JSON.stringify(unit)), `${label}: unexpected language or placeholder`)
  for (const line of unit.dialogue) assert.ok(line.length === 3 && line.every(value => value.trim().length > 0), `${label}: dialogue`)
  for (const [word, reading, meaning] of unit.words) assert.ok(word && meaning && kanaReading.test(reading), `${label}: word reading ${word}/${reading}`)
  for (const [goal, explanation, task, model] of unit.focuses) assert.ok(goal.length >= 8 && explanation.length >= 70 && task.length >= 10 && /[\u3040-\u30ff]/u.test(model), `${label}: incomplete lesson focus`)
  for (const [prompt, answer, distractorA, distractorB, rationale] of unit.checks) {
    unique([answer, distractorA, distractorB], `${label}: ${prompt}`)
    assert.ok(prompt.length > 5 && rationale.length >= 20, `${label}: question evidence`)
  }
}
let choices = 0, reading = 0, listening = 0
for (const lesson of STARTER_LESSONS) {
  const study = lesson.study
  assert.ok(study && study.goal && study.task && study.model, `${lesson.id}: study missing`)
  assert.ok(lesson.steps.some(step => step.type === "explain") && lesson.steps.some(step => step.type === "example"), `${lesson.id}: materials unreachable`)
  assert.equal(lesson.steps.at(-1).type, "summary")
  unique(lesson.steps.map(step => step.id), `${lesson.id}: step ids`)
  const comprehension = lesson.steps.filter(step => step.id.startsWith("coursebook-"))
  assert.equal(comprehension.length, 1)
  assert.equal(lesson.steps.at(-2).id, comprehension[0].id)
  for (const id of study.reviewLessonIds) assert.ok(STARTER_LESSONS.some(other => other.id === id && other.order < lesson.order))
  for (const step of lesson.steps.filter(step => step.type === "multipleChoice")) {
    choices++
    assert.ok(step.explanation?.length >= 20, `${lesson.id}/${step.id}: explanation missing`)
    unique(step.options, `${lesson.id}/${step.id}: options`)
    assert.equal(step.options.filter(option => option === step.answer).length, 1, `${lesson.id}/${step.id}: answer`)
  }
  const check = comprehension[0]
  if (check.mode === "listening") { listening++; assert.equal(check.audioText, study.reading); assert.equal(check.passage, undefined) }
  else { reading++; assert.equal(check.passage, study.reading) }
  const summary = catalog.find(item => item.id === lesson.id)
  assert.ok(summary && !("study" in summary) && !("steps" in summary), `${lesson.id}: full text leaked into catalog`)
  assert.equal(summary.practiceCount, lesson.steps.filter(step => "itemId" in step).length)
}
console.log(`Coursebook verified: ${COURSE_UNITS.length} original readings/dialogues; ${STARTER_LESSONS.length} lesson focuses and production tasks; ${reading} reading + ${listening} listening checks; ${choices} choices with explanations.`)
