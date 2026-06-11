"use client"

import { useCallback, useMemo } from "react"
import { useKanaProgress } from "@/lib/kana-progress"
import { useLearningProgress } from "@/lib/learning-progress"
import { useVocabProgress } from "@/lib/vocab-progress"
import { buildLearningStatusModel } from "@/lib/learning-status-model"

export function useLearningStatus() {
  const kanaProgress = useKanaProgress()
  const vocabProgress = useVocabProgress()
  const learning = useLearningProgress()

  const status = useMemo(() => {
    return buildLearningStatusModel({
      masteredKanaIds: kanaProgress.mastered,
      learnedVocabIds: vocabProgress.learned,
      items: learning.items,
    })
  }, [kanaProgress.mastered, learning.items, vocabProgress.learned])

  const isKanaMastered = useCallback(
    (id: string) => status.masteredKanaIds.has(id),
    [status.masteredKanaIds]
  )
  const isVocabLearned = useCallback(
    (id: string) => status.learnedVocabIds.has(id),
    [status.learnedVocabIds]
  )

  return {
    ...learning,
    masteredKanaIds: status.masteredKanaIds,
    learnedVocabIds: status.learnedVocabIds,
    isKanaMastered,
    isVocabLearned,
    toggleKanaMastered: kanaProgress.toggleMastered,
    clearKanaMastered: kanaProgress.clearMastered,
    toggleVocabLearned: vocabProgress.toggleLearnedId,
    clearVocabLearned: vocabProgress.clearLearned,
  }
}
