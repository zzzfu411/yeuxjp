"use client"

import { runLearningWrite } from "@/lib/learning-write-lock"

import { useMemo, useState } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { useSearchParams } from "next/navigation"
import { useMistakeNotebook, MISTAKE_SRS_STORAGE_KEY } from "@/lib/mistake-notebook"
import { useSrsDeck } from "@/lib/srs"
import { STORAGE_KEYS } from "@/lib/storage-keys"
import { ReviewDashboard } from "@/components/review/review-dashboard"
import { buildReviewDashboardModel, enrollMissingReviewItems } from "@/lib/review-dashboard-model"
import { useLearningStatus } from "@/lib/learning-status"
import { runLearningStorageTransaction } from "@/lib/learning-storage-transaction"
import type { ReviewSession } from "@/lib/review-session"
import { useKnowledgeReviews } from "@/lib/use-knowledge-reviews"
import { Button } from "@/components/ui/button"
import { KanjiReviewNotice } from "@/components/review/kanji-review-notice"

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
  const search = useSearchParams()
  const rawLimit = search.get("limit") ?? ""
  const limit = /^[1-9]\d?$/.test(rawLimit) ? Math.min(30, Number(rawLimit)) : 30
  const learning = useLearningStatus()
  const mistakes = useMistakeNotebook()
  const knowledge = useKnowledgeReviews()

  const kanaSrs = useSrsDeck(KANA_SRS_STORAGE_KEY)
  const vocabSrs = useSrsDeck(VOCAB_SRS_STORAGE_KEY)
  const mistakeSrs = useSrsDeck(MISTAKE_SRS_STORAGE_KEY)

  const [session, setSession] = useState<ReviewSession | null>(null)
  const [reviewSaveError, setReviewSaveError] = useState(false)
  const loaded = learning.loaded && mistakes.loaded && kanaSrs.loaded && vocabSrs.loaded && mistakeSrs.loaded && knowledge.loaded

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
      knowledgeSrsMap: knowledge.map,
      knowledgeDueIds: knowledge.dueIds,
    })
  }, [
    knowledge.map,
    knowledge.dueIds,
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
  const todayQueue = dashboard.todayQueue.slice(0, limit)

  if (session) {
    return <ReviewRunner session={session} onExit={() => setSession(null)} notebook={mistakes} />
  }

  const startSession = (nextSession: ReviewSession) => {
    if (!loaded) return
    setReviewSaveError(false)
    setSession(nextSession)
  }
  const enrollKanaMissing = async () => setReviewSaveError(!await runLearningWrite(() => runLearningStorageTransaction(() => enrollMissingReviewItems(dashboard.kanaEnrollMissing, kanaSrs.enroll))))
  const enrollVocabMissing = async () => setReviewSaveError(!await runLearningWrite(() => runLearningStorageTransaction(() => enrollMissingReviewItems(dashboard.vocabEnrollMissing, vocabSrs.enroll))))
  const enrollMistakeMissing = async () => setReviewSaveError(!await runLearningWrite(() => runLearningStorageTransaction(() => enrollMissingReviewItems(dashboard.mistakeEnrollMissing, mistakeSrs.enroll))))
  const removeMistake = async (id: string) => setReviewSaveError(!await runLearningWrite(() => mistakes.remove(id)))
  const clearMistakes = async () => setReviewSaveError(!await runLearningWrite(() => mistakes.clear()))

  return (
    <>
      {!loaded ? (
        <div className="flex justify-center py-20 text-muted-foreground" role="status">
          正在加载复习...
        </div>
      ) : null}
      <div hidden={!loaded}>
    {limit < 30 && <p className="paper-wrap py-4 text-sm" data-testid="review-budget-notice">来自今日安排：本轮今日复习最多 {limit} 题，其他到期内容保留到下一轮。</p>}
    <ReviewDashboard
      isFirstTime={dashboard.isFirstTime}
      totalDue={dashboard.totalDue}
      totalEnrolled={dashboard.totalEnrolled}
      nextDueAt={dashboard.nextDueAt}
      todayQueueLength={todayQueue.length}
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
        items: todayQueue,
        remainingDueAfterBatch: Math.max(0, dashboard.totalDue - todayQueue.length),
        singlePass: /^[1-9]\d?$/.test(rawLimit),
      })}
    />
      <section id="knowledge-review-deck" className="paper-wrap mb-10 scroll-mt-28" aria-label="语法与句子间隔复习" data-testid="knowledge-review-deck">
        <h2 className="text-2xl font-semibold">语法与句子巩固</h2>
        {knowledge.error && <p role="alert" className="my-3 text-destructive">复习记录无法读取，已暂停写入以保护原始数据。请在学习数据面板检查或恢复备份。</p>}
        <p className="my-3 text-base leading-8 text-muted-foreground">独立答对的语法和句子也会安排复习。当前 {knowledge.cards.size} 题，{knowledge.dueIds.length} 题到期；已包含在今日复习中。</p>
        <Button disabled={!knowledge.dueIds.length} onClick={() => startSession({ deck: "knowledge", ids: knowledge.dueIds })} data-testid="knowledge-review-start">复习到期语法与句子</Button>
        {knowledge.cards.size > 0 && <details className="mt-5">
          <summary className="cursor-pointer text-base font-semibold">查看已安排的题目与时间</summary>
          <ul className="mt-3 max-h-96 space-y-3 overflow-auto">{[...knowledge.cards.values()].sort((a, b) => a.srs.dueAt - b.srs.dueAt).map(card => <li key={card.id} className="border-t border-border py-3 text-sm leading-7">
            <p className="whitespace-pre-line">{card.question.questionText ?? "听音练习"}</p>
            <p className="text-muted-foreground">下次复习：{new Date(card.srs.dueAt).toLocaleString("zh-CN")} · 复习答对 {card.srs.right} 次 / 答错 {card.srs.wrong} 次</p>
          </li>)}</ul>
        </details>}
        {knowledge.retiredCount > 0 && <p className="mt-3 text-sm leading-7">另有 {knowledge.retiredCount} 道旧版题目已暂停复习，原始记录保留。请返回对应课程补学新版内容。</p>}
      </section>
      <div className="paper-wrap"><KanjiReviewNotice /></div>
      {mistakes.retired.length > 0 && <details className="paper-wrap mb-10" data-testid="retired-mistakes">
        <summary className="cursor-pointer text-base font-semibold">已停用的旧题记录（{mistakes.retired.length}）</summary>
        <p className="my-3 text-sm leading-7 text-muted-foreground">这些旧题已修订、存在歧义或不再适用，已退出今日复习。原始作答和复习记录仍保留在本地及备份中。</p>
        <ul className="space-y-4">
          {mistakes.retired.map(({ item, reason, href }) => <li key={item.id} className="border-t border-border pt-3 text-sm leading-7">
            <p>{item.questionText || item.questionAudio || "旧题"}</p>
            <p className="text-muted-foreground">{reason}</p>
            <p>当时作答：{item.lastWrongAnswer ?? "未记录"}；旧题标准答案：{item.correctDisplay ?? item.correctAnswer}</p>
            {href && <Link href={href} className="underline underline-offset-4">前往当前练习</Link>}
          </li>)}
        </ul>
      </details>}
      </div>
    </>
  )
}
