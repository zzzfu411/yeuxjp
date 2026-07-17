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
      excludedKanaIds: kanaProgress.excluded,
      learnedVocabIds: vocabProgress.learned,
      excludedVocabIds: vocabProgress.excluded,
      items: learning.items,
    })
  }, [kanaProgress.excluded, kanaProgress.mastered, learning.items, vocabProgress.excluded, vocabProgress.learned])

  const isKanaMastered = useCallback(
    (id: string) => status.masteredKanaIds.has(id),
    [status.masteredKanaIds]
  )
  const isVocabLearned = useCallback(
    (id: string) => status.learnedVocabIds.has(id),
    [status.learnedVocabIds]
  )
  const toggleKanaMastered = useCallback(
    (id: string) => kanaProgress.setMasteredId(id, !status.masteredKanaIds.has(id)),
    [kanaProgress, status.masteredKanaIds]
  )
  const clearKanaMastered = useCallback(
    () => kanaProgress.clearMastered(status.masteredKanaIds),
    [kanaProgress, status.masteredKanaIds]
  )
  const toggleVocabLearned = useCallback(
    (id: string) => vocabProgress.setLearnedId(id, !status.learnedVocabIds.has(id)),
    [status.learnedVocabIds, vocabProgress]
  )
  const clearVocabLearned = useCallback(
    () => vocabProgress.clearLearned(status.learnedVocabIds),
    [status.learnedVocabIds, vocabProgress]
  )

  return {
    ...learning,
    masteredKanaIds: status.masteredKanaIds,
    learnedVocabIds: status.learnedVocabIds,
    isKanaMastered,
    isVocabLearned,
    toggleKanaMastered,
    clearKanaMastered,
    toggleVocabLearned,
    clearVocabLearned,
  }
}
