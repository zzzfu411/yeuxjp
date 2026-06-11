"use client"

import { useMemo } from "react"
import { kanaData } from "@/data/kana-data"
import { getNextLesson } from "@/data/lessons"
import { summarizeLearnedVocabIds } from "@/data/vocabulary/stats"
import { resolveLearningEntry } from "@/lib/learning-entry"
import { useLearningStatus } from "@/lib/learning-status"
import { getKanaSkillStats, getRecommendedSkillId } from "@/lib/path-page-model"
import { SKILL_TREE } from "@/lib/skill-tree"

export function useLearningRecommendation() {
  const learning = useLearningStatus()

  const kanaStats = useMemo(() => getKanaSkillStats(kanaData, learning.isKanaMastered), [learning.isKanaMastered])
  const vocabStats = useMemo(() => summarizeLearnedVocabIds(learning.learnedVocabIds), [learning.learnedVocabIds])
  const nextSkillId = useMemo(() => getRecommendedSkillId(kanaStats, vocabStats), [kanaStats, vocabStats])
  const recommendedSkill = useMemo(() => SKILL_TREE.find((skill) => skill.id === nextSkillId) ?? null, [nextSkillId])
  const nextLesson = useMemo(() => getNextLesson(learning.completedLessonIds), [learning.completedLessonIds])
  const learningEntry = useMemo(() => resolveLearningEntry({ nextLesson, skill: recommendedSkill }), [nextLesson, recommendedSkill])

  return {
    learning,
    kanaStats,
    vocabStats,
    nextSkillId,
    recommendedSkill,
    nextLesson,
    learningEntry,
  }
}
