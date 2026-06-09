"use client"

import Link from "next/link"
import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { kanaData } from "@/data/kana-data"
import { summarizeLearnedVocabIds } from "@/data/vocabulary/stats"
import { useKanaProgress } from "@/lib/kana-progress"
import { useVocabProgress } from "@/lib/vocab-progress"
import { SKILL_TREE } from "@/lib/skill-tree"
import { STARTER_LESSONS, getNextLesson } from "@/data/lessons"
import { useLearningProgress } from "@/lib/learning-progress"
import { resolveLearningEntry } from "@/lib/learning-entry"
import { getKanaSkillStats, getRecommendedSkillId } from "@/lib/path-page-model"

export function NextStepCard({ className }: { className?: string }) {
  const { isMastered } = useKanaProgress()
  const { learned } = useVocabProgress()
  const learning = useLearningProgress()

  const kanaStats = useMemo(() => getKanaSkillStats(kanaData, isMastered), [isMastered])

  const vocabStats = useMemo(() => summarizeLearnedVocabIds(learned), [learned])

  const nextSkillId = useMemo(() => getRecommendedSkillId(kanaStats, vocabStats), [kanaStats, vocabStats])

  const skill = useMemo(() => SKILL_TREE.find((s) => s.id === nextSkillId) ?? null, [nextSkillId])
  const nextLesson = useMemo(() => getNextLesson(learning.completedLessonIds), [learning.completedLessonIds])
  const entry = useMemo(() => resolveLearningEntry({ nextLesson, skill }), [nextLesson, skill])

  return (
    <div
      className={cn(
        "w-full rounded-2xl border bg-muted/10 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4",
        className
      )}
    >
      <div className="space-y-1">
        <div className="text-xs font-semibold text-muted-foreground tracking-wider">下一步推荐</div>
        <div className="text-lg font-bold">{entry.title}</div>
        <div className="text-sm text-muted-foreground">{entry.subtitle}</div>
        <div className="text-xs text-muted-foreground pt-1">
          已完成 Starter {learning.completedLessonIds.size}/{STARTER_LESSONS.length}。旧的五十音/词汇标记仍会作为兜底推荐依据。
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button asChild className="rounded-full">
          <Link href={entry.href}>{entry.cta}</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/path">打开技能树</Link>
        </Button>
      </div>
    </div>
  )
}
