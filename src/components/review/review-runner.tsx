"use client"

import dynamic from "next/dynamic"
import { useMistakeNotebook, MISTAKE_SRS_STORAGE_KEY } from "@/lib/mistake-notebook"
import { useSrsDeck } from "@/lib/srs"
import { STORAGE_KEYS } from "@/lib/storage-keys"
import { useLearningProgress } from "@/lib/learning-progress"
import type { ReviewSession } from "@/lib/review-session"
import type { TodayReviewItem } from "@/lib/review-questions"

export type { ReviewSession } from "@/lib/review-session"

const KANA_SRS_STORAGE_KEY = STORAGE_KEYS.SRS_KANA
const VOCAB_SRS_STORAGE_KEY = STORAGE_KEYS.SRS_VOCAB

function ReviewSessionLoading() {
  return (
    <div className="container py-20 px-4 mx-auto max-w-lg text-center font-scribble text-muted-foreground">
      正在加载复习...
    </div>
  )
}

const TodayReviewSession = dynamic(
  () => import("@/components/review/today-review-session").then((mod) => mod.TodayReviewSession),
  { ssr: false, loading: ReviewSessionLoading }
)

const KanaReviewSession = dynamic(
  () => import("@/components/review/kana-review-session").then((mod) => mod.KanaReviewSession),
  { ssr: false, loading: ReviewSessionLoading }
)

const VocabReviewSession = dynamic(
  () => import("@/components/review/vocab-review-session").then((mod) => mod.VocabReviewSession),
  { ssr: false, loading: ReviewSessionLoading }
)

const MistakeReviewSession = dynamic(
  () => import("@/components/review/mistake-review-session").then((mod) => mod.MistakeReviewSession),
  { ssr: false, loading: ReviewSessionLoading }
)

export function ReviewRunner({
  session,
  onExit,
  notebook,
}: {
  session: ReviewSession
  onExit: () => void
  notebook: ReturnType<typeof useMistakeNotebook>
}) {
  if (session.deck === "today") {
    return (
      <TodayReview
        items={session.items}
        remainingDueAfterBatch={session.remainingDueAfterBatch}
        onExit={onExit}
        notebook={notebook}
      />
    )
  }
  if (session.deck === "kana") return <KanaReview ids={session.ids} onExit={onExit} notebook={notebook} />
  if (session.deck === "vocab") return <VocabReview ids={session.ids} onExit={onExit} notebook={notebook} />
  return <MistakeReview ids={session.ids} onExit={onExit} notebook={notebook} />
}

function TodayReview({
  items,
  remainingDueAfterBatch,
  onExit,
  notebook,
}: {
  items: TodayReviewItem[]
  remainingDueAfterBatch: number
  onExit: () => void
  notebook: ReturnType<typeof useMistakeNotebook>
}) {
  const kanaSrs = useSrsDeck(KANA_SRS_STORAGE_KEY)
  const vocabSrs = useSrsDeck(VOCAB_SRS_STORAGE_KEY)
  const mistakeSrs = useSrsDeck(MISTAKE_SRS_STORAGE_KEY)
  const learning = useLearningProgress()
  return (
    <TodayReviewSession
      items={items}
      remainingDueAfterBatch={remainingDueAfterBatch}
      onExit={onExit}
      notebook={notebook}
      learning={learning}
      kanaSrs={kanaSrs}
      vocabSrs={vocabSrs}
      mistakeSrs={mistakeSrs}
    />
  )
}

function KanaReview({
  ids,
  onExit,
  notebook,
}: {
  ids: string[]
  onExit: () => void
  notebook: ReturnType<typeof useMistakeNotebook>
}) {
  const srs = useSrsDeck(KANA_SRS_STORAGE_KEY)
  const learning = useLearningProgress()
  return <KanaReviewSession ids={ids} onExit={onExit} notebook={notebook} learning={learning} srs={srs} />
}

function VocabReview({
  ids,
  onExit,
  notebook,
}: {
  ids: string[]
  onExit: () => void
  notebook: ReturnType<typeof useMistakeNotebook>
}) {
  const srs = useSrsDeck(VOCAB_SRS_STORAGE_KEY)
  const learning = useLearningProgress()
  return <VocabReviewSession ids={ids} onExit={onExit} notebook={notebook} learning={learning} srs={srs} />
}

function MistakeReview({
  ids,
  onExit,
  notebook,
}: {
  ids: string[]
  onExit: () => void
  notebook: ReturnType<typeof useMistakeNotebook>
}) {
  const srs = useSrsDeck(MISTAKE_SRS_STORAGE_KEY)
  const learning = useLearningProgress()
  return <MistakeReviewSession ids={ids} onExit={onExit} notebook={notebook} learning={learning} srs={srs} />
}
