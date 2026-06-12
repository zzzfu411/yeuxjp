"use client"

import { useMemo, useState } from "react"
import { useMistakeNotebook, MISTAKE_SRS_STORAGE_KEY } from "@/lib/mistake-notebook"
import { useSrsDeck } from "@/lib/srs"
import { STORAGE_KEYS } from "@/lib/storage-keys"
import { ReviewRunner, type ReviewSession } from "@/components/review/review-runner"
import { ReviewDashboard } from "@/components/review/review-dashboard"
import { buildReviewDashboardModel, enrollMissingReviewItems } from "@/lib/review-dashboard-model"
import { useLearningStatus } from "@/lib/learning-status"

const KANA_SRS_STORAGE_KEY = STORAGE_KEYS.SRS_KANA
const VOCAB_SRS_STORAGE_KEY = STORAGE_KEYS.SRS_VOCAB

export function ReviewPage() {
  const learning = useLearningStatus()
  const mistakes = useMistakeNotebook()

  const kanaSrs = useSrsDeck(KANA_SRS_STORAGE_KEY)
  const vocabSrs = useSrsDeck(VOCAB_SRS_STORAGE_KEY)
  const mistakeSrs = useSrsDeck(MISTAKE_SRS_STORAGE_KEY)

  const [session, setSession] = useState<ReviewSession | null>(null)
  const [reviewSaveError, setReviewSaveError] = useState(false)

  const dashboard = useMemo(() => {
    return buildReviewDashboardModel({
      masteredIds: learning.masteredKanaIds,
      learnedIds: learning.learnedVocabIds,
      items: learning.items,
      mistakeIds: mistakes.byId.keys(),
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

  const startSession = (nextSession: ReviewSession) => {
    setReviewSaveError(false)
    setSession(nextSession)
  }
  const enrollKanaMissing = () => setReviewSaveError(!enrollMissingReviewItems(dashboard.kanaEnrollMissing, kanaSrs.enroll))
  const enrollVocabMissing = () => setReviewSaveError(!enrollMissingReviewItems(dashboard.vocabEnrollMissing, vocabSrs.enroll))
  const enrollMistakeMissing = () => setReviewSaveError(!enrollMissingReviewItems(dashboard.mistakeEnrollMissing, (id) => mistakeSrs.grade(id, "again")))
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
      onStartToday={() => startSession({ deck: "today", items: dashboard.todayQueue })}
    />
  )
}
