"use client"

import { useLearningProgress } from "@/lib/learning-progress"
import { useLearningStatusWithProgress } from "@/lib/learning-status-reader"

export function useLearningStatus() {
  const learning = useLearningProgress()
  return useLearningStatusWithProgress(learning)
}
