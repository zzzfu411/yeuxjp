"use client"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import type { UserProfile } from "@/lib/learning-progress-types"
import type { LearningEntry } from "@/lib/learning-entry"
import type { StudyDay } from "@/lib/study-calendar-model"
import { useDailyStudy } from "@/lib/use-daily-study"
import { activeDailyPlan, buildDailyStudyPlan, dailyTaskDone } from "@/lib/daily-study-plan"
import { todayKey } from "@/lib/learning-progress-model"

export function DailyStudySection({ profile, entry, totalDue, date, day, loaded }: {
  profile: UserProfile | null; entry: LearningEntry; totalDue: number; date: Date; day?: StudyDay; loaded: boolean
}) {
  const state = useDailyStudy()
  const active = activeDailyPlan(state.plans, todayKey(date))
  const preview = buildDailyStudyPlan({ profile, entry, totalDue, now: date.getTime() })
  const plan = active ?? preview
  const required = plan.tasks.filter(task => !task.optional)
  const done = active ? required.filter(task => dailyTaskDone(task, active, day, state.works)).length : 0
  const ready = loaded && state.loaded && !state.error
  const [expanded, setExpanded] = useState<boolean | null>(null)
  const tasksOpen = expanded ?? Boolean(active)
  return <section id="daily-study-plan" className="home-daily-plan scroll-mt-28" data-testid="daily-study-plan">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 className="text-xl font-semibold">{active ? "今天的任务" : "给今天留一点学习时间"}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{plan.minutes} 分钟预算 · {required.length} 项主要任务{plan.tasks.some(task => task.optional) ? " + 可选表达" : ""}</p>
      </div>
      {!active && <Button disabled={!ready || state.pending} onClick={() => { setExpanded(null); void state.start(preview) }} data-testid="daily-plan-start">开始今天的安排</Button>}
    </div>
    {active && <div className="mt-4 text-sm" data-testid="daily-task-progress"><p>主要任务 {done}/{required.length} · 今日答题 {day?.practiceCount ?? 0} 次 · 其中复习／补练 {day?.reviewCount ?? 0} 次</p>
      <div className="vn-progress-track mt-2" role="progressbar" aria-label="今日任务进度" aria-valuemin={0} aria-valuemax={required.length} aria-valuenow={done}><span style={{ width: `${done / required.length * 100}%` }} /></div></div>}
    <button type="button" className="home-text-button mt-2" aria-expanded={tasksOpen} aria-controls="daily-task-details" onClick={() => setExpanded(!tasksOpen)}>{tasksOpen ? "收起任务详情" : "看看具体怎么安排"} <span aria-hidden="true">{tasksOpen ? "−" : "+"}</span></button>
    <div id="daily-task-details" hidden={!tasksOpen}>
    <p className="mt-2 text-sm leading-7 text-muted-foreground">预计合计 {plan.tasks.reduce((sum, task) => sum + task.minutes, 0)} 分钟，包含可选表达。可以分次完成，无需一次学完整课。</p>
    <ol className="mt-2 divide-y divide-border/40">{plan.tasks.map(task => <li key={task.id} data-daily-task={task.kind} className="py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2"><h3 className="text-base font-semibold">{task.title}{task.optional && "（可选）"}</h3><span className="text-sm text-muted-foreground">约 {task.minutes} 分钟</span></div>
      <p className="mt-2 text-sm leading-7 text-muted-foreground">{task.instruction}</p>
      {active && <div className="mt-3 flex flex-wrap items-center gap-4"><Link href={task.href} className="inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4">进入任务 →</Link>
        {task.kind === "reading" ? <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={state.pendingConfirmation?.planId === active.id && state.pendingConfirmation.taskId === task.id ? state.pendingConfirmation.confirmed : dailyTaskDone(task, active, day, state.works)} disabled={state.pending || !ready} onChange={event => void state.confirm(active.id, task.id, event.target.checked)} />我已完成这个片段（本人确认）</label>
          : <span className="text-sm">{dailyTaskDone(task, active, day, state.works) ? task.kind === "writing" ? "已完成作品自查" : "已完成作答" : task.kind === "writing" ? "尚未完成自查，可先保存一句笔记" : "等待实际作答"}</span>}</div>}
    </li>)}</ol>
    <details className="mt-2 text-sm leading-7 text-muted-foreground"><summary className="cursor-pointer">时间与记录怎么算</summary><p className="mt-2">时间是安排估计，不是计时或能力分数。阅读片段由本人确认；复习按实际保存的作答记录；表达完成以作品自查为准。</p></details>
    </div>
    {state.pending && <p role="status" className="mt-3 text-sm">正在保存安排…</p>}
    {active && <details className="mt-4 border-t border-border/40 pt-3 text-sm"><summary className="cursor-pointer text-muted-foreground">调整今天的安排</summary><p className="my-3 leading-7 text-muted-foreground">已开始的安排不会随下一课推荐改变。重新安排会保留旧记录，采用当前学习设置中的时间与目标。</p><Button variant="outline" disabled={!ready || state.pending} onClick={() => { setExpanded(null); void state.start(preview) }} data-testid="daily-plan-start">按当前设置重新安排今天</Button></details>}
    {(state.error || state.saveError) && <p role="alert" className="mt-3 text-sm leading-7">今日安排或作品记录暂时无法读取／保存。原始数据保留，请先备份并检查存储状态。</p>}
  </section>
}
