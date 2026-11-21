import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const { STARTER_LESSONS } = await loadTsModule("src/data/lessons.ts")
const { grammarData } = await loadTsModule("src/data/grammar-data.ts")
const { pragmaticsData } = await loadTsModule("src/data/pragmatics-data.ts")
const { lessonWritingTask } = await loadTsModule("src/lib/writing-tasks.ts")
const { getGoalPracticePlan, getAllGoalPracticeTasks } = await loadTsModule("src/lib/goal-practice.ts")
const { makeWrittenWork, normalizeWrittenWorks, writingKey } = await loadTsModule("src/lib/written-work-model.ts")

test("te-iru reference covers ongoing action, resulting state and repeated habit at both stages", () => {
  for (const level of ["N5", "N4"]) {
    const point = grammarData[level].find(item => item.id === `${level.toLowerCase()}-te-iru`)
    assert.ok(point.examples.some(example => example.japanese.includes("今、")))
    assert.ok(point.examples.some(example => example.japanese.includes("窓が開いています")))
    assert.ok(point.examples.some(example => /毎(日|週).*ています/.test(example.japanese)))
    assert.match(point.plainExplanation, /习惯/)
    assert.equal(point.pitfalls.some(text => /正在学才用|习惯动作仍用/.test(text)), false)
  }
})

test("the D91 introduction no longer contradicts the valid negative-purpose answers in D92", () => {
  const first = STARTER_LESSONS[90]
  const introduction = first.steps.find(step => step.type === "explain")
  assert.equal(introduction.bullets.some(text => text.includes("才用") || text.includes("明天改用")), false)
  assert.ok(introduction.bullets.some(text => text.includes("否定目的有时两者都成立")))
  const purpose = first.steps.find(step => step.id === "d91-mc-form")
  assert.match(purpose.prompt, /为了通过考试/)
  assert.equal(purpose.answer, "するために")
  const negative = STARTER_LESSONS[91].steps.find(step => step.id === "d92-mc-nai")
  assert.deepEqual([negative.answer, ...negative.acceptedAnswers].sort(), ["ために", "ように"])
})

test("lesson rubrics match phonetics, interaction, explanation and argument without certifying old work against new checks", () => {
  const [kana, basic, intermediate, advanced] = [1, 46, 91, 136].map(order => {
    const lesson = STARTER_LESSONS[order - 1]
    return lessonWritingTask(lesson.id, lesson.study)
  })
  assert.match(kana.criteria.join(" "), /拍数/)
  assert.doesNotMatch(kana.criteria.join(" "), /论点|确定程度/)
  assert.match(basic.criteria.join(" "), /礼貌程度/)
  assert.match(intermediate.criteria.join(" "), /事实和自己的推测/)
  assert.match(advanced.criteria.join(" "), /依据|确定程度/)
  const lesson = STARTER_LESSONS[90]
  const legacyTask = { id: `lesson:${lesson.id}`, title: `${lesson.study.unitTitle} · ${lesson.study.goal}`, prompt: lesson.study.task,
    criteria: [`我完成了本课目标：${lesson.study.goal}`, "我逐项核对了任务要求，信息和条件没有遗漏。", "我检查了本课句型、时态及对听者的语气，并记录仍不确定之处。"] }
  const oldWork = makeWrittenWork(legacyTask, { draft: "入口を見つけやすくするために、地図を付けます。", checked: [0, 1, 2], usedModel: false }, true, 100)
  const currentTask = lessonWritingTask(lesson.id, lesson.study)
  const newWork = makeWrittenWork(currentTask, { draft: "考え直した案を書きます。", checked: [], usedModel: false }, false, 200)
  assert.notEqual(writingKey(legacyTask), writingKey(currentTask))
  const saved = normalizeWrittenWorks({ [writingKey(legacyTask)]: oldWork, [writingKey(currentTask)]: newWork })
  assert.equal(Object.keys(saved).length, 2)
  assert.equal(saved[writingKey(legacyTask)].completedAt, 100)
  assert.equal(saved[writingKey(currentTask)].completedAt, undefined)
})

test("each media stage offers unique original dialogue tasks with available references and stage override leaves the profile unchanged", () => {
  const all = getAllGoalPracticeTasks()
  const ids = new Set()
  const scenes = new Set()
  const profile = { goal: "media", selfAssessedLevel: "N4" }
  for (const level of ["N5", "N4", "N3", "N2"]) {
    const plan = getGoalPracticePlan(profile, level)
    assert.equal(plan.tasks.length, 3)
    assert.match(plan.label, new RegExp(level))
    for (const task of plan.tasks) {
      assert.ok(task.instruction.includes("任务："))
      assert.match(task.instruction, /「[^」]*[ぁ-ん][^」]*」/)
      assert.ok(task.selfCheck.length >= 30)
      assert.ok(all.some(item => item.id === task.id))
      ids.add(task.id)
      scenes.add(task.instruction)
      for (const resource of task.resources) {
        const url = new URL(resource.href, "http://localhost")
        if (url.pathname === "/grammar") assert.ok(grammarData[url.searchParams.get("level")]?.some(point => point.id === url.searchParams.get("item")), resource.href)
        else assert.ok(pragmaticsData.some(item => `/pragmatics/${item.id}` === url.pathname), resource.href)
      }
    }
  }
  assert.equal(ids.size, 12)
  assert.equal(scenes.size, 12)
  assert.deepEqual(profile, { goal: "media", selfAssessedLevel: "N4" })
  assert.match(getGoalPracticePlan(profile).label, /N4/)
  assert.match(getGoalPracticePlan({ goal: "media", selfAssessedLevel: "unknown" }).label, /N5/)
  assert.deepEqual(getGoalPracticePlan({ goal: "media" }).tasks.map(task => task.id), ["media-address", "media-tone", "media-implication"])
  assert.equal(all.length, new Set(all.map(task => task.id)).size)
})

test("advanced reading alternatives stay in the same topic and distinguish mentioned from unmentioned evidence", () => {
  const question = STARTER_LESSONS[138].steps.find(step => step.id.startsWith("coursebook-"))
  assert.equal(question.answer, "分类设施的维护费用")
  assert.match(question.explanation, /原文未列为指标/)
  assert.equal(question.options.some(option => option.includes("制服")), false)
  assert.ok(question.options.includes("居民负担"))
  assert.ok(question.options.includes("非法倾倒情况"))
})
