"use client"

import { useMemo } from "react"
import { kanaData } from "@/data/kana-data"
import { getNextLesson } from "@/data/lessons"
import { buildLearningRecommendationModel } from "@/lib/learning-recommendation-model"
import { useLearningStatus } from "@/lib/learning-status"

export function useLearningRecommendation() {
  const learning = useLearningStatus()

  const nextLesson = useMemo(() => getNextLesson(learning.completedLessonIds), [learning.completedLessonIds])
  const recommendation = useMemo(
    () =>
      buildLearningRecommendationModel({
        kana: kanaData,
        isKanaMastered: learning.isKanaMastered,
        learnedVocabIds: learning.learnedVocabIds,
        nextLesson,
      }),
    [learning.isKanaMastered, learning.learnedVocabIds, nextLesson]
  )

  return {
    learning,
    nextLesson,
    ...recommendation,
  }
}
