"use client"
import Link from "next/link"
import { STAGE_WRITING_TASKS, stageWritingTask } from "@/data/stage-writing-tasks"
import { COURSE_PHASES, type CoursePhaseId } from "@/lib/course-phases"
import { STARTER_LESSONS } from "@/data/lesson-catalog"
import { useLearningProgress } from "@/lib/learning-progress"
import { getLessonConsolidation } from "@/lib/lesson-consolidation"
import { WrittenWorkEditor } from "@/components/learning/written-work-editor"

export function StageWritingPage({ phase }: { phase: CoursePhaseId }) {
  const stage = STAGE_WRITING_TASKS.find(item => item.phase === phase)!
  const phaseInfo = COURSE_PHASES.find(item => item.id === phase)!
  const learning = useLearningProgress()
  const lessons = STARTER_LESSONS.filter(lesson => lesson.track === phaseInfo.track)
  const completed = lessons.filter(lesson => learning.completedLessonIds.has(lesson.id))
  const passed = completed.filter(lesson => getLessonConsolidation(lesson.id, learning.lessons[lesson.id]).status === "passed")
  return <div className="paper-wrap max-w-4xl py-8 sm:py-12" data-testid="stage-writing">
    <Link href="/path" className="text-sm underline underline-offset-4">返回学习路径</Link>
    <p className="eyebrow mt-6">{phaseInfo.label} · 独立迁移材料</p>
    <h1 className="mt-3 text-2xl font-semibold leading-relaxed sm:text-3xl">{stage.title}</h1>
    <p className="mt-4 text-base leading-8 text-muted-foreground">{stage.scene}</p>
    <nav aria-label="阶段学习入口" className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-sm underline underline-offset-4"><Link href={`/placement#${phase}`}>进入基础与实际覆盖</Link><Link href={`/placement/${phase}`}>独立知识诊断</Link><Link href={`/checkpoints/${phase}/kanji`}>汉字读音练习</Link></nav>
    <aside className="my-6 border-y border-border py-4 text-sm leading-7" data-testid="stage-knowledge-evidence">
      <p>知识题记录：{learning.loaded ? `本阶段完成 ${completed.length}/${lessons.length} 课，当前本课测评达标 ${passed.length}/${lessons.length} 课。` : "正在读取…"}</p>
      <p>下方作品单独保存，以本人完成自查为证据。这篇原创材料与课程课文独立；再次打开后便不再属于未见材料。课程知识、自查作品与独立阶段诊断分别判断，不自动认证口语或考试等级。</p>
    </aside>
    <section aria-label="新情境材料" className="space-y-5">
      <p lang="ja" className="whitespace-pre-wrap font-jp text-xl leading-10" data-testid="stage-passage">{stage.passage}</p>
      <details className="border-y border-border/50 py-4"><summary className="cursor-pointer text-base font-semibold">词语辅助</summary><dl className="mt-3 space-y-2">{stage.words.map(([word, reading, meaning]) => <div key={word} className="flex flex-wrap gap-x-3 text-base leading-8"><dt lang="ja">{word}（{reading}）</dt><dd className="text-muted-foreground">{meaning}</dd></div>)}</dl></details>
    </section>
    <section aria-label="阶段作品" className="mt-7">
      <h2 className="text-xl font-semibold">你的迁移任务</h2>
      <p className="mt-3 text-base leading-8">{stage.task}</p>
      <WrittenWorkEditor task={stageWritingTask(stage)} />
    </section>
    <p className="mt-8 text-sm leading-7 text-muted-foreground">如发现某种表达还不能独立使用，可返回路径补练相应课程，或在作品笔记中保留问题，之后请老师或学习伙伴反馈。</p>
  </div>
}
