"use client"

import { useMemo, useState } from "react"
import type { LessonTrack } from "@/data/lesson-types"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { getLessonEntryBadge, getLessonEntryStatus } from "@/lib/learning-entry"
import { STARTER_LESSONS, type LessonSummary } from "@/data/lesson-catalog"
import {
  countPhaseProgress,
  COURSE_PHASES,
  getActiveCoursePhase,
} from "@/lib/course-phases"
import { countSatisfiedLessons, getNextCourseLesson } from "@/lib/lesson-skip"
import { useLearningProfile } from "@/lib/learning-progress"
import type { LessonProgressMap } from "@/lib/learning-progress-types"
import { consolidationLabel, getLessonConsolidation } from "@/lib/lesson-consolidation"
import { useStageDiagnostics } from "@/lib/use-stage-diagnostics"

export function PathStarterLessons({
  completedLessonIds,
  activeLessonId,
  lessons = {},
}: {
  completedLessonIds: ReadonlySet<string>
  activeLessonId: string | null | undefined
  lessons?: LessonProgressMap
}) {
  const { profile, loaded: profileLoaded } = useLearningProfile()
  const kanaLevel = profileLoaded ? profile?.kanaLevel : undefined
  const placement = useStageDiagnostics()
  const entryOrder = placement.entryOrder
  const activePhase = useMemo(
    () => getActiveCoursePhase(STARTER_LESSONS, completedLessonIds, activeLessonId, kanaLevel, entryOrder),
    [activeLessonId, completedLessonIds, kanaLevel, entryOrder]
  )
  const satisfiedCount = useMemo(
    () => countSatisfiedLessons(STARTER_LESSONS, completedLessonIds, kanaLevel, entryOrder),
    [completedLessonIds, kanaLevel, entryOrder]
  )
  const [openOverrides, setOpenOverrides] = useState<Partial<Record<LessonTrack, boolean>>>({})
  const [openUnits, setOpenUnits] = useState<Record<number, boolean>>({})
  const activeLesson = STARTER_LESSONS.find(lesson => lesson.id === activeLessonId && lesson.track === activePhase.track)
    ?? getNextCourseLesson(STARTER_LESSONS, completedLessonIds, kanaLevel, entryOrder)
    ?? STARTER_LESSONS.at(-1)
  const activeUnit = activeLesson ? Math.floor((activeLesson.order - 1) / 5) + 1 : 1

  if (!profileLoaded || !placement.loaded) {
    return (
      <div className="min-w-0 py-8">
        <div className="text-sm text-muted-foreground">正在读取课程...</div>
      </div>
    )
  }

  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">主题课程</h2>
        </div>
        <div className="font-scribble text-base text-muted-foreground">
          已完成 {STARTER_LESSONS.filter(lesson => completedLessonIds.has(lesson.id)).length}/{STARTER_LESSONS.length}
        </div>
      </div>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">完成与跳过合计 {satisfiedCount} 课。{entryOrder > 1 ? `已采用诊断起点：第 ${entryOrder} 课。` : "按当前基础循序开始。"} 每单元 5 课，展开查看。</p>
      {placement.error && <p role="alert" className="mt-3 text-sm text-destructive">诊断记录无法读取，暂按基础起点显示。原记录保留，请到设置备份并恢复。</p>}
      <div className="mt-5 border-y border-border/50">
        {COURSE_PHASES.map(phase => {
          const phaseLessons = STARTER_LESSONS.filter(lesson => lesson.track === phase.track)
          const phaseOpen = openOverrides[phase.track] ?? phase.track === activePhase.track
          const progress = countPhaseProgress(STARTER_LESSONS, completedLessonIds, phase.track, kanaLevel, entryOrder)
          const units = phaseLessons.filter((_, index) => index % 5 === 0).map(first => ({ first, number: Math.floor((first.order - 1) / 5) + 1, lessons: phaseLessons.filter(lesson => lesson.order >= first.order && lesson.order < first.order + 5) }))
          return <section key={phase.id} aria-label={phase.label} className="border-b border-border/50 last:border-b-0">
            <button type="button" data-testid={`path-course-phase-${phase.id}`} aria-expanded={phaseOpen} aria-controls={`path-phase-${phase.id}`}
              onClick={() => setOpenOverrides(current => ({ ...current, [phase.track]: !(current[phase.track] ?? phase.track === activePhase.track) }))}
              className="flex w-full items-center justify-between gap-3 bg-muted/20 px-3 py-4 text-left hover:bg-muted/35">
              <span><span className="block text-lg font-semibold">{phase.label}</span><span className="mt-1 block text-sm text-muted-foreground">{phase.range} · {phase.short}</span></span>
              <span className="shrink-0 text-right text-sm text-muted-foreground">{progress.done}/{progress.total} {phaseOpen ? "▾" : "▸"}{progress.skipped > 0 && <small className="block">另跳过 {progress.skipped} 课</small>}</span>
            </button>
            <div id={`path-phase-${phase.id}`} hidden={!phaseOpen}>
              {units.map(unit => {
                const unitOpen = openUnits[unit.number] ?? unit.number === activeUnit
                return <div key={unit.number} className="border-t border-border/40">
                  <button type="button" data-testid={`path-course-unit-${unit.number}`} aria-expanded={unitOpen} aria-controls={`path-unit-${unit.number}`}
                    onClick={() => setOpenUnits(current => ({ ...current, [unit.number]: !(current[unit.number] ?? unit.number === activeUnit) }))}
                    className="flex w-full items-start justify-between gap-4 px-3 py-4 text-left hover:bg-muted/25">
                    <span><span className="block text-sm text-muted-foreground">单元 {unit.number} · 第 {unit.first.order}–{unit.lessons.at(-1)?.order} 课</span><span className="mt-1 block text-base font-semibold leading-7">{unit.first.unit?.title ?? "主题练习"}</span></span>
                    <span className="shrink-0 pt-1 text-sm text-muted-foreground" aria-hidden="true">{unitOpen ? "−" : "+"}</span>
                  </button>
                  <div id={`path-unit-${unit.number}`} hidden={!unitOpen} data-testid={`path-unit-lessons-${unit.number}`}>
                    {unit.lessons.map(lesson => <PathLessonRow key={lesson.id} lesson={lesson}
                      status={getLessonEntryStatus(lesson, completedLessonIds, activeLessonId, kanaLevel, entryOrder)} progress={lessons[lesson.id]} />)}
                  </div>
                </div>
              })}
              <div className="space-y-2 border-t border-border/40 px-3 py-4 text-sm leading-7">
                <p className="text-muted-foreground">本课测评达标 {phaseLessons.filter(item => completedLessonIds.has(item.id) && getLessonConsolidation(item.id, lessons[item.id]).status === "passed").length} 课</p>
                <div className="flex flex-wrap gap-x-5 gap-y-2"><Link href={`/placement/${phase.id}`} className="inline-flex min-h-11 items-center underline underline-offset-4">阶段诊断 →</Link><Link href={`/checkpoints/${phase.id}/kanji`} className="inline-flex min-h-11 items-center underline underline-offset-4">汉字读音 →</Link><Link href={`/checkpoints/${phase.id}`} className="inline-flex min-h-11 items-center underline underline-offset-4">阶段作品与自查 →</Link></div>
              </div>
            </div>
          </section>
        })}
      </div>
    </div>
  )
}

function PathLessonRow({ lesson, status, progress }: { lesson: LessonSummary; status: ReturnType<typeof getLessonEntryStatus>; progress: LessonProgressMap[string] | undefined }) {
  const assessment = status === "done" ? getLessonConsolidation(lesson.id, progress) : null
  const content = <>
    <div className="flex min-w-0 flex-1 items-baseline gap-3">
      <span className="w-16 shrink-0 text-sm text-muted-foreground">第 {lesson.order} 课</span>
      <span className="text-base font-semibold leading-7">{lesson.title.replace(/^第 \d+ 课：/, "")}</span>
    </div>
    <span className={cn("max-w-24 shrink-0 text-right text-sm text-muted-foreground", status === "active" && "text-accent")}>
      {getLessonEntryBadge(status)}
      {assessment && <small className="block" data-testid={`course-assessment-${lesson.id}`}>{consolidationLabel(assessment)}</small>}
    </span>
  </>
  const className = cn(
    "ledger-row flex items-center gap-4 border-b border-border/30 px-2 py-3.5 transition-colors hover:bg-muted/30",
    status === "done" && "text-foreground/75",
    status === "skipped" && "bg-muted/20",
    status === "active" && "border-l-2 border-l-accent bg-accent/[0.06] pl-[calc(0.5rem-2px)]",
    status === "locked" && "cursor-default bg-muted/15 hover:bg-transparent"
  )
  return status === "locked" ? <div data-course-lesson={lesson.id} aria-disabled="true" className={className}>{content}</div>
    : <Link data-course-lesson={lesson.id} href={`/learn/${lesson.id}`} className={className}>{content}</Link>
}
