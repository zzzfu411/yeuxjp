"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useKanaProgress } from "@/lib/kana-progress"
import { useVocabProgress } from "@/lib/vocab-progress"
import { useMistakeNotebook, MISTAKE_SRS_STORAGE_KEY } from "@/lib/mistake-notebook"
import { getNextSrsDueAt, useSrsDeck } from "@/lib/srs"
import { STORAGE_KEYS } from "@/lib/storage-keys"
import { SpeechSettingsBar } from "@/components/ui/speech-preferences"
import { ReviewRunner, type ReviewSession } from "@/components/review/review-runner"
import {
  buildTodayReviewQueue,
  type TodayReviewItem,
} from "@/lib/review-questions"

const KANA_SRS_STORAGE_KEY = STORAGE_KEYS.SRS_KANA
const VOCAB_SRS_STORAGE_KEY = STORAGE_KEYS.SRS_VOCAB

function formatDueCount(n: number) {
  if (n <= 0) return "0"
  if (n < 1000) return String(n)
  return `${Math.floor(n / 100) / 10}k`
}

function formatNextDueAt(value: number | null) {
  if (!value) return "暂无排程"

  const diff = value - Date.now()
  if (diff <= 0) return "现在"

  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < hour) return `${Math.ceil(diff / minute)} 分钟后`
  if (diff < day) return `${Math.ceil(diff / hour)} 小时后`
  return `${Math.ceil(diff / day)} 天后`
}

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

  if (session) {
    return <ReviewRunner session={session} onExit={() => setSession(null)} notebook={mistakes} />
  }

  const totalEnrolled =
    Object.keys(kanaSrs.map).length +
    Object.keys(vocabSrs.map).length +
    mistakes.list.length
  const totalDue =
    kanaSrs.dueIds.length + vocabSrs.dueIds.length + dueMistakeIds.length
  const isFirstTime = totalEnrolled === 0 && mastered.size === 0 && learned.size === 0
  const nextDueAt = getNextSrsDueAt([kanaSrs.map, vocabSrs.map, mistakeSrs.map])

  return (
    <div className="container py-10 px-4 mx-auto max-w-4xl space-y-8 mb-20">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">复习（轻量 SRS）</h1>
        <p className="text-sm text-muted-foreground">
          只覆盖 <span className="font-semibold text-foreground">假名 / 单词 / 错题本</span>：把“学过但会忘”系统性解决。
        </p>
      </div>

      {/* Top banner — splits between two states:
          - First-time visitor (no SRS data yet) → empty-state illustration + CTA
          - Returning visitor → streak banner with the day's due count          */}
      {isFirstTime ? (
        <div className="relative w-full rounded-2xl border bg-card/80 overflow-hidden flex flex-col sm:flex-row items-center gap-6 p-6 sm:pr-8">
          <div className="relative w-40 h-32 shrink-0 sm:w-48 sm:h-40">
            <Image
              src="/assets/states/state-empty.webp"
              alt=""
              fill
              sizes="(max-width: 640px) 160px, 192px"
              className="object-contain"
            />
          </div>
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="text-lg font-bold">还没有复习内容</div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              SRS（间隔重复）会在你<span className="font-semibold text-foreground">标记「已掌握」</span>的假名 / 单词上自动入册。
              先去学几个再回来吧。
            </p>
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start pt-1">
              <Button asChild size="sm" className="rounded-full gap-1.5">
                <Link href="/kana">
                  去学五十音 <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="rounded-full">
                <Link href="/vocabulary">浏览单词卡</Link>
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative w-full rounded-2xl border bg-gradient-to-br from-primary/10 via-card to-card overflow-hidden">
          <Image
            src="/assets/review/review-streak.webp"
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-right opacity-90"
            aria-hidden
          />
          <div className="relative grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 items-center p-6 sm:pr-10">
            <div className="space-y-1">
              <div className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">今日复习</div>
              <div className="text-2xl sm:text-3xl font-bold text-foreground">
                <span className="text-primary">{totalDue}</span> 张到期
                <span className="text-base font-normal text-muted-foreground"> · 共 {totalEnrolled} 张</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {totalDue > 0
                  ? "建议从下面任一卡组开始 5 分钟。"
                  : `今天没有到期内容。下一次复习：${formatNextDueAt(nextDueAt)}。`}
              </p>
            </div>
          </div>
        </div>
      )}

      <SpeechSettingsBar showQuizOptions className="max-w-3xl mx-auto" />

      <div className="rounded-2xl border bg-card p-5 shadow-sm flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="text-lg font-bold">今日复习流</div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            自动混合到期假名、词汇和错题，先处理最容易遗忘的内容。完成后会同步更新新的掌握度模型。
          </p>
          <div className="text-xs text-muted-foreground">
            错题 {dueMistakeIds.length} · 假名 {kanaSrs.dueIds.length} · 单词 {vocabSrs.dueIds.length}
            {!todayQueue.length ? ` · 下一次 ${formatNextDueAt(nextDueAt)}` : null}
          </div>
        </div>
        {todayQueue.length ? (
          <Button
            type="button"
            className="rounded-full"
            onClick={() => setSession({ deck: "today", items: todayQueue })}
          >
            开始今日复习
          </Button>
        ) : (
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/quiz">立即练习</Link>
            </Button>
            <Button asChild className="rounded-full">
              <Link href="/path">继续课程</Link>
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DeckCard
          title="假名复习"
          desc="看假名选罗马音；错了会回到队列末尾。"
          due={kanaSrs.dueIds.length}
          total={Object.keys(kanaSrs.map).length}
          onStart={() => setSession({ deck: "kana", ids: kanaSrs.dueIds })}
          startDisabled={!kanaSrs.dueIds.length}
          extra={
            mastered.size > 0 && kanaEnrollMissing.length > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => kanaEnrollMissing.forEach((id) => kanaSrs.enroll(id))}
              >
                初始化复习（{kanaEnrollMissing.length}）
              </Button>
            ) : (
              <div className="text-xs text-muted-foreground">已掌握：{mastered.size}</div>
            )
          }
        />

        <DeckCard
          title="单词复习"
          desc="看日文选中文意思；支持自动朗读。"
          due={vocabSrs.dueIds.length}
          total={Object.keys(vocabSrs.map).length}
          onStart={() => setSession({ deck: "vocab", ids: vocabSrs.dueIds })}
          startDisabled={!vocabSrs.dueIds.length}
          extra={
            learned.size > 0 && vocabEnrollMissing.length > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => vocabEnrollMissing.forEach((id) => vocabSrs.enroll(id))}
              >
                初始化复习（{vocabEnrollMissing.length}）
              </Button>
            ) : (
              <div className="text-xs text-muted-foreground">已学习：{learned.size}</div>
            )
          }
        />

        <DeckCard
          title="错题本"
          desc="每次答错都会自动加入；复习后会被排到更后面。"
          due={dueMistakeIds.length}
          total={mistakes.list.length}
          onStart={() => setSession({ deck: "mistakes", ids: dueMistakeIds })}
          startDisabled={!dueMistakeIds.length}
          extra={
            mistakes.list.length ? (
              <Button type="button" variant="ghost" size="sm" className="rounded-full" onClick={mistakes.clear}>
                清空错题本
              </Button>
            ) : (
              <div className="text-xs text-muted-foreground">暂无错题</div>
            )
          }
        />
      </div>

      {!!mistakes.list.length && (
        <div className="rounded-2xl border bg-muted/10 p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-foreground">最近错题</div>
            <div className="text-xs text-muted-foreground">点击“错题本”开始复习</div>
          </div>

          <div className="space-y-2">
            {mistakes.list.slice(0, 6).map((m) => (
              <div key={m.id} className="flex items-start justify-between gap-3 rounded-xl border bg-background/60 p-4">
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">
                    {m.type} · 错 {m.wrongCount} 次
                  </div>
                  <div className="text-sm font-medium break-words">{m.questionText ?? m.questionAudio ?? "（无题干）"}</div>
                </div>
                <Button type="button" variant="ghost" size="sm" className="shrink-0" onClick={() => mistakes.remove(m.id)}>
                  移除
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function DeckCard({
  title,
  desc,
  due,
  total,
  onStart,
  startDisabled,
  extra,
}: {
  title: string
  desc: string
  due: number
  total: number
  onStart: () => void
  startDisabled?: boolean
  extra?: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-3">
      <div className="space-y-1">
        <div className="text-lg font-bold">{title}</div>
        <div className="text-sm text-muted-foreground leading-relaxed">{desc}</div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          待复习：<span className="font-semibold text-foreground">{formatDueCount(due)}</span>{" "}
          <span className="text-muted-foreground/60">/ 已加入：{formatDueCount(total)}</span>
        </div>
        <Button type="button" size="sm" className="rounded-full" onClick={onStart} disabled={startDisabled}>
          开始
        </Button>
      </div>

      {extra ? <div className="pt-1">{extra}</div> : null}
    </div>
  )
}
