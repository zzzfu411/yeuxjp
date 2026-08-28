import { isKnownVocabularyId } from "@/data/vocabulary/id-registry"
import { runLearningStorageTransaction } from "@/lib/learning-store"
import type { useLearningProgress } from "@/lib/learning-progress"
import { gradeSrs, type SrsResult } from "@/lib/srs"
import { STORAGE_KEYS } from "@/lib/storage-keys"

export type VocabularySelfAssessment = "again" | "hard" | "good"

export type VocabularySelfAssessmentOption = {
  id: VocabularySelfAssessment
  label: string
  feedback: string
  correct: boolean
  srsResult: SrsResult
}

export const VOCABULARY_SELF_ASSESSMENT_OPTIONS: readonly VocabularySelfAssessmentOption[] = [
  {
    id: "again",
    label: "忘记了",
    feedback: "已记录：忘记了，将立即进入复习。",
    correct: false,
    srsResult: "again",
  },
  {
    id: "hard",
    label: "模糊",
    feedback: "已记录：有些模糊，将缩短下一次复习间隔。",
    correct: false,
    srsResult: "hard",
  },
  {
    id: "good",
    label: "记得",
    feedback: "已记录：记得，将延长下一次复习间隔。",
    correct: true,
    srsResult: "good",
  },
]

export function getVocabularySelfAssessmentOption(rating: VocabularySelfAssessment) {
  return VOCABULARY_SELF_ASSESSMENT_OPTIONS.find((option) => option.id === rating)!
}

type LearningProgressApi = Pick<ReturnType<typeof useLearningProgress>, "recordPractice">

export function recordVocabularySelfAssessment({
  progress,
  itemId,
  rating,
}: {
  progress: LearningProgressApi
  itemId: string
  rating: VocabularySelfAssessment
}) {
  if (!isKnownVocabularyId(itemId)) return false
  const option = getVocabularySelfAssessmentOption(rating)

  return runLearningStorageTransaction(() => {
    return progress.recordPractice({
      itemId,
      itemType: "vocab",
      mode: "meaning",
      correct: option.correct,
      answer: rating,
    }) && gradeSrs(STORAGE_KEYS.SRS_VOCAB, itemId, option.srsResult)
  })
}
