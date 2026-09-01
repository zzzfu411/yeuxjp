"use client"

import Link from "next/link"
import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { GlossaryButton, GlossaryTerm } from "@/components/ui/glossary"
import { cn } from "@/lib/utils"
import { PathStarterLessons } from "@/components/path/path-starter-lessons"
import { STARTER_LESSONS } from "@/data/lessons"
import { SKILL_CATEGORY_LABEL, SKILL_TREE, SKILL_TREE_BY_CATEGORY, type SkillCategory } from "@/lib/skill-tree"
import { useLearningRecommendation } from "@/lib/learning-recommendation"
import { countLessonItemIds } from "@/lib/lesson-item-coverage"
import {
  getPathMasterySummary,
  getSkillStatus,
} from "@/lib/path-page-model"

export function SkillTreePage() {
  const { learning, kanaStats, vocabStats, nextSkillId, nextLesson, learningEntry, satisfiedLessonCount, course } = useLearningRecommendation()
  const masterySummary = useMemo(() => getPathMasterySummary(learning.items), [learning.items])
  const courseVocabCount = useMemo(() => countLessonItemIds(STARTER_LESSONS, "vocab"), [])

  return (
    <div className="paper-wrap px-3 py-8 sm:px-5 sm:py-12">
      <article className="paper-sheet mx-auto mb-16 max-w-6xl px-5 py-8 sm:px-8 lg:px-12">
        <header className="border-b border-border/50 pb-7">
          <p className="eyebrow">学び帖 · Course index</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-5">
            <div>
              <h1 className="inkline font-brush text-4xl sm:text-5xl">学习路径</h1>
              <p className="font-scribble mt-1 text-lg text-muted-foreground">one page, one day</p>
            </div>
            <GlossaryButton className="h-auto border-0 bg-transparent px-0 py-1 text-sm text-muted-foreground shadow-none hover:bg-transparent hover:text-foreground">
              打开术语笺
            </GlossaryButton>
          </div>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-muted-foreground">
            主线是 175 天 N5→N2 课程；旁注用来补假名、词汇和专项弱项。先把 <GlossaryTerm termId="kana">假名</GlossaryTerm> 写稳，再进入{" "}
            <GlossaryTerm termId="particle">助词</GlossaryTerm> 与 <GlossaryTerm termId="conjugation">活用</GlossaryTerm>。
          </p>
        </header>

        <section className="paper-slip relative my-9 flex flex-col items-start justify-between gap-5 px-5 py-6 sm:flex-row sm:items-center sm:px-7" aria-labelledby="next-entry-title">
          <span className="paper-tape" aria-hidden="true" />
          <div>
            <p className="eyebrow">下一页 · Next</p>
            <h2 id="next-entry-title" className="mt-2 text-xl font-semibold">{learningEntry.title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{learningEntry.subtitle}</p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              依课表完成度与五维掌握度续写；既有五十音与词汇标记仍会保留。
            </p>
          </div>
          <Button asChild className="shrink-0">
            <Link href={learningEntry.href} data-testid="path-next-learning">{learningEntry.cta}</Link>
          </Button>
        </section>

        <section className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.45fr)_minmax(15rem,0.55fr)]" aria-label="课表与学习记录">
          <div className="min-w-0">
            <PathStarterLessons completedLessonIds={learning.completedLessonIds} activeLessonId={nextLesson?.id} />
          </div>

          <aside className="min-w-0 border-l border-border/45 pl-5 lg:sticky lg:top-28">
            <p className="eyebrow inkline">课表与掌握度</p>
            <div className="mt-3 border-y border-border/40">
              <Metric label="课表" value={`${satisfiedLessonCount}/${STARTER_LESSONS.length}`} />
              <Metric label="课表词" value={`${courseVocabCount}`} />
              <Metric label="生存词" value={`${vocabStats.survival.done}/${vocabStats.survival.total}`} />
              <Metric label="平均掌握" value={`${masterySummary.avg}%`} />
              <Metric label="输出能力" value={`${masterySummary.production}%`} />
              <Metric label="练习次数" value={`${masterySummary.attempts}`} />
            </div>
            <p className="mt-4 text-xs leading-6 text-muted-foreground">
              课表记日数，课表词记课程里出现的词条，生存词记已经认得的词。翻完一课，不等于已经写进记忆。
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
                          "ledger-row grid gap-4 border-b border-border/35 px-2 py-5 last:border-b-0 sm:grid-cols-[2rem_minmax(0,1fr)_auto] sm:items-start",
                          status === "locked" && "opacity-50",
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
