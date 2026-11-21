"use client"
import { Suspense } from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import type { ReferenceLevel, UserProfile } from "@/lib/learning-progress-types"
import { getGoalPracticePlan } from "@/lib/goal-practice"
import { goalPracticeTaskHref, parseMediaLevel, type GoalPracticeSource } from "@/lib/goal-practice-navigation"

type SectionProps = { profile: UserProfile | null; loaded?: boolean }

export function GoalPracticeSection(props: SectionProps) {
  return <Suspense fallback={<GoalPracticeContent {...props} loaded={false} />}><QueryGoalPracticeSection {...props} /></Suspense>
}
function QueryGoalPracticeSection(props: SectionProps) {
  const query = useSearchParams()
  const pathname = usePathname()
  const mediaLevel = parseMediaLevel(query.get("mediaLevel"))
  const selectMediaLevel = (level: ReferenceLevel) => {
    const next = new URLSearchParams(query.toString())
    next.set("mediaLevel", level)
    window.history.replaceState(null, "", `${pathname}?${next}${window.location.hash}`)
  }
  return <GoalPracticeContent {...props} mediaLevel={mediaLevel} source={pathname === "/path" ? "path" : "home"} onSelectMediaLevel={selectMediaLevel} />
}
function GoalPracticeContent({ profile, loaded = true, mediaLevel, source = "home", onSelectMediaLevel }: SectionProps & {
  mediaLevel?: ReferenceLevel; source?: GoalPracticeSource; onSelectMediaLevel?: (level: ReferenceLevel) => void
}) {
  const selectedMediaLevel = mediaLevel ?? parseMediaLevel(profile?.selfAssessedLevel) ?? "N5"
  const plan = getGoalPracticePlan(profile, mediaLevel)
  return <section id="goal-practice" className="my-8 min-w-0 scroll-mt-28 border-t border-border/50 py-7" aria-label="目标专项" data-testid="goal-practice">
    <h2 className="text-xl font-semibold sm:text-2xl">{loaded ? plan.label : "正在读取学习目标…"}<span className="ml-3 text-sm font-normal text-muted-foreground">补充练习</span></h2>
    {loaded && <>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">{plan.description}</p>
      {profile?.goal === "media" && <div className="mt-4">
        <div className="flex flex-wrap gap-2" role="group" aria-label="动漫情境难度">
          {(["N5", "N4", "N3", "N2"] as const).map(level => <button key={level} type="button" className="filter-chip min-h-11 px-4 text-sm" aria-pressed={selectedMediaLevel === level} onClick={() => onSelectMediaLevel?.(level)}>{level}</button>)}
        </div>
        <p className="mt-2 text-xs leading-6 text-muted-foreground">只切换情境材料，不改变课程起点。</p>
      </div>}
      <ol className="mt-4 divide-y divide-border/40">{plan.tasks.map((task, index) => <li key={task.id} data-goal-task={task.id}>
        <Link href={goalPracticeTaskHref(task.id, source, profile?.goal === "media" ? selectedMediaLevel : undefined)} className="group flex min-h-16 items-center justify-between gap-4 py-4" prefetch={false}>
          <span><span className="text-base font-semibold group-hover:underline group-hover:underline-offset-4">{index + 1}. {task.title}</span><span className="mt-1 block text-sm leading-7 text-muted-foreground">{task.prerequisite}</span></span><span aria-hidden="true" className="text-xl">↗</span>
        </Link>
      </li>)}</ol>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">每次选一项，进入后查看情境、练习并保存表达。作品由本人自查，可在学习设置中更换目标。</p>
    </>}
  </section>
}
