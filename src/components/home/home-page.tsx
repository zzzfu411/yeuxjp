"use client"

import Link from "next/link"
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
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-0 px-3 pb-4 lg:flex-row lg:px-4">
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

      <section className="flex min-h-0 min-w-0 flex-1 flex-col border-[3px] border-foreground bg-card">
        <header className="flex flex-wrap items-center gap-3 border-b-[3px] border-foreground bg-background px-4 py-3">
          <span className="font-black tracking-widest">课 程 路 径</span>
          <span className="text-xs font-extrabold text-muted-foreground">{STARTER_LESSONS.length} 天 N5–N2 · 到期 {totalDue}</span>
          <Link href="/path" className="ml-auto text-xs font-extrabold underline-offset-4 hover:underline">
            技能树 →
          </Link>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <HomeStarterLessons completedLessonIds={learning.completedLessonIds} activeLessonId={nextLesson?.id} />
          <Link href="/review" className="flex items-center justify-between gap-3 border-b-[2px] border-foreground px-4 py-3 hover:bg-primary/40">
            <div>
              <div className="text-xs font-extrabold text-muted-foreground">QUEUE</div>
              <div className="font-black">今日复习流</div>
              <div className="text-xs font-semibold text-muted-foreground">错题优先 · 到期 {totalDue} 项</div>
            </div>
            <span className="border-[2px] border-foreground bg-primary px-2 py-1 text-xs font-black">开始复习</span>
          </Link>
          <Link href={weakestHref} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-primary/40">
            <div>
              <div className="text-xs font-extrabold text-muted-foreground">WEAK</div>
              <div className="font-black">薄弱项</div>
              <div className="text-xs font-semibold text-muted-foreground">
                {weakest ? `${weakest.label}「${weakest.display}」平均 ${weakest.score}` : "练几题后这里会出现最该补的能力"}
              </div>
            </div>
            <span className="border-[2px] border-foreground bg-card px-2 py-1 text-xs font-black shadow-hard-sm">专项练习</span>
          </Link>
        </div>
      </section>
    </div>
  )
}
