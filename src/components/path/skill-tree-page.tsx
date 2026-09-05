"use client"

import Link from "next/link"
import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { GlossaryButton, GlossaryTerm } from "@/components/ui/glossary"
import { cn } from "@/lib/utils"
import { PathStarterLessons } from "@/components/path/path-starter-lessons"
import { STARTER_LESSONS } from "@/data/lesson-catalog"
import { SKILL_CATEGORY_LABEL, SKILL_TREE, SKILL_TREE_BY_CATEGORY, type SkillCategory } from "@/lib/skill-tree"
import { useLearningRecommendation } from "@/lib/learning-recommendation"
import { countLessonItemIds } from "@/lib/lesson-item-coverage"
import {
  getPathMasterySummary,
  getSkillStatus,
} from "@/lib/path-page-model"

export function SkillTreePage() {
  const { learning, kanaStats, vocabStats, nextSkillId, nextLesson, learningEntry, satisfiedLessonCount, course } = useLearningRecommendation()
  const completedCount = STARTER_LESSONS.filter(lesson => learning.completedLessonIds.has(lesson.id)).length
  const masterySummary = useMemo(() => getPathMasterySummary(learning.items), [learning.items])
  const courseVocabCount = useMemo(() => countLessonItemIds(STARTER_LESSONS, "vocab"), [])

  return (
    <div className="paper-wrap px-3 py-8 sm:px-5 sm:py-12">
      <article className="paper-sheet course-map-panel mx-auto mb-16 max-w-6xl px-5 py-8 sm:px-8 lg:px-12">
        <header className="border-b border-border/50 pb-7">
          <p className="eyebrow">175 天课程</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-5">
            <div>
              <h1 className="inkline font-brush text-4xl sm:text-5xl">学习路径</h1>
              <p className="mt-2 text-sm font-semibold text-muted-foreground">每天一课，循序学习</p>
            </div>
            <GlossaryButton className="h-auto border-0 bg-transparent px-0 py-1 text-sm text-muted-foreground shadow-none hover:bg-transparent hover:text-foreground">
              打开术语表
            </GlossaryButton>
          </div>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-muted-foreground">
            主线是 175 天 N5→N2 课程。薄弱项可另做假名、词汇和专项练习。建议先熟悉 <GlossaryTerm termId="kana">假名</GlossaryTerm>，再学{" "}
            <GlossaryTerm termId="particle">助词</GlossaryTerm> 和动词 <GlossaryTerm termId="conjugation">活用</GlossaryTerm>。
          </p>
        </header>

        <section className="paper-slip next-route-card relative my-9 flex flex-col items-start justify-between gap-5 px-5 py-6 sm:flex-row sm:items-center sm:px-7" aria-labelledby="next-entry-title">
          <span className="paper-tape" aria-hidden="true" />
          <div>
            <p className="eyebrow">下一课</p>
            <h2 id="next-entry-title" className="mt-2 text-xl font-semibold">{learningEntry.title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{learningEntry.subtitle}</p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              系统会根据课程进度和练习表现推荐下一步；已有的假名和词汇进度会继续保留。
            </p>
          </div>
          <Button asChild className="shrink-0">
            <Link href={learningEntry.href} data-testid="path-next-learning">{learningEntry.cta}</Link>
          </Button>
        </section>

        <section className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.45fr)_minmax(15rem,0.55fr)]" aria-label="课程与学习记录">
          <PathStarterLessons completedLessonIds={learning.completedLessonIds} activeLessonId={nextLesson?.id} />

          <aside className="progress-panel min-w-0 border-l-4 border-l-[var(--signal-yellow)] bg-muted/35 p-5 lg:sticky lg:top-28">
            <p className="eyebrow inkline">学习进度</p>
            <div className="mt-3 border-y border-border/40">
              <Metric label="已完成课程" value={`${completedCount}/${STARTER_LESSONS.length}`} />
              {satisfiedLessonCount > completedCount && <Metric label="按基础跳过" value={`${satisfiedLessonCount - completedCount} 课`} />}
              <Metric label="课程词汇" value={`${courseVocabCount}`} />
              <Metric label="入门词汇" value={`${vocabStats.survival.done}/${vocabStats.survival.total}`} />
              <Metric label="已测能力均分" value={`${masterySummary.avg}%`} />
              <Metric label="输出掌握度" value={masterySummary.production === null ? "尚未测试" : `${masterySummary.production}%`} />
              <Metric label="练习次数" value={`${masterySummary.attempts}`} />
            </div>
            <p className="mt-4 text-xs leading-6 text-muted-foreground">
              课程按实际完成数量计算，按基础跳过单独列出。能力均分只计算已练习的题型（包括词卡自评），未测试的能力不算零分；手动标记和完成课程均不代表全面掌握。
            </p>
          </aside>
        </section>

        <div className="mt-14 space-y-12">
          {(Object.keys(SKILL_CATEGORY_LABEL) as SkillCategory[]).map((cat) => {
            const list = SKILL_TREE_BY_CATEGORY[cat]
            if (!list.length) return null
            return (
              <section key={cat} aria-labelledby={`skill-group-${cat}`}>
                <div className="mb-3 flex items-baseline gap-3">
                  <h2 id={`skill-group-${cat}`} className="text-base font-semibold">{SKILL_CATEGORY_LABEL[cat]}</h2>
                  <span className="font-scribble text-sm text-muted-foreground">practice notes</span>
                </div>

                <div className="border-y border-border/45">
                  {list.map((skill, index) => {
                    const { status, badge } = getSkillStatus(skill.id, kanaStats, vocabStats, SKILL_TREE, course)
                    const isRecommended = skill.id === nextSkillId

                    return (
                      <div
                        key={skill.id}
                        className={cn(
                          "skill-route-row ledger-row grid gap-4 border-b border-border/35 px-2 py-5 last:border-b-0 sm:grid-cols-[2rem_minmax(0,1fr)_auto] sm:items-start",
                          status === "locked" && "bg-muted/15",
                          isRecommended && "border-l-2 border-l-accent bg-accent/[0.05] pl-[calc(0.5rem-2px)]"
                        )}
                      >
                        <span className="font-scribble text-base text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                            <h3 className="text-base font-semibold">{skill.title}</h3>
                            {badge ? (
                              <span className={cn("font-scribble text-sm text-muted-foreground", isRecommended && "text-accent")}>
                                {badge}
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{skill.short}</p>
                          {skill.prerequisites?.length ? (
                            <p className="mt-2 text-xs text-muted-foreground">
                              前置：{skill.prerequisites.map((p, idx) => (
                                <span key={p}>
                                  {idx > 0 ? "、" : ""}
                                  {SKILL_TREE.find((s) => s.id === p)?.title ?? p}
                                </span>
                              ))}
                            </p>
                          ) : null}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                          <Button asChild variant="outline" size="sm">
                            <Link href={skill.href}>{status === "locked" ? "查看内容" : "去学习"}</Link>
                          </Button>
                          {!!skill.glossary?.length && (
                            <GlossaryButton termId={skill.glossary[0]} className="h-9 px-2 py-1 text-xs">
                              相关术语
                            </GlossaryButton>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      </article>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="ledger-row flex items-baseline justify-between gap-3 border-b border-border/30 px-1 py-3 last:border-b-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-scribble text-lg font-semibold">{value}</span>
    </div>
  )
}
