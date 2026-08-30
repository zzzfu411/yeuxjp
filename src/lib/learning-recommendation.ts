"use client"

import { useMemo } from "react"
import { kanaData } from "@/data/kana-data"
import { STARTER_LESSONS, getNextLesson } from "@/data/lessons"
import { useLearningProfile } from "@/lib/learning-progress"
import { buildLearningRecommendationModel } from "@/lib/learning-recommendation-model"
import { useLearningStatus } from "@/lib/learning-status"
import { countSatisfiedLessons } from "@/lib/lesson-skip"

export function useLearningRecommendation() {
  const learning = useLearningStatus()
  const { profile } = useLearningProfile()
  const kanaLevel = profile?.kanaLevel

  const nextLesson = useMemo(
    () => getNextLesson(learning.completedLessonIds, kanaLevel),
    [kanaLevel, learning.completedLessonIds]
  )
  const satisfiedLessonCount = useMemo(
    () => countSatisfiedLessons(STARTER_LESSONS, learning.completedLessonIds, kanaLevel),
    [kanaLevel, learning.completedLessonIds]
  )
  const course = useMemo(
    () => ({
      nextTrack: nextLesson?.track,
      allLessonsDone: !nextLesson,
      goal: profile?.goal,
      kanaLevel,
    }),
    [kanaLevel, nextLesson, profile?.goal]
  )
  const recommendation = useMemo(
    () =>
      buildLearningRecommendationModel({
        kana: kanaData,
        isKanaMastered: learning.isKanaMastered,
        learnedVocabIds: learning.learnedVocabIds,
        nextLesson,
        goal: profile?.goal,
        kanaLevel,
      }),
    [kanaLevel, learning.isKanaMastered, learning.learnedVocabIds, nextLesson, profile?.goal]
  )

  return {
    learning,
    nextLesson,
    satisfiedLessonCount,
    course,
    ...recommendation,
  }
}
