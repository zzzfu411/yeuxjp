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
    <div className="container py-6 px-4 mx-auto space-y-6 max-w-5xl mb-20">
      <div className="space-y-3 border-[3px] border-foreground bg-card p-5 shadow-hard">
        <h1 className="font-brush text-4xl tracking-tight">技能树</h1>
        <p className="text-muted-foreground max-w-3xl mx-auto">
          主线是 175 天 N5→N2 课程；技能树用来补假名、词汇和专项弱项。先把 <GlossaryTerm termId="kana">假名</GlossaryTerm> 打牢，再进入{" "}
          <GlossaryTerm termId="particle">助词</GlossaryTerm> 和 <GlossaryTerm termId="conjugation">活用</GlossaryTerm>。
        </p>
        <div className="flex items-center justify-center gap-2">
          <GlossaryButton className="h-auto px-3 py-2 border-[3px] border-foreground bg-card shadow-hard-sm hover:bg-primary">
            不懂术语？打开术语表
          </GlossaryButton>
        </div>
      </div>

      {/* Next recommended */}
      <div className="border-[3px] border-foreground bg-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-hard">
        <div className="space-y-1">
          <div className="text-xs font-semibold text-muted-foreground tracking-wider">下一步推荐</div>
          <div className="text-lg font-bold">{learningEntry.title}</div>
          <div className="text-sm text-muted-foreground">{learningEntry.subtitle}</div>
          <div className="text-xs text-muted-foreground pt-1">
            新路线优先按课程完成和五维掌握度推荐；旧的五十音/词汇标记继续作为兜底依据。
          </div>
        </div>
        <Button asChild>
          <Link href={learningEntry.href} data-testid="path-next-learning">{learningEntry.cta}</Link>
        </Button>
      </div>

      <section className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
        <PathStarterLessons completedLessonIds={learning.completedLessonIds} activeLessonId={nextLesson?.id} />

        <div className="border-[3px] border-foreground bg-card p-5 shadow-hard">
          <div className="text-xs font-semibold text-muted-foreground tracking-wider">课表与掌握度</div>
          <div className="mt-4 space-y-4">
            <Metric label="课表" value={`${satisfiedLessonCount}/${STARTER_LESSONS.length}`} />
            <Metric label="课表词" value={`${courseVocabCount}`} />
            <Metric label="生存词" value={`${vocabStats.survival.done}/${vocabStats.survival.total}`} />
            <Metric label="平均掌握" value={`${masterySummary.avg}%`} />
            <Metric label="输出能力" value={`${masterySummary.production}%`} />
            <Metric label="练习次数" value={`${masterySummary.attempts}`} />
          </div>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            课表看天数，课表词是 175 天里真正出现的词条数，生存词看记住了多少。点完课不等于这些词已经掌握。
          </p>
        </div>
      </section>

      {/* Skill groups */}
      {(Object.keys(SKILL_CATEGORY_LABEL) as SkillCategory[]).map((cat) => {
        const list = SKILL_TREE_BY_CATEGORY[cat]
        if (!list.length) return null
        return (
          <section key={cat} className="space-y-4">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                {SKILL_CATEGORY_LABEL[cat]}
              </h2>
              <div className="h-px bg-border flex-1" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {list.map((skill) => {
                const { status, badge } = getSkillStatus(skill.id, kanaStats, vocabStats, SKILL_TREE, course)
                const isRecommended = skill.id === nextSkillId

                return (
                  <div
                    key={skill.id}
                    className={cn(
                      "border-[3px] border-foreground bg-card p-5 shadow-hard flex flex-col gap-3",
                      status === "locked" && "opacity-60",
                      isRecommended && "bg-primary/40"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="text-lg font-bold">{skill.title}</div>
                        <div className="text-sm text-muted-foreground leading-relaxed">{skill.short}</div>
                      </div>
                      {badge && (
                        <div
                          className={cn(
                            "text-xs font-extrabold px-3 py-1 border-[2px] border-foreground whitespace-nowrap",
                            status === "done" && "bg-green-100 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-900/40 dark:text-green-300",
                            status === "in-progress" && "bg-accent/10 border-accent/30 text-accent",
                            status === "locked" && "bg-muted border-border text-muted-foreground",
                            status === "available" && "bg-secondary/40 border-border text-muted-foreground"
                          )}
                        >
                          {badge}
                        </div>
                      )}
                    </div>

                    {skill.prerequisites?.length ? (
                      <div className="text-xs text-muted-foreground">
                        前置：{skill.prerequisites.map((p, idx) => (
                          <span key={p}>
                            {idx > 0 ? "、" : ""}
                            {SKILL_TREE.find((s) => s.id === p)?.title ?? p}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <Button asChild variant="outline">
                        <Link href={skill.href}>{status === "locked" ? "查看内容" : "去学习"}</Link>
                      </Button>
                      {!!skill.glossary?.length && (
                        <GlossaryButton termId={skill.glossary[0]} className="h-auto px-2 py-1 rounded-md">
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
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-[2px] border-foreground bg-background px-4 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-lg font-bold">{value}</span>
    </div>
  )
}
