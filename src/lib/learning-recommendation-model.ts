import type { Kana } from "@/data/kana-data"
import { summarizeLearnedVocabIds } from "@/data/vocabulary/stats"
import { resolveLearningEntry, type LearningEntry, type LearningEntryLesson } from "@/lib/learning-entry"
import {
  findSkillNode,
  getKanaSkillStats,
  getRecommendedSkillId,
  type PathKanaStats,
  type PathVocabStats,
} from "@/lib/path-page-model"
import type { SkillId, SkillNode } from "@/lib/skill-tree"

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
}: {
  kana: readonly Kana[]
  isKanaMastered: (romaji: string) => boolean
  learnedVocabIds: Iterable<string>
  nextLesson: LearningEntryLesson | null
  skillTree?: readonly SkillNode[]
}): LearningRecommendationModel {
  const kanaStats = getKanaSkillStats(kana, isKanaMastered)
  const vocabStats = summarizeLearnedVocabIds(learnedVocabIds)
  const nextSkillId = getRecommendedSkillId(kanaStats, vocabStats)
  const recommendedSkill = findSkillNode(nextSkillId, skillTree)

  return {
    kanaStats,
    vocabStats,
    nextSkillId,
    recommendedSkill,
    learningEntry: resolveLearningEntry({ nextLesson, skill: recommendedSkill }),
  }
}
