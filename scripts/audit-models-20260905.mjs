import fs from 'node:fs'
import { loadTsModule } from '../tests/unit/load-ts-module.mjs'
const load = loadTsModule
const { STARTER_LESSONS: lessons } = await load('src/data/lessons.ts')
const model = await load('src/lib/learning-progress-model.ts')
const status = await load('src/lib/learning-status-model.ts')
const home = await load('src/lib/home-page-model.ts')
const skip = await load('src/lib/lesson-skip.ts')
const { grammarData } = await load('src/data/grammar-data.ts')
const { semanticsData } = await load('src/data/semantics-data.ts')
const { pragmaticsData } = await load('src/data/pragmatics-data.ts')
const steps = lessons.flatMap(l => l.steps.map(s=>({...s, lessonId:l.id})))
const counts = a => a.reduce((m,x)=>(m[x]=(m[x]||0)+1,m),{})
const now = new Date(2026,8,5,12).getTime()
const history = Array.from({length:400}, (_,i)=>({itemId:'sur-g-1',itemType:'vocab',mode:'meaning',correct:true,createdAt:now-Math.floor(i/40)*86400000})).reverse()
const retained = model.normalizePracticeResults(history)
const p = {...model.createItemProgress('sur-g-1','vocab',now),meaning:100,attempts:6,correct:6}
const out = {
  lessons:lessons.length, steps:steps.length, stepsByType:counts(steps.map(s=>s.type)),
  grammarByLevel:Object.fromEntries(Object.entries(grammarData).map(([k,v])=>[k,v.length])),semantics:semanticsData.length,pragmatics:pragmaticsData.length,
  choiceAnswerPositions:counts(steps.filter(s=>s.type==='multipleChoice').map(s=>s.options.indexOf(s.answer))),
  sentenceBuild:{total:steps.filter(s=>s.type==='sentenceBuild').length,alreadyOrdered:steps.filter(s=>s.type==='sentenceBuild'&&model && s.chunks.join('')===s.answer).length},
  typingHints:steps.filter(s=>(s.type==='typing'||s.type==='dictation')&&s.hint).length,
  history:{before:history.length,after:retained.length,streakBefore:model.calculateStudyStreak(model.buildStudyDates({},history),new Date(now)),streakAfter:model.calculateStudyStreak(model.buildStudyDates({},retained),new Date(now))},
  mastery:{statusScore:status.learningStatusMasteryScore(p),learned:status.isItemLearnedFromProgress(p),homeWeakest:home.getHomeWeakestItem({'sur-g-1':p})},
  solidNewUserCompletedCount:skip.countSatisfiedLessons(lessons,new Set(),'solid'),
  sourceFiles:fs.readdirSync('tests/unit').filter(x=>x.endsWith('.test.mjs')).length,
  contractFiles:fs.readdirSync('tests/unit').filter(x=>x.endsWith('-contract.test.mjs')).length,
  courseBytes:fs.readdirSync('src/data/lessons').reduce((n,x)=>n+fs.statSync('src/data/lessons/'+x).size,0)
}
fs.mkdirSync('output/playwright/audit-20260905',{recursive:true})
fs.writeFileSync('output/playwright/audit-20260905/model-evidence.json',JSON.stringify(out,null,2))
console.log(JSON.stringify(out,null,2))
