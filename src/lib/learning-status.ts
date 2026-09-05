"use client"

import { useCallback, useMemo } from "react"
import { useKanaProgress } from "@/lib/kana-progress"
import { useLearningProgress } from "@/lib/learning-progress"
import { useVocabProgress } from "@/lib/vocab-progress"
import { buildLearningStatusModel } from "@/lib/learning-status-model"
import { readLearningStatus } from "@/lib/learning-status-storage"

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
    (id: string) => {
      const latest = readLearningStatus()
      return latest.ok && kanaProgress.setMasteredId(id, !latest.masteredKanaIds.has(id))
    },
    [kanaProgress]
  )
  const clearKanaMastered = useCallback(
    () => kanaProgress.clearMastered(readLearningStatus().masteredKanaIds),
    [kanaProgress]
  )
  const toggleVocabLearned = useCallback(
    (id: string) => {
      const latest = readLearningStatus()
      return latest.ok && vocabProgress.setLearnedId(id, !latest.learnedVocabIds.has(id))
    },
    [vocabProgress]
  )
  const clearVocabLearned = useCallback(
    () => vocabProgress.clearLearned(readLearningStatus().learnedVocabIds),
    [vocabProgress]
  )

  return {
    ...learning,
    loaded: learning.loaded && kanaProgress.loaded && vocabProgress.loaded,
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
