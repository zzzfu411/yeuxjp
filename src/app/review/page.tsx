"use client"

import { useMemo, useState } from "react"
import { useKanaProgress } from "@/lib/kana-progress"
import { useVocabProgress } from "@/lib/vocab-progress"
import { useMistakeNotebook, MISTAKE_SRS_STORAGE_KEY } from "@/lib/mistake-notebook"
import { getNextSrsDueAt, useSrsDeck } from "@/lib/srs"
import { STORAGE_KEYS } from "@/lib/storage-keys"
import { ReviewRunner, type ReviewSession } from "@/components/review/review-runner"
import { ReviewDashboard } from "@/components/review/review-dashboard"
import {
  buildTodayReviewQueue,
  isReviewableKanaId,
  type TodayReviewItem,
} from "@/lib/review-questions"

const KANA_SRS_STORAGE_KEY = STORAGE_KEYS.SRS_KANA
const VOCAB_SRS_STORAGE_KEY = STORAGE_KEYS.SRS_VOCAB

export default function ReviewPage() {
  const { mastered } = useKanaProgress()
  const { learned } = useVocabProgress()
  const mistakes = useMistakeNotebook()

  const kanaSrs = useSrsDeck(KANA_SRS_STORAGE_KEY)
  const vocabSrs = useSrsDeck(VOCAB_SRS_STORAGE_KEY)
  const mistakeSrs = useSrsDeck(MISTAKE_SRS_STORAGE_KEY)

  const [session, setSession] = useState<ReviewSession | null>(null)

  const dueMistakeIds = useMemo(() => {
    return mistakeSrs.dueIds.filter((id) => mistakes.byId.has(id))
  }, [mistakeSrs.dueIds, mistakes.byId])

  const kanaEnrollMissing = useMemo(() => {
    const ids: string[] = []
    for (const id of mastered) {
      if (!kanaSrs.map[id]) ids.push(id)
    }
    return ids
  }, [kanaSrs.map, mastered])

  const vocabEnrollMissing = useMemo(() => {
    const ids: string[] = []
    for (const id of learned) {
      if (!vocabSrs.map[id]) ids.push(id)
    }
    return ids
  }, [learned, vocabSrs.map])

  const todayQueue = useMemo<TodayReviewItem[]>(() => {
    return buildTodayReviewQueue({
      dueMistakeIds,
      kanaDueIds: kanaSrs.dueIds,
      kanaSrsMap: kanaSrs.map,
      vocabDueIds: vocabSrs.dueIds,
      vocabSrsMap: vocabSrs.map,
    })
  }, [dueMistakeIds, kanaSrs.dueIds, kanaSrs.map, vocabSrs.dueIds, vocabSrs.map])

  const reviewableKanaDueIds = useMemo(() => {
    return kanaSrs.dueIds.filter(isReviewableKanaId)
  }, [kanaSrs.dueIds])

  if (session) {
    return <ReviewRunner session={session} onExit={() => setSession(null)} notebook={mistakes} />
  }

  const totalEnrolled =
    Object.keys(kanaSrs.map).length +
    Object.keys(vocabSrs.map).length +
    mistakes.list.length
  const totalDue =
    reviewableKanaDueIds.length + vocabSrs.dueIds.length + dueMistakeIds.length
  const isFirstTime = totalEnrolled === 0 && mastered.size === 0 && learned.size === 0
  const nextDueAt = getNextSrsDueAt([kanaSrs.map, vocabSrs.map, mistakeSrs.map])

  return (
    <ReviewDashboard
      isFirstTime={isFirstTime}
      totalDue={totalDue}
      totalEnrolled={totalEnrolled}
      nextDueAt={nextDueAt}
      todayQueueLength={todayQueue.length}
      counts={{
        mistakesDue: dueMistakeIds.length,
        kanaDue: reviewableKanaDueIds.length,
        vocabDue: vocabSrs.dueIds.length,
      }}
      kana={{
        due: reviewableKanaDueIds.length,
        total: Object.keys(kanaSrs.map).length,
        mastered: mastered.size,
        enrollMissing: kanaEnrollMissing.length,
        onStart: () => setSession({ deck: "kana", ids: reviewableKanaDueIds }),
        onEnrollMissing: () => kanaEnrollMissing.forEach((id) => kanaSrs.enroll(id)),
      }}
      vocab={{
        due: vocabSrs.dueIds.length,
        total: Object.keys(vocabSrs.map).length,
        learned: learned.size,
        enrollMissing: vocabEnrollMissing.length,
        onStart: () => setSession({ deck: "vocab", ids: vocabSrs.dueIds }),
        onEnrollMissing: () => vocabEnrollMissing.forEach((id) => vocabSrs.enroll(id)),
      }}
      mistakes={{
        due: dueMistakeIds.length,
        total: mistakes.list.length,
        recent: mistakes.list,
        onStart: () => setSession({ deck: "mistakes", ids: dueMistakeIds }),
        onClear: mistakes.clear,
        onRemove: mistakes.remove,
      }}
      onStartToday={() => setSession({ deck: "today", items: todayQueue })}
    />
  )
}
