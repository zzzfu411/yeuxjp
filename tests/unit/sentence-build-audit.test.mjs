import assert from "node:assert/strict"
import fs from "node:fs"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const audit = JSON.parse(fs.readFileSync(new URL("./sentence-build-audit-2026-09-10.json", import.meta.url), "utf8"))
const { STARTER_LESSONS } = await loadTsModule("src/data/lessons.ts")
const { getLessonStepVersion, getLessonStepVersions } = await loadTsModule("src/lib/lesson-content-fingerprint.ts")
const { lessonStepToQuestion } = await loadTsModule("src/lib/lesson-session.ts")
const { normalizeAnswer, isQuestionAnswerCorrect, makeQuestionResult, questionToMistakeInput } = await loadTsModule("src/lib/questions.ts")
const { getLessonPresentation } = await loadTsModule("src/lib/lesson-presentation.ts")
const { normalizeMistakeList, buildMistakeId } = await loadTsModule("src/lib/mistake-notebook-model.ts")
const { mistakeToQuestion } = await loadTsModule("src/lib/review-questions.ts")
const { getMistakeRetirement } = await loadTsModule("src/lib/mistake-review-compatibility.ts")
const { enrollKnowledgeCard, isCurrentKnowledgeCard, normalizeKnowledgeReviews } = await loadTsModule("src/lib/knowledge-review-model.ts")
const { isCurrentLessonAnswer } = await loadTsModule("src/lib/lesson-content-version.ts")
const { resumeLessonUpdateAttempt } = await loadTsModule("src/lib/lesson-attempt.ts")
const { applyLessonStepAnswer } = await loadTsModule("src/lib/lesson-step-answers.ts")
const { normalizeLessonProgressMap, normalizeItemProgressMap } = await loadTsModule("src/lib/learning-progress-model.ts")
const { CURRENT_ASSESSMENT_REVISION, updateAssessmentEvidence, getCurrentAssessmentEvidence, getAssessedModes, getModeMastery } = await loadTsModule("src/lib/assessment-evidence.ts")
const { AUDIT_RECHECK_MODES } = await loadTsModule("src/data/audit-affected-modes.ts")
const { normalizeBackupEntry } = await loadTsModule("src/lib/learning-backup.ts")
const { STORAGE_KEYS } = await loadTsModule("src/lib/storage-keys.ts")
const all = new Map(STARTER_LESSONS.flatMap(l => l.steps.filter(s => s.type === "sentenceBuild").map(s => [`${l.id}/${s.id}`,s])))
function canAssemble(chunks, answer) {
  if (!chunks.length) return !answer.length
  return chunks.some((chunk,i) => answer.startsWith(chunk) && canAssemble(chunks.filter((_,j) => i !== j), answer.slice(chunk.length)))
}
function mistake(question, answer = "不匹配") {
  const input = questionToMistakeInput(makeQuestionResult(question, answer, 100))
  assert.ok(input)
  return normalizeMistakeList([{...input, id:buildMistakeId(input), lastWrongAnswer:answer, createdAt:100,lastWrongAt:100}],100)[0]
}

test("the reviewed inventory covers every current assembly prompt, translation, answer and chunk version", () => {
  assert.equal(audit.rows.length,297)
  assert.deepEqual(new Set(audit.rows.map(r => r.key)), new Set(all.keys()))
  for (const row of audit.rows) {
    const step = all.get(row.key)
    assert.equal(getLessonStepVersion(step),row.version,`${row.key}: content changed since linguistic review; review this entry again`)
    assert.equal(step.answer,row.answer)
    assert.deepEqual(step.acceptedAnswers ?? [],row.acceptedAnswers)
    for (const answer of [row.answer,...row.acceptedAnswers]) {
      assert.ok(canAssemble(step.chunks.map(normalizeAnswer),normalizeAnswer(answer)),`${row.key}: every tile must be used exactly once: ${answer}`)
      assert.ok(isQuestionAnswerCorrect(lessonStepToQuestion(step),answer))
    }
  }
})

test("all reviewed variants survive lesson scoring, saved mistakes and knowledge-card backup normalization", () => {
  for (const row of audit.rows.filter(r=>r.acceptedAnswers.length)) {
    const step=all.get(row.key)
    const question=lessonStepToQuestion(step)
    const saved=mistake(question)
    assert.equal(getMistakeRetirement(saved),null)
    const review=mistakeToQuestion(saved)
    const card=Object.values(normalizeKnowledgeReviews(enrollKnowledgeCard({},question,100)))[0]
    assert.ok(isCurrentKnowledgeCard(card))
    for (const answer of row.acceptedAnswers) {
      assert.equal(makeQuestionResult(question,answer).correct,true)
      assert.equal(makeQuestionResult(review,answer).correct,true)
      assert.equal(makeQuestionResult(card.question,answer).correct,true)
    }
  }
})

test("grammatical but meaning-changing orders, incomplete counters and the old lending direction are rejected", () => {
  const negatives = [
    ["d37-build-ringo","りんごをみっつ"],
    ["d37-build-coffee","にはいコーヒーをください"],
    ["d61-build-tetsudau","ともだちにてつだってあげます"],
    ["d63-build-kari","せんせいにじしょをかりてもらいました"],
    ["d135-build","毎日続けることです"],
  ]
  for (const [id,answer] of negatives) {
    const step=[...all.values()].find(s=>s.id===id)
    assert.equal(isQuestionAnswerCorrect(lessonStepToQuestion(step),answer),false,id)
  }
  for (const [day,answer] of [[77,"てをたべるまえにあらいます"],[124,"図書館が学生である限り使えます"],[163,"福祉が貧困であるにもかかわらず届かない"]]) {
    const candidates=STARTER_LESSONS.find(l=>l.order===day).steps.filter(s=>s.type==="sentenceBuild")
    assert.ok(candidates.some(s=>canAssemble(s.chunks,answer)),`real same-tile counterexample: ${answer}`)
    assert.ok(candidates.every(s=>!isQuestionAnswerCorrect(lessonStepToQuestion(s),answer)))
  }
  const oldLoan=audit.changed.find(r=>r.before.id==="d63-build-kari").before
  assert.equal(isQuestionAnswerCorrect(lessonStepToQuestion(oldLoan),negatives[3][1]),true,"the historical bug is preserved as a real counterexample")
  const broken=audit.changed.find(r=>r.before.id==="d169-mc-pitfall")
  const fixed=STARTER_LESSONS.find(l=>l.id===broken.lessonId).steps.find(s=>s.id===broken.before.id)
  assert.equal(isQuestionAnswerCorrect(lessonStepToQuestion(fixed),"とりんごを買った"),false)
  assert.equal(isQuestionAnswerCorrect(lessonStepToQuestion(fixed),"りんごとバナナを買った"),true)
})

test("tile presentation never reveals the canonical answer or an allowed variant across 50 attempt seeds", () => {
  for (const step of all.values()) for (let seed=0;seed<50;seed++) {
    const {chunks}=getLessonPresentation(step,String(seed))
    assert.deepEqual(chunks.map(t=>t.idx).sort((a,b)=>a-b),step.chunks.map((_,i)=>i))
    assert.equal(isQuestionAnswerCorrect(lessonStepToQuestion(step),chunks.map(t=>t.chunk).join("")),false,`${step.id}/${seed}`)
  }
})

test("every corrected old practice snapshot retires, including versionless legacy mistakes, while the raw record survives", () => {
  for (const entry of audit.changed) {
    const lesson=STARTER_LESSONS.find(l=>l.id===entry.lessonId)
    const current=lesson.steps.find(s=>s.id===entry.before.id)
    assert.equal(getLessonStepVersion(current),entry.afterVersion)
    const oldQuestion=lessonStepToQuestion(entry.before)
    const oldMistake=mistake(oldQuestion)
    const original=structuredClone(oldMistake)
    assert.ok(getMistakeRetirement(oldMistake),entry.before.id)
    assert.ok(getMistakeRetirement({...oldMistake,questionVersion:undefined}),`${entry.before.id}/legacy`)
    assert.deepEqual(oldMistake,original)
    assert.equal(isCurrentLessonAnswer(current,{correct:true,answer:entry.before.answer,createdAt:100,questionVersion:oldQuestion.questionVersion}),false)
    const card=Object.values(enrollKnowledgeCard({},oldQuestion,100))[0]
    assert.equal(isCurrentKnowledgeCard(card),false)
  }
})

test("corrected lending exercise can be retaken without overwriting first score, completion date, or the archived answer", () => {
  const entry=audit.changed.find(r=>r.before.id==="d63-build-kari")
  const current=STARTER_LESSONS.find(l=>l.id===entry.lessonId)
  const old={...current,steps:current.steps.map(s=>s.id===entry.before.id?entry.before:s)}
  const oldAnswer={answer:entry.before.answer,correct:true,createdAt:50,questionVersion:getLessonStepVersion(entry.before)}
  const progress={lessonId:current.id,status:"completed",startedAt:10,completedAt:100,score:100,completedStepVersions:getLessonStepVersions(old),stepAnswers:{[entry.before.id]:oldAnswer}}
  const resumed=resumeLessonUpdateAttempt(progress,current,"revised-loan",200)
  const step=current.steps.find(s=>s.id===entry.before.id)
  const stored=applyLessonStepAnswer({[current.id]:resumed},current.id,step.id,{answer:step.acceptedAnswers[0],correct:true,questionVersion:getLessonStepVersion(step),createdAt:220},220)
  const restored=normalizeLessonProgressMap(JSON.parse(normalizeBackupEntry(STORAGE_KEYS.LESSON_PROGRESS,JSON.stringify(stored))))[current.id]
  assert.equal(restored.completedAt,100)
  assert.equal(restored.score,100)
  assert.deepEqual(restored.supersededAnswers[`${step.id}@${oldAnswer.questionVersion}`],oldAnswer)
  assert.equal(restored.stepAnswers[step.id].answer,"じしょをせんせいにかしてもらいました")
})

test("earlier audit-v1 aggregates cannot certify newly corrected content; current-version evidence and history both survive backup", () => {
  const entry=audit.changed.find(r=>r.before.id==="d63-build-kari")
  const step=STARTER_LESSONS.find(l=>l.id===entry.lessonId).steps.find(s=>s.id===entry.before.id)
  const question=lessonStepToQuestion(step)
  const item={itemId:question.itemId,itemType:question.itemType,recognition:0,listening:0,meaning:0,recall:100,production:0,attempts:6,correct:6,updatedAt:100,assessedModes:["recall"],assessmentEvidence:{recall:{score:100,attempts:6,correct:6,versioned:{"previous-revision":{score:80,attempts:5,correct:5}}}}}
  assert.deepEqual(getAssessedModes(item),[])
  assert.equal(getModeMastery(item,"recall"),0)
  const result={itemId:item.itemId,itemType:item.itemType,mode:"recall",correct:true,createdAt:200,assessmentRevision:CURRENT_ASSESSMENT_REVISION,questionVersion:getLessonStepVersion(entry.before)}
  const invalid={...item,assessmentEvidence:updateAssessmentEvidence(item,result)}
  assert.equal(getCurrentAssessmentEvidence(invalid,"recall"),undefined)
  const updated={...item,assessmentEvidence:updateAssessmentEvidence(item,{...result,questionVersion:question.questionVersion})}
  assert.equal(getModeMastery(updated,"recall"),18)
  assert.equal(updated.assessmentEvidence.recall.attempts,7)
  assert.deepEqual(updated.assessmentEvidence.recall.versioned["previous-revision"],item.assessmentEvidence.recall.versioned["previous-revision"])
  const registry=AUDIT_RECHECK_MODES[`${item.itemType}:${item.itemId}`].recall
  assert.equal(updated.assessmentEvidence.recall.versioned[registry.revision].attempts,1)
  const restored=normalizeItemProgressMap(JSON.parse(normalizeBackupEntry(STORAGE_KEYS.ITEM_PROGRESS,JSON.stringify({[item.itemId]:updated}))))[item.itemId]
  assert.deepEqual(restored.assessmentEvidence,updated.assessmentEvidence)
  assert.equal(getModeMastery(restored,"recall"),18)
})
