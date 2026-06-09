"use client"

import Link from "next/link"
import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { GlossaryButton, GlossaryTerm } from "@/components/ui/glossary"
import { cn } from "@/lib/utils"
import { kanaData } from "@/data/kana-data"
import { summarizeLearnedVocabIds } from "@/data/vocabulary/stats"
import { useKanaProgress } from "@/lib/kana-progress"
import { useVocabProgress } from "@/lib/vocab-progress"
import { SKILL_CATEGORY_LABEL, SKILL_TREE, SKILL_TREE_BY_CATEGORY, type SkillCategory } from "@/lib/skill-tree"
import { STARTER_LESSONS, getNextLesson } from "@/data/lessons"
import { useLearningProgress } from "@/lib/learning-progress"
import {
  getKanaSkillStats,
  getPathMasterySummary,
  getRecommendedSkillId,
  getSkillStatus,
} from "@/lib/path-page-model"
import { getLessonEntryBadge, getLessonEntryStatus, resolveLearningEntry } from "@/lib/learning-entry"

export default function SkillTreePage() {
  const { isMastered } = useKanaProgress()
  const { learned } = useVocabProgress()
  const learning = useLearningProgress()

  const kanaStats = useMemo(() => getKanaSkillStats(kanaData, isMastered), [isMastered])

  const vocabStats = useMemo(() => summarizeLearnedVocabIds(learned), [learned])

  const nextSkillId = useMemo(() => getRecommendedSkillId(kanaStats, vocabStats), [kanaStats, vocabStats])
  const recommendedSkill = useMemo(() => SKILL_TREE.find((s) => s.id === nextSkillId) ?? null, [nextSkillId])

  const nextLesson = useMemo(() => getNextLesson(learning.completedLessonIds), [learning.completedLessonIds])
  const learningEntry = useMemo(() => resolveLearningEntry({ nextLesson, skill: recommendedSkill }), [nextLesson, recommendedSkill])
  const masterySummary = useMemo(() => getPathMasterySummary(learning.items), [learning.items])

  return (
    <div className="container py-10 px-4 mx-auto space-y-10 max-w-5xl mb-20">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">技能树（学习路线）</h1>
        <p className="text-muted-foreground max-w-3xl mx-auto">
          按“能力”而不是按“章节”学习：先把 <GlossaryTerm termId="kana">假名</GlossaryTerm> 与读音打牢，再进入{" "}
          <GlossaryTerm termId="particle">助词</GlossaryTerm> 和 <GlossaryTerm termId="conjugation">活用</GlossaryTerm>，最后提升语感。
        </p>
        <div className="flex items-center justify-center gap-2">
          <GlossaryButton className="h-auto px-3 py-2 rounded-full border bg-background hover:bg-secondary/60">
            不懂术语？打开术语表
          </GlossaryButton>
        </div>
      </div>

      {/* Next recommended */}
      <div className="rounded-2xl border bg-muted/10 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-semibold text-muted-foreground tracking-wider">下一步推荐</div>
          <div className="text-lg font-bold">{learningEntry.title}</div>
          <div className="text-sm text-muted-foreground">{learningEntry.subtitle}</div>
          <div className="text-xs text-muted-foreground pt-1">
            新路线优先按课程完成和五维掌握度推荐；旧的五十音/词汇标记继续作为兜底依据。
          </div>
        </div>
        <Button asChild>
          <Link href={learningEntry.href}>{learningEntry.cta}</Link>
        </Button>
      </div>

      <section className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-muted-foreground tracking-wider">Starter 14 课程</div>
              <h2 className="mt-1 text-xl font-bold">从工具集合变成每日路线</h2>
            </div>
            <div className="text-sm font-semibold text-muted-foreground">{learning.completedLessonIds.size}/{STARTER_LESSONS.length}</div>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {STARTER_LESSONS.slice(0, 8).map((lesson) => {
              const status = getLessonEntryStatus(lesson, learning.completedLessonIds, nextLesson?.id)
              const done = status === "done"
              const active = status === "active"
              const locked = status === "locked"
              const cardContent = (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold">Day {lesson.order}</div>
                    <span className="rounded-full border bg-background px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                      {getLessonEntryBadge(status)}
                    </span>
                  </div>
                  <div className="mt-1 text-muted-foreground">{lesson.title.replace(/^Day \d+：/, "")}</div>
                </>
              )
              const className = cn(
                "rounded-xl border bg-background/70 p-3 text-sm transition hover:border-primary/50",
                done && "border-green-200 bg-green-50/70 dark:border-green-900/40 dark:bg-green-900/10",
                active && "border-primary/60 bg-primary/10",
                locked && "opacity-60 hover:border-border"
              )

              if (locked) {
                return (
                  <div key={lesson.id} aria-disabled="true" className={className}>
                    {cardContent}
                  </div>
                )
              }

              return (
                <Link key={lesson.id} href={`/learn/${lesson.id}`} className={className}>
                  {cardContent}
                </Link>
              )
            })}
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="text-xs font-semibold text-muted-foreground tracking-wider">五维掌握度</div>
          <div className="mt-4 space-y-4">
            <Metric label="平均掌握" value={`${masterySummary.avg}%`} />
            <Metric label="输出能力" value={`${masterySummary.production}%`} />
            <Metric label="练习次数" value={`${masterySummary.attempts}`} />
          </div>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            课程里的识别、听写、回忆、组句会逐步写入这里；只浏览内容不会虚增掌握度。
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
                const { status, badge } = getSkillStatus(skill.id, kanaStats, vocabStats)
                const isRecommended = skill.id === nextSkillId

                return (
                  <div
                    key={skill.id}
                    className={cn(
                      "rounded-2xl border bg-card p-5 shadow-sm flex flex-col gap-3",
                      status === "locked" && "opacity-60",
                      isRecommended && "border-primary/50 bg-primary/5"
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
                            "text-xs font-semibold px-3 py-1 rounded-full border whitespace-nowrap",
                            status === "done" && "bg-green-100 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-900/40 dark:text-green-300",
                            status === "in-progress" && "bg-primary/10 border-primary/20 text-primary",
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
                      <Button asChild variant="outline" className="rounded-full">
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
    <div className="flex items-center justify-between gap-3 rounded-xl border bg-background/70 px-4 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-lg font-bold">{value}</span>
    </div>
  )
}
