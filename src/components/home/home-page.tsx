"use client"

import { runLearningWrite } from "@/lib/learning-write-lock"

import Link from "next/link"
import { useMemo, useState } from "react"
import { HomeScene } from "@/components/home/home-scene"
import { HomeNowPlaying } from "@/components/home/home-now-playing"
import { useLearningProfile } from "@/lib/learning-progress"
import { useLearningRecommendation } from "@/lib/learning-recommendation"
import { useSrsDeck } from "@/lib/srs"
import { STORAGE_KEYS } from "@/lib/storage-keys"
import { MISTAKE_SRS_STORAGE_KEY, useMistakeNotebook } from "@/lib/mistake-notebook"
import { buildHomePageModel } from "@/lib/home-page-model"
import { getDailyPracticeTarget } from "@/lib/daily-goal"
import { todayKey } from "@/lib/learning-progress-model"
import { STARTER_LESSONS } from "@/data/lesson-catalog"

export function HomePage() {
  const { profile, loaded: profileLoaded, saveProfile } = useLearningProfile()
  const [profileSaveError, setProfileSaveError] = useState(false)
  const { learning, recommendedSkill } = useLearningRecommendation()
  const kanaSrs = useSrsDeck(STORAGE_KEYS.SRS_KANA)
  const vocabSrs = useSrsDeck(STORAGE_KEYS.SRS_VOCAB)
  const mistakeSrs = useSrsDeck(MISTAKE_SRS_STORAGE_KEY)
  const mistakes = useMistakeNotebook()

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
  const { totalDue, learningEntry, completedCount, skippedCount, survivalDone, survivalTotal, weakest, weakestHref } = homeModel
  const todayPracticeCount = learning.studyCalendar[todayKey(learning.currentLocalDay)]?.practiceCount ?? 0
  const dailyTarget = getDailyPracticeTarget(profile?.minutesPerDay)

  return (
    <div className="home-page">
      <HomeScene entry={learningEntry} />
      <div id="study-notebook" className="home-workspace">
          <HomeNowPlaying
            profile={profile}
            profileLoaded={profileLoaded}
            profileSaveError={profileSaveError}
            onSaveProfile={async (input) => {
              const saved = await runLearningWrite(() => saveProfile(input))
              setProfileSaveError(!saved)
              return saved
            }}
            todayPracticeCount={todayPracticeCount}
            dailyTarget={dailyTarget}
            completedCount={completedCount}
            skippedCount={skippedCount}
            totalLessons={STARTER_LESSONS.length}
            survivalDone={survivalDone}
            survivalTotal={survivalTotal}
            streak={learning.streak}
          />

          <nav className="home-practice-links" aria-label="今日补充练习">
            <Link href="/review">
              <span><strong>今日复习</strong><small>{totalDue > 0 ? `有 ${totalDue} 项到期，复习一下再继续。` : "暂时没有到期内容，可以回顾已学知识。"}</small></span>
              <span aria-hidden="true">↗</span>
            </Link>
            <Link href={weakestHref}>
              <span><strong>薄弱项练习</strong><small>{weakest ? `${weakest.label}「${weakest.display}」· 已测能力 ${weakest.score}%` : "完成几次练习后，为你推荐需要加强的内容。"}</small></span>
              <span aria-hidden="true">↗</span>
            </Link>
          </nav>
      </div>
    </div>
  )
}
