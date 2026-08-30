"use client"

import Image from "next/image"
import Link from "next/link"
import { ChevronDown } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { HomeNowPlaying } from "@/components/home/home-now-playing"
import { HomeStarterLessons } from "@/components/home/home-starter-lessons"
import { useLearningProfile } from "@/lib/learning-progress"
import { useLearningRecommendation } from "@/lib/learning-recommendation"
import { useSrsDeck } from "@/lib/srs"
import { STORAGE_KEYS } from "@/lib/storage-keys"
import { MISTAKE_SRS_STORAGE_KEY, useMistakeNotebook } from "@/lib/mistake-notebook"
import { buildHomePageModel } from "@/lib/home-page-model"
import { countTodayPracticeResults, getDailyPracticeTarget, millisecondsUntilNextLocalDay } from "@/lib/daily-goal"
import { STARTER_LESSONS } from "@/data/lessons"

export function HomePage() {
  const { profile, loaded: profileLoaded, saveProfile } = useLearningProfile()
  const [profileSaveError, setProfileSaveError] = useState(false)
  const [currentLocalDay, setCurrentLocalDay] = useState(() => new Date())
  const { learning, recommendedSkill } = useLearningRecommendation()
  const kanaSrs = useSrsDeck(STORAGE_KEYS.SRS_KANA)
  const vocabSrs = useSrsDeck(STORAGE_KEYS.SRS_VOCAB)
  const mistakeSrs = useSrsDeck(MISTAKE_SRS_STORAGE_KEY)
  const mistakes = useMistakeNotebook()

  useEffect(() => {
    let midnightTimer: ReturnType<typeof setTimeout>
    const scheduleMidnightRefresh = () => {
      const now = new Date()
      midnightTimer = setTimeout(() => {
        setCurrentLocalDay(new Date())
        scheduleMidnightRefresh()
      }, millisecondsUntilNextLocalDay(now))
    }
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") setCurrentLocalDay(new Date())
    }

    scheduleMidnightRefresh()
    document.addEventListener("visibilitychange", refreshWhenVisible)
    return () => {
      clearTimeout(midnightTimer)
      document.removeEventListener("visibilitychange", refreshWhenVisible)
    }
  }, [])

  const homeModel = useMemo(() => {
    return buildHomePageModel({
      completedLessonIds: learning.completedLessonIds,
      items: learning.items,
      masteredKanaIds: learning.masteredKanaIds,
      learnedVocabIds: learning.learnedVocabIds,
      skill: recommendedSkill,
      kanaDueIds: kanaSrs.dueIds,
      vocabDueIds: vocabSrs.dueIds,
      mistakeDueIds: mistakeSrs.dueIds,
      mistakeIds: mistakes.byId.keys(),
      kanaLevel: profile?.kanaLevel,
    })
  }, [
    kanaSrs.dueIds,
    learning.completedLessonIds,
    learning.items,
    learning.learnedVocabIds,
    learning.masteredKanaIds,
    mistakeSrs.dueIds,
    mistakes.byId,
    profile?.kanaLevel,
    recommendedSkill,
    vocabSrs.dueIds,
  ])
  const { totalDue, nextLesson, learningEntry, completedCount, survivalDone, survivalTotal, weakest, weakestHref } = homeModel
  const todayPracticeCount = useMemo(
    () => countTodayPracticeResults(learning.results, currentLocalDay),
    [currentLocalDay, learning.results]
  )
  const dailyTarget = getDailyPracticeTarget(profile?.minutesPerDay)
  const dailyGoalDone = todayPracticeCount >= dailyTarget

  return (
    <div className="paper-wrap">
      <section className="paper-cover px-5 py-16 text-center" aria-labelledby="home-cover-title">
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center">
          <p className="eyebrow">やさしい日本語</p>
          <h1 id="home-cover-title" className="mt-3 font-brush text-5xl font-normal sm:text-6xl">
            優しい
          </h1>
          <p className="font-scribble mt-1 text-xl text-muted-foreground">Yasashi Japanese</p>
          <div className="cover-art relative mt-4 aspect-[4/3] w-[min(84vw,48rem)]">
            <Image
              src="/assets/hero/yasashi-inkstone-cover.webp"
              alt="砚台、毛笔与假名练习纸组成的水墨画"
              fill
              priority
              sizes="(max-width: 768px) 84vw, 768px"
              className="object-contain"
            />
          </div>
        </div>
        <a href="#study-notebook" className="cover-scroll absolute bottom-6 left-1/2 -translate-x-1/2 text-muted-foreground" aria-label="翻到今日学习">
          <ChevronDown className="h-7 w-7" aria-hidden="true" />
        </a>
      </section>

      <section id="study-notebook" className="paper-sheet mx-auto mb-16 w-[calc(100%-1.5rem)] max-w-6xl scroll-mt-24 px-4 py-8 sm:px-7 lg:px-10">
        <header className="mb-7 flex flex-wrap items-end justify-between gap-4 border-b border-border/45 pb-5">
          <div>
            <p className="eyebrow">今日 · Today</p>
            <h2 className="inkline mt-2 font-brush text-3xl sm:text-4xl">学习手帖</h2>
          </div>
          <Link href="/path" className="font-scribble text-lg text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground">
            打开完整课表 →
          </Link>
        </header>

        <div className="grid items-start gap-8 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-12">
          <HomeNowPlaying
            profile={profile}
            profileLoaded={profileLoaded}
            profileSaveError={profileSaveError}
            onSaveProfile={(input) => {
              const saved = saveProfile(input)
              setProfileSaveError(!saved)
              return saved
            }}
            learningEntry={learningEntry}
            todayPracticeCount={todayPracticeCount}
            dailyTarget={dailyTarget}
            dailyGoalDone={dailyGoalDone}
            completedCount={completedCount}
            totalLessons={STARTER_LESSONS.length}
            survivalDone={survivalDone}
            survivalTotal={survivalTotal}
            streak={learning.streak}
            totalDue={totalDue}
          />

          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 px-1">
              <div>
                <span className="eyebrow">课程索引</span>
                <span className="font-scribble ml-2 text-base text-muted-foreground">Course notes</span>
              </div>
              <span className="text-xs text-muted-foreground">{STARTER_LESSONS.length} 日 · N5–N2 · 到期 {totalDue}</span>
            </div>
            <HomeStarterLessons completedLessonIds={learning.completedLessonIds} activeLessonId={nextLesson?.id} />

            <nav className="mt-4 border-t border-border/50" aria-label="今日补充练习">
              <Link href="/review" className="ledger-row group flex items-center gap-4 border-b border-border/40 px-2 py-4">
                <span className="font-scribble w-12 shrink-0 text-sm text-accent">Review</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">今日复习流</span>
                  <span className="block truncate text-xs text-muted-foreground">错题优先 · 到期 {totalDue} 项</span>
                </span>
                <span className="text-sm text-muted-foreground transition-transform group-hover:translate-x-1">→</span>
              </Link>
              <Link href={weakestHref} className="ledger-row group flex items-center gap-4 px-2 py-4">
                <span className="font-scribble w-12 shrink-0 text-sm text-accent">Focus</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">薄弱项</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {weakest ? `${weakest.label}「${weakest.display}」平均 ${weakest.score}` : "练几题后这里会出现最该补的能力"}
                  </span>
                </span>
                <span className="text-sm text-muted-foreground transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </nav>
          </div>
        </div>
      </section>
    </div>
  )
}
