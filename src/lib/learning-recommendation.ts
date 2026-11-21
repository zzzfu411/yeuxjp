"use client"

import { useMemo } from "react"
import { kanaData } from "@/data/kana-data"
import { STARTER_LESSONS, getNextLesson } from "@/data/lesson-catalog"
import { useLearningProfile } from "@/lib/learning-profile"
import { buildLearningRecommendationModel } from "@/lib/learning-recommendation-model"
import { useLearningStatusSnapshot } from "@/lib/learning-status-reader"
import { countSatisfiedLessons } from "@/lib/lesson-skip"
import { useStageDiagnostics } from "@/lib/use-stage-diagnostics"

export function useLearningRecommendation() {
  const learning = useLearningStatusSnapshot()
  const { profile } = useLearningProfile()
  const kanaLevel = profile?.kanaLevel
  const placement = useStageDiagnostics()
  const entryOrder = placement.entryOrder

  const nextLesson = useMemo(
    () => getNextLesson(learning.completedLessonIds, kanaLevel, entryOrder),
    [kanaLevel, learning.completedLessonIds, entryOrder]
  )
  const satisfiedLessonCount = useMemo(
    () => countSatisfiedLessons(STARTER_LESSONS, learning.completedLessonIds, kanaLevel, entryOrder),
    [kanaLevel, learning.completedLessonIds, entryOrder]
  )
  const course = useMemo(
    () => ({
      nextTrack: nextLesson?.track,
      allLessonsDone: !nextLesson,
      goal: profile?.goal,
      kanaLevel,
      entryOrder,
    }),
    [kanaLevel, nextLesson, profile?.goal, entryOrder]
  )
  const recommendation = useMemo(
    () =>
      buildLearningRecommendationModel({
        kana: kanaData,
        isKanaMastered: learning.isKanaMastered,
        learnedVocabIds: learning.learnedVocabIds,
        nextLesson,
        lessons: learning.lessons,
        entryOrder,
        goal: profile?.goal,
        kanaLevel,
      }),
    [kanaLevel, learning.isKanaMastered, learning.learnedVocabIds, learning.lessons, nextLesson, profile?.goal, entryOrder]
  )

  return {
    learning,
    nextLesson,
    satisfiedLessonCount,
    course,
    placement,
    ...recommendation,
  }
}
