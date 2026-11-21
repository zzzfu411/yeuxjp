"use client"

import Link from "next/link"
import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { GlossaryButton } from "@/components/ui/glossary"
import { cn } from "@/lib/utils"
import { PathStarterLessons } from "@/components/path/path-starter-lessons"
import { STARTER_LESSONS } from "@/data/lesson-catalog"
import { SKILL_CATEGORY_LABEL, SKILL_TREE, SKILL_TREE_BY_CATEGORY, type SkillCategory } from "@/lib/skill-tree"
import { useLearningRecommendation } from "@/lib/learning-recommendation"
import { countLessonItemIds } from "@/lib/lesson-item-coverage"
import { GoalPracticeSection } from "@/components/learning/goal-practice-section"
import { useLearningProfile } from "@/lib/learning-profile"
import {
  getPathMasterySummary,
  getSkillStatus,
} from "@/lib/path-page-model"

export function SkillTreePage() {
  const { profile, loaded: profileLoaded } = useLearningProfile()
  const { learning, kanaStats, vocabStats, nextSkillId, nextLesson, learningEntry, satisfiedLessonCount, course } = useLearningRecommendation()
  const completedCount = STARTER_LESSONS.filter(lesson => learning.completedLessonIds.has(lesson.id)).length
  const masterySummary = useMemo(() => getPathMasterySummary(learning.items), [learning.items])
  const courseVocabCount = useMemo(() => countLessonItemIds(STARTER_LESSONS, "vocab"), [])

  return (
    <div className="paper-wrap px-3 py-8 sm:px-5 sm:py-12">
      <article className="paper-sheet course-map-panel mx-auto mb-10 max-w-6xl px-5 py-6 sm:px-8 lg:px-12">
        <header className="border-b border-border/50 pb-7">
          <p className="eyebrow">35 个主题单元 · 175 课</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-5">
            <div>
              <h1 className="inkline font-brush text-4xl sm:text-5xl">学习路径</h1>
            </div>
          </div>
          <p className="mt-4 max-w-3xl text-base leading-8 text-muted-foreground">从当前一课开始，每个主题分五课慢慢学。已有基础，可以先找适合自己的起点。</p>
          <Link href="/placement" className="mt-3 inline-flex min-h-11 items-center text-base font-semibold underline underline-offset-4" data-testid="path-placement-link">已有基础？选择学习起点 →</Link>
        </header>

        <section className="paper-slip next-route-card relative my-6 flex flex-col items-start justify-between gap-4 px-5 py-5 sm:flex-row sm:items-center sm:px-7" aria-labelledby="next-entry-title">
          <div>
            <p className="eyebrow">{learningEntry.kind === "consolidation" ? "建议先巩固" : "下一步"}</p>
            <h2 id="next-entry-title" className="mt-2 text-xl font-semibold">{learningEntry.title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{learningEntry.subtitle}</p>
            {learningEntry.kind === "consolidation" && <p className="mt-2 text-sm leading-7 text-muted-foreground">先补齐本课测评，也可以从课程表继续下一课。</p>}
          </div>
          <Button asChild className="shrink-0">
            <Link href={learningEntry.href} data-testid="path-next-learning">{learningEntry.cta}</Link>
          </Button>
        </section>

        <section className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.45fr)_minmax(15rem,0.55fr)]" aria-label="课程与学习记录">
          <PathStarterLessons completedLessonIds={learning.completedLessonIds} activeLessonId={nextLesson?.id} lessons={learning.lessons} />

          <aside className="progress-panel min-w-0 border-l-4 border-l-[var(--signal-yellow)] bg-muted/35 p-5 lg:sticky lg:top-28">
            <p className="text-lg font-semibold">学习进度</p>
            <p className="mt-2 text-base leading-8">已完成 {completedCount}/{STARTER_LESSONS.length} 课{satisfiedLessonCount > completedCount && ` · 另跳过 ${satisfiedLessonCount - completedCount} 课`}</p>
            <details className="mt-3 border-t border-border/40 pt-3" data-testid="path-progress-details">
            <summary className="cursor-pointer text-sm font-semibold leading-7">查看能力记录与统计说明</summary>
            <div className="mt-3 border-y border-border/40">
              <Metric label="已完成课程" value={`${completedCount}/${STARTER_LESSONS.length}`} />
              {satisfiedLessonCount > completedCount && <Metric label="按基础跳过" value={`${satisfiedLessonCount - completedCount} 课`} />}
              <Metric label="课程词汇" value={`${courseVocabCount}`} />
              <Metric label="入门词汇" value={`${vocabStats.survival.done}/${vocabStats.survival.total}`} />
              <Metric label="已测能力均分" value={`${masterySummary.avg}%`} />
              <Metric label="独立输入表现" value={masterySummary.production === null ? "尚未测试" : `${masterySummary.production}%`} />
              {masterySummary.productionAttempts > 0 && <Metric label="独立输入样本" value={`${masterySummary.productionAttempts} 次 / ${masterySummary.productionItems} 个知识点`} />}
              <Metric label="练习次数" value={`${masterySummary.attempts}`} />
            </div>
            {masterySummary.unverifiedItems > 0 && <p className="mt-4 text-sm leading-7" data-testid="assessment-retest-notice">
              {masterySummary.unverifiedItems} 个知识点的部分旧测评分数需重新验证：相关旧题曾存在答案泄漏、固定选项或歧义。历史记录保留，能力均分只采用修订后的新作答；其他能力记录继续有效。
            </p>}
            <p className="mt-4 text-xs leading-6 text-muted-foreground">
              课程按实际完成数量计算，基础或诊断跳过单独列出。能力均分只计算有有效作答证据的题型，未测试的能力不算零分；手动标记和完成课程均不代表全面掌握。
              独立输入只统计未查看提示、需要自行组织答案的输出练习。选择题、词块组句、听写和无法区分作答形式的旧分数不计入，也不代表口语或开放表达能力。
            </p>
            </details>
          </aside>
        </section>

        <div className="mt-8 space-y-6">
          <GoalPracticeSection profile={profile} loaded={profileLoaded} />
          <details className="border-y border-border/50 py-5" data-testid="path-supplementary-practice">
          <summary className="cursor-pointer text-lg font-semibold">按薄弱项选练习</summary>
          <div className="mt-6 space-y-8">
          <GlossaryButton>打开术语表</GlossaryButton>
          <p className="border-y border-border py-4 text-sm leading-7 text-muted-foreground">下面是专项入口与建议顺序。假名、词卡的“已标记”来自学习标记或自评；语法的“当前阶段”表示路径位置。它们均不认证整项技能已掌握。实际读音检查、独立诊断和作品记录见 <Link href="/placement" className="underline underline-offset-4">阶段与学习起点</Link>。</p>
          {(Object.keys(SKILL_CATEGORY_LABEL) as SkillCategory[]).map((cat) => {
            const list = SKILL_TREE_BY_CATEGORY[cat]
            if (!list.length) return null
            return (
              <section key={cat} aria-labelledby={`skill-group-${cat}`}>
                <div className="mb-3 flex items-baseline gap-3">
                  <h2 id={`skill-group-${cat}`} className="text-base font-semibold">{SKILL_CATEGORY_LABEL[cat]}</h2>
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
          </details>
          <p className="text-sm leading-7 text-muted-foreground">N5–N2 是本项目的教学分区，不代表完整官方考纲或达标保证。<Link href="/placement" className="underline underline-offset-4">查看各阶段覆盖与能力边界</Link>。</p>
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
