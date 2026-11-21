import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"
const { STAGE_WRITING_TASKS, stageWritingTask } = await loadTsModule("src/data/stage-writing-tasks.ts")
const { COURSE_UNITS } = await loadTsModule("src/data/coursebook/index.ts")
const { COURSE_PHASES } = await loadTsModule("src/lib/course-phases.ts")
const { writingVersion, makeWrittenWork } = await loadTsModule("src/lib/written-work-model.ts")
test("every phase has independent transfer material, a task-specific rubric and versioned source context", () => {
  assert.deepEqual(STAGE_WRITING_TASKS.map(task => task.phase), COURSE_PHASES.map(phase => phase.id))
  for (const stage of STAGE_WRITING_TASKS) {
    assert.ok(stage.passage.length > 120)
    assert.equal(COURSE_UNITS.some(unit => unit.reading.includes(stage.passage) || stage.passage.includes(unit.reading)), false)
    assert.ok(stage.words.every(([word, reading, meaning]) => stage.passage.includes(word) && reading && meaning))
    const task = stageWritingTask(stage)
    assert.ok(task.prompt.includes(stage.passage))
    assert.equal(task.criteria.length, 4)
    assert.notEqual(writingVersion(task), writingVersion(stageWritingTask({ ...stage, passage: `${stage.passage}改訂。` })))
    assert.notEqual(writingVersion(task), writingVersion(stageWritingTask({ ...stage, task: "Different output requirements" })))
    assert.equal(makeWrittenWork(task, { draft: "", checked: [0, 1, 2, 3], usedModel: false }, true, 10), null)
  }
})
