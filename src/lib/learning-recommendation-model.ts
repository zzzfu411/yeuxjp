import type { Kana } from "@/data/kana-data"
import { summarizeLearnedVocabIds } from "@/data/vocabulary/stats"
import { resolveLearningEntry, type LearningEntry, type LearningEntryLesson } from "@/lib/learning-entry"
import {
  findSkillNode,
  getKanaSkillStats,
  getRecommendedSkillId,
  type CourseRecommendationHint,
  type PathKanaStats,
  type PathVocabStats,
} from "@/lib/path-page-model"
import type { SkillId, SkillNode } from "@/lib/skill-tree"
import { getRecommendedConsolidation } from "@/lib/lesson-consolidation"
import type { LessonProgressMap } from "@/lib/learning-progress-types"

export interface LearningRecommendationModel {
  kanaStats: PathKanaStats
  vocabStats: PathVocabStats
  nextSkillId: SkillId
  recommendedSkill: SkillNode | null
  learningEntry: LearningEntry
}

export function buildLearningRecommendationModel({
  kana,
  isKanaMastered,
  learnedVocabIds,
  nextLesson,
  skillTree,
  goal,
  kanaLevel,
  lessons = {},
  entryOrder = 1,
}: {
  kana: readonly Kana[]
  isKanaMastered: (romaji: string) => boolean
  learnedVocabIds: Iterable<string>
  nextLesson: LearningEntryLesson | null
  skillTree?: readonly SkillNode[]
  goal?: CourseRecommendationHint["goal"]
  kanaLevel?: CourseRecommendationHint["kanaLevel"]
  lessons?: LessonProgressMap
  entryOrder?: number
}): LearningRecommendationModel {
  const kanaStats = getKanaSkillStats(kana, isKanaMastered)
  const vocabStats = summarizeLearnedVocabIds(learnedVocabIds)
  const nextSkillId = getRecommendedSkillId(kanaStats, vocabStats, {
    nextTrack: nextLesson?.track,
    allLessonsDone: !nextLesson,
    goal,
    kanaLevel,
    entryOrder,
  })
  const recommendedSkill = findSkillNode(nextSkillId, skillTree)

  return {
    kanaStats,
    vocabStats,
    nextSkillId,
    recommendedSkill,
    learningEntry: resolveLearningEntry({ nextLesson, skill: recommendedSkill, consolidation: getRecommendedConsolidation(lessons, entryOrder) }),
  }
}
