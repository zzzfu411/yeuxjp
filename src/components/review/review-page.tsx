"use client"

import { useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { useMistakeNotebook, MISTAKE_SRS_STORAGE_KEY } from "@/lib/mistake-notebook"
import { useSrsDeck } from "@/lib/srs"
import { STORAGE_KEYS } from "@/lib/storage-keys"
import { ReviewDashboard } from "@/components/review/review-dashboard"
import { buildReviewDashboardModel, enrollMissingReviewItems } from "@/lib/review-dashboard-model"
import { useLearningStatus } from "@/lib/learning-status"
import { runLearningStorageTransaction } from "@/lib/learning-store"
import type { ReviewSession } from "@/lib/review-session"

const KANA_SRS_STORAGE_KEY = STORAGE_KEYS.SRS_KANA
const VOCAB_SRS_STORAGE_KEY = STORAGE_KEYS.SRS_VOCAB

const ReviewRunner = dynamic(
  () => import("@/components/review/review-runner").then((mod) => mod.ReviewRunner),
  {
    ssr: false,
    loading: () => (
      <div className="flex justify-center py-20 text-muted-foreground">
        正在加载复习...
      </div>
    ),
  }
)

export function ReviewPage() {
  const learning = useLearningStatus()
  const mistakes = useMistakeNotebook()

  const kanaSrs = useSrsDeck(KANA_SRS_STORAGE_KEY)
  const vocabSrs = useSrsDeck(VOCAB_SRS_STORAGE_KEY)
  const mistakeSrs = useSrsDeck(MISTAKE_SRS_STORAGE_KEY)

  const [session, setSession] = useState<ReviewSession | null>(null)
  const [reviewSaveError, setReviewSaveError] = useState(false)
  const loaded = learning.loaded && mistakes.loaded && kanaSrs.loaded && vocabSrs.loaded && mistakeSrs.loaded

  const dashboard = useMemo(() => {
    return buildReviewDashboardModel({
      masteredIds: learning.masteredKanaIds,
      learnedIds: learning.learnedVocabIds,
      items: learning.items,
      mistakeIds: mistakes.byId.keys(),
      mistakeItems: mistakes.list,
      kanaSrsMap: kanaSrs.map,
      kanaDueIds: kanaSrs.dueIds,
      vocabSrsMap: vocabSrs.map,
      vocabDueIds: vocabSrs.dueIds,
      mistakeSrsMap: mistakeSrs.map,
      mistakeDueIds: mistakeSrs.dueIds,
    })
  }, [
    learning.masteredKanaIds,
    learning.learnedVocabIds,
    learning.items,
    mistakes.byId,
    mistakes.list,
    kanaSrs.map,
    kanaSrs.dueIds,
    vocabSrs.map,
    vocabSrs.dueIds,
    mistakeSrs.map,
    mistakeSrs.dueIds,
  ])

  if (session) {
    return <ReviewRunner session={session} onExit={() => setSession(null)} notebook={mistakes} />
  }

  if (!loaded) {
    return (
      <div className="flex justify-center py-20 text-muted-foreground" role="status">
        正在加载复习...
      </div>
    )
  }

  const startSession = (nextSession: ReviewSession) => {
    setReviewSaveError(false)
    setSession(nextSession)
  }
  const enrollKanaMissing = () => setReviewSaveError(!runLearningStorageTransaction(() => enrollMissingReviewItems(dashboard.kanaEnrollMissing, kanaSrs.enroll)))
  const enrollVocabMissing = () => setReviewSaveError(!runLearningStorageTransaction(() => enrollMissingReviewItems(dashboard.vocabEnrollMissing, vocabSrs.enroll)))
  const enrollMistakeMissing = () => setReviewSaveError(!runLearningStorageTransaction(() => enrollMissingReviewItems(dashboard.mistakeEnrollMissing, mistakeSrs.enroll)))
  const removeMistake = (id: string) => setReviewSaveError(!mistakes.remove(id))
  const clearMistakes = () => setReviewSaveError(!mistakes.clear())

  return (
    <ReviewDashboard
      isFirstTime={dashboard.isFirstTime}
      totalDue={dashboard.totalDue}
      totalEnrolled={dashboard.totalEnrolled}
      nextDueAt={dashboard.nextDueAt}
      todayQueueLength={dashboard.todayQueue.length}
      counts={dashboard.counts}
      mistakeKindDueLabel={dashboard.mistakeKindDueLabel}
      kana={{
        due: dashboard.counts.kanaDue,
        total: dashboard.totals.kana,
        mastered: dashboard.totals.mastered,
        enrollMissing: dashboard.kanaEnrollMissing.length,
        onStart: () => startSession({ deck: "kana", ids: dashboard.reviewableKanaDueIds }),
        onEnrollMissing: enrollKanaMissing,
      }}
      vocab={{
        due: dashboard.counts.vocabDue,
        total: dashboard.totals.vocab,
        learned: dashboard.totals.learned,
        enrollMissing: dashboard.vocabEnrollMissing.length,
        onStart: () => startSession({ deck: "vocab", ids: dashboard.vocabDueIds }),
        onEnrollMissing: enrollVocabMissing,
      }}
      mistakes={{
        due: dashboard.counts.mistakesDue,
        total: dashboard.totals.mistakes,
        enrollMissing: dashboard.mistakeEnrollMissing.length,
        recent: mistakes.list,
        saveError: reviewSaveError,
        onStart: () => startSession({ deck: "mistakes", ids: dashboard.dueMistakeIds }),
        onEnrollMissing: enrollMistakeMissing,
        onClear: clearMistakes,
        onRemove: removeMistake,
      }}
      onStartToday={() => startSession({
        deck: "today",
        items: dashboard.todayQueue,
        remainingDueAfterBatch: Math.max(0, dashboard.totalDue - dashboard.todayQueue.length),
      })}
    />
  )
}
