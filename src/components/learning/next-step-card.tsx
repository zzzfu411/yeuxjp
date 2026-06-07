"use client"

import Link from "next/link"
import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { kanaData } from "@/data/kana-data"
import { vocabByLevel } from "@/data/vocabulary"
import { useKanaProgress } from "@/lib/kana-progress"
import { useVocabProgress } from "@/lib/vocab-progress"
import { SKILL_TREE, type SkillId } from "@/lib/skill-tree"
import { STARTER_LESSONS, getNextLesson } from "@/data/lessons"
import { useLearningProgress } from "@/lib/learning-progress"

function ratio(done: number, total: number) {
  return total ? done / total : 0
}

export function NextStepCard({ className }: { className?: string }) {
  const { isMastered } = useKanaProgress()
  const { isLearnedId } = useVocabProgress()
  const learning = useLearningProgress()

  const kanaStats = useMemo(() => {
    const seion = kanaData.filter((k) => k.type === "seion")
    const dakuon = kanaData.filter((k) => k.type === "dakuon" || k.type === "handakuon")
    const yoon = kanaData.filter((k) => k.type === "yoon")
    const special = kanaData.filter((k) => k.type === "special")

    const stat = (list: typeof kanaData) => {
      const total = list.length
      const done = list.reduce((acc, k) => acc + (isMastered(k.romaji) ? 1 : 0), 0)
      return { total, done, ratio: ratio(done, total) }
    }

    return {
      seion: stat(seion),
      dakuon: stat(dakuon),
      yoon: stat(yoon),
      special: stat(special),
    }
  }, [isMastered])

  const survivalRatio = useMemo(() => {
    const total = vocabByLevel.survival.length
    const done = vocabByLevel.survival.reduce((acc, v) => acc + (isLearnedId(v.id) ? 1 : 0), 0)
    return ratio(done, total)
  }, [isLearnedId])

  const nextSkillId = useMemo<SkillId>(() => {
    if (kanaStats.seion.ratio < 0.7) return "kana-seion"
    if (kanaStats.dakuon.ratio < 0.35) return "kana-dakuon"
    if (kanaStats.yoon.ratio < 0.35) return "kana-yoon"
    if (kanaStats.special.ratio < 0.5) return "kana-sokuon"
    if (survivalRatio < 0.25) return "vocab-survival"
    return "particles-basic"
  }, [kanaStats.dakuon.ratio, kanaStats.seion.ratio, kanaStats.special.ratio, kanaStats.yoon.ratio, survivalRatio])

  const skill = useMemo(() => SKILL_TREE.find((s) => s.id === nextSkillId) ?? null, [nextSkillId])
  const nextLesson = useMemo(() => getNextLesson(learning.completedLessonIds), [learning.completedLessonIds])
  if (!skill) return null

  return (
    <div
      className={cn(
        "w-full rounded-2xl border bg-muted/10 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4",
        className
      )}
    >
      <div className="space-y-1">
        <div className="text-xs font-semibold text-muted-foreground tracking-wider">下一步推荐</div>
        <div className="text-lg font-bold">{nextLesson?.title ?? skill.title}</div>
        <div className="text-sm text-muted-foreground">{nextLesson?.subtitle ?? skill.short}</div>
        <div className="text-xs text-muted-foreground pt-1">
          已完成 Starter {learning.completedLessonIds.size}/{STARTER_LESSONS.length}。旧的五十音/词汇标记仍会作为兜底推荐依据。
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button asChild className="rounded-full">
          <Link href={nextLesson ? `/learn/${nextLesson.id}` : skill.href}>开始下一步练习</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/path">打开技能树</Link>
        </Button>
      </div>
    </div>
  )
}
