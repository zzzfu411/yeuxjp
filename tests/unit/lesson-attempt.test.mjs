import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"
const attempt = await loadTsModule("src/lib/lesson-attempt.ts")
const session = await loadTsModule("src/lib/lesson-session.ts")
const model = await loadTsModule("src/lib/learning-progress-model.ts")

test("restarting keeps the original completion and score while clearing this attempt", () => {
  const previous = {lessonId:"a",status:"completed",startedAt:10,completedAt:20,score:67,stepAnswers:{q:{correct:false,createdAt:11}},hintedStepIds:["q"]}
  const next = attempt.restartLessonAttempt(previous,"second",30)
  assert.equal(next.status,"completed")
  assert.equal(next.score,67)
  assert.equal(next.completedAt,20)
  assert.deepEqual(next.stepAnswers,{})
  assert.deepEqual(next.hintedStepIds,[])
  assert.equal(attempt.isLessonAttemptComplete(next),false)
  assert.equal(session.resolveLessonResumeStepIndex(next,[{id:"q"},{id:"end"}]),0)
  const finished = attempt.finishLessonAttempt("a",next,100,40)
  assert.equal(finished.score,67)
  assert.equal(finished.completedAt,20)
  assert.equal(finished.attemptScore,100)
  assert.equal(attempt.isLessonAttemptComplete(finished),true)
  const restored = model.normalizeLessonProgressMap({a:finished}).a
  assert.equal(restored.attemptId,"second")
  assert.equal(restored.attemptScore,100)
  assert.equal(restored.score,67)
  assert.equal(restored.completedAt,20)
})

test("previous attempts cannot restore answers into a fresh lesson run", () => {
  const steps=[{id:"q",itemId:"sur-g-1"}]
  const results=[{lessonId:"a",lessonStepId:"q",correct:true,createdAt:10},{lessonId:"a",lessonStepId:"q",lessonAttemptId:"second",correct:false,createdAt:20}]
  assert.equal(session.getLatestLessonStepAnswers("a",steps,results).q.correct,true)
  assert.equal(session.getLatestLessonStepAnswers("a",steps,results,"second").q.correct,false)
  assert.deepEqual(session.getLatestLessonStepAnswers("a",steps,results,"third"),{})
})

test("assisted answers are retained but do not improve independent mastery or score", () => {
  const result={itemId:"sur-g-1",itemType:"vocab",mode:"recall",correct:true,assisted:true,createdAt:10}
  const items=model.updateItemProgressForPractice({},result)
  assert.equal(items["sur-g-1"].recall,0)
  assert.equal(items["sur-g-1"].attempts,1)
  assert.equal(model.normalizePracticeResults([result])[0].assisted,true)
  assert.deepEqual(session.getLessonAnsweredFromStepMap({q:{correct:true,assisted:true,createdAt:10}}),{q:false})
})
