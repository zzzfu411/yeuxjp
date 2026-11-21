"use client"

import { runLearningWrite } from "@/lib/learning-write-lock"

import Link from "next/link"
import Image from "next/image"
import { useMemo, useState } from "react"
import { HomeScene } from "@/components/home/home-scene"
import { HomeNowPlaying } from "@/components/home/home-now-playing"
import { useLearningProfile } from "@/lib/learning-profile"
import { useLearningRecommendation } from "@/lib/learning-recommendation"
import { useSrsDeck } from "@/lib/srs"
import { STORAGE_KEYS } from "@/lib/storage-keys"
import { MISTAKE_SRS_STORAGE_KEY, useMistakeNotebook } from "@/lib/mistake-notebook"
import { buildHomePageModel } from "@/lib/home-page-model"
import { todayKey } from "@/lib/learning-progress-model"
import { STARTER_LESSONS } from "@/data/lesson-catalog"
import { useKnowledgeReviews } from "@/lib/use-knowledge-reviews"
import { GoalPracticeSection } from "@/components/learning/goal-practice-section"
import { DailyStudySection } from "@/components/home/daily-study-section"
import { KanjiReviewNotice } from "@/components/review/kanji-review-notice"

export function HomePage() {
  const { profile, loaded: profileLoaded, saveProfile } = useLearningProfile()
  const [profileSaveError, setProfileSaveError] = useState(false)
  const { learning, recommendedSkill, placement } = useLearningRecommendation()
  const kanaSrs = useSrsDeck(STORAGE_KEYS.SRS_KANA)
  const vocabSrs = useSrsDeck(STORAGE_KEYS.SRS_VOCAB)
  const mistakeSrs = useSrsDeck(MISTAKE_SRS_STORAGE_KEY)
  const mistakes = useMistakeNotebook()
  const knowledge = useKnowledgeReviews()

  const homeModel = useMemo(() => {
    return buildHomePageModel({
      completedLessonIds: learning.completedLessonIds,
      lessons: learning.lessons,
      items: learning.items,
      masteredKanaIds: learning.masteredKanaIds,
      learnedVocabIds: learning.learnedVocabIds,
      skill: recommendedSkill,
      kanaDueIds: kanaSrs.dueIds,
      vocabDueIds: vocabSrs.dueIds,
      mistakeDueIds: mistakeSrs.dueIds,
      mistakeIds: mistakes.byId.keys(),
      knowledgeDueIds: knowledge.dueIds,
      kanaLevel: profile?.kanaLevel,
      entryOrder: placement.entryOrder,
    })
  }, [
    knowledge.dueIds,
    kanaSrs.dueIds,
    learning.completedLessonIds,
    learning.lessons,
    learning.items,
    learning.learnedVocabIds,
    learning.masteredKanaIds,
    mistakeSrs.dueIds,
    mistakes.byId,
    profile?.kanaLevel,
    placement.entryOrder,
    recommendedSkill,
    vocabSrs.dueIds,
  ])
  const { totalDue, learningEntry, completedCount, skippedCount, survivalDone, survivalTotal, weakest, weakestHref } = homeModel
  const todayPracticeCount = learning.studyCalendar[todayKey(learning.currentLocalDay)]?.practiceCount ?? 0

  return (
    <div className="home-page">
      <HomeScene entry={learningEntry} />
      <DailyStudySection profile={profile} entry={learningEntry} totalDue={totalDue} date={learning.currentLocalDay}
        day={learning.studyCalendar[todayKey(learning.currentLocalDay)]} loaded={profileLoaded && learning.loaded && kanaSrs.loaded && vocabSrs.loaded && mistakeSrs.loaded && knowledge.loaded && placement.loaded} />
      <div id="study-notebook" className="home-workspace">
          <HomeNowPlaying
            profile={profile}
            profileLoaded={profileLoaded}
            entryOrder={placement.entryOrder}
            profileSaveError={profileSaveError}
            onSaveProfile={async (input) => {
              const saved = await runLearningWrite(() => saveProfile(input))
              setProfileSaveError(!saved)
              return saved
            }}
            todayPracticeCount={todayPracticeCount}
            completedCount={completedCount}
            skippedCount={skippedCount}
            totalLessons={STARTER_LESSONS.length}
            survivalDone={survivalDone}
            survivalTotal={survivalTotal}
            streak={learning.streak}
          />

          <nav className="home-practice-links" aria-label="今日补充练习">
            <Link href="/review" className="home-review-companion">
              <span className="home-practice-copy"><strong>今日复习</strong><small>{totalDue > 0 ? `有 ${totalDue} 项到期，复习一下再继续。` : "暂时没有到期内容，可以回顾已学知识。"}</small><span className="home-review-action">去复习 <span aria-hidden="true">↗</span></span></span>
              <span className="companion-portrait companion-kurisu" aria-hidden="true">
                <Image src="/assets/visual-novel/kurisu-tsundere.webp" alt="" width={144} height={144} sizes="(max-width: 1023px) 108px, 144px" />
                <span className="companion-name" lang="ja">牧瀬紅莉栖</span>
              </span>
            </Link>
            <Link href={weakestHref}>
              <span><strong>薄弱项练习</strong><small>{weakest ? `${weakest.label}「${weakest.display}」· 已测能力 ${weakest.score}%` : "完成几次练习后，为你推荐需要加强的内容。"}</small></span>
              <span aria-hidden="true">↗</span>
            </Link>
          </nav>
      </div>
      <div>
        <GoalPracticeSection profile={profile} loaded={profileLoaded} />
        <KanjiReviewNotice />
      </div>
    </div>
  )
}
