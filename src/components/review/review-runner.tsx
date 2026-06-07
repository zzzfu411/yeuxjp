"use client"

import { TodayReviewSession } from "@/components/review/today-review-session"
import { KanaReviewSession } from "@/components/review/kana-review-session"
import { VocabReviewSession } from "@/components/review/vocab-review-session"
import { MistakeReviewSession } from "@/components/review/mistake-review-session"
import { useMistakeNotebook, MISTAKE_SRS_STORAGE_KEY } from "@/lib/mistake-notebook"
import { useSrsDeck } from "@/lib/srs"
import { STORAGE_KEYS } from "@/lib/storage-keys"
import { useLearningProgress } from "@/lib/learning-progress"
import {
  type ReviewDeck,
  type TodayReviewItem,
} from "@/lib/review-questions"

const KANA_SRS_STORAGE_KEY = STORAGE_KEYS.SRS_KANA
const VOCAB_SRS_STORAGE_KEY = STORAGE_KEYS.SRS_VOCAB

export type ReviewSession =
  | { deck: ReviewDeck; ids: string[] }
  | { deck: "today"; items: TodayReviewItem[] }

export function ReviewRunner({
  session,
  onExit,
  notebook,
}: {
  session: ReviewSession
  onExit: () => void
  notebook: ReturnType<typeof useMistakeNotebook>
}) {
  if (session.deck === "today") return <TodayReview items={session.items} onExit={onExit} notebook={notebook} />
  if (session.deck === "kana") return <KanaReview ids={session.ids} onExit={onExit} notebook={notebook} />
  if (session.deck === "vocab") return <VocabReview ids={session.ids} onExit={onExit} notebook={notebook} />
  return <MistakeReview ids={session.ids} onExit={onExit} notebook={notebook} />
}

function TodayReview({
  items,
  onExit,
  notebook,
}: {
  items: TodayReviewItem[]
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
