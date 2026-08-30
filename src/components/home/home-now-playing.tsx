import { useState } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { OnboardingPanel } from "@/components/home/onboarding-panel"
import { PracticeSaveError } from "@/components/practice/practice-save-error"
import type { LearningEntry } from "@/lib/learning-entry"
import type { UserProfile } from "@/lib/learning-progress"

export function HomeNowPlaying({
  profile,
  profileLoaded = true,
  profileSaveError,
  onSaveProfile,
  learningEntry,
  todayPracticeCount,
  dailyTarget,
  dailyGoalDone,
  completedCount,
  totalLessons,
  survivalDone,
  survivalTotal,
  streak,
  totalDue,
}: {
  profile: UserProfile | null
  profileLoaded?: boolean
  profileSaveError: boolean
  onSaveProfile: (input: Omit<UserProfile, "createdAt" | "updatedAt">) => boolean
  learningEntry: LearningEntry
  todayPracticeCount: number
  dailyTarget: number
  dailyGoalDone: boolean
  completedCount: number
  totalLessons: number
  survivalDone: number
  survivalTotal: number
  streak: number
  totalDue: number
}) {
  const [editingProfile, setEditingProfile] = useState(false)
  const progress = Math.min(100, Math.round((todayPracticeCount / dailyTarget) * 100) || 0)
  const showOnboarding = profileLoaded && (!profile || editingProfile)

  return (
    <aside className="paper-slip relative w-full px-5 py-6 sm:px-6">
      <span className="paper-tape" aria-hidden="true" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">次の一頁</p>
          <p className="font-scribble mt-1 text-base text-muted-foreground">Now studying</p>
        </div>
        <span className="seal-stamp font-jp flex h-11 w-11 items-center justify-center text-2xl text-accent" aria-hidden="true">
          あ
        </span>
      </div>

      <h3 className="mt-6 text-xl font-semibold leading-snug">{learningEntry.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {learningEntry.subtitle}
      </p>

      {profileLoaded ? (
        <Link
          href={learningEntry.href}
          data-testid="home-start-learning"
          className="group mt-5 inline-flex items-center gap-2 border-b border-accent/50 pb-1 text-sm font-semibold text-accent"
          aria-label={learningEntry.cta}
        >
          {learningEntry.cta}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </Link>
      ) : (
        <div className="mt-5 text-xs text-muted-foreground">正在读取学习设置...</div>
      )}

      {showOnboarding ? (
        <div className="mt-6 border-t border-border/50 pt-6">
          <OnboardingPanel
            key={profile ? `edit-${profile.updatedAt}` : "create"}
            initial={profile}
            onSave={(input) => {
              const saved = onSaveProfile(input)
              if (saved) setEditingProfile(false)
              return saved
            }}
          />
          {editingProfile ? (
            <button
              type="button"
              data-testid="home-edit-profile-cancel"
              className="font-scribble mt-3 w-full text-sm text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground"
              onClick={() => setEditingProfile(false)}
            >
              取消
            </button>
          ) : null}
          <PracticeSaveError show={profileSaveError} />
        </div>
      ) : profileLoaded ? (
        <>
          <div className="mt-7 border-t border-border/50 pt-5">
            <div className="mb-2 flex justify-between text-xs text-muted-foreground">
              <span>{dailyGoalDone ? "今日完成" : "今日进度"}</span>
              <span className="font-scribble text-sm">
                {todayPracticeCount}/{dailyTarget}
              </span>
            </div>
            <div
              className="h-1 overflow-hidden bg-muted"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={dailyTarget}
              aria-valuenow={Math.min(todayPracticeCount, dailyTarget)}
              aria-label="今日练习进度"
            >
              <div className="h-full bg-accent/75" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className="mt-5 border-y border-border/40">
            <MiniStat label="课表" value={`${completedCount}/${totalLessons}`} />
            <MiniStat label="生存词" value={`${survivalDone}/${survivalTotal}`} />
            <MiniStat label="连续" value={`${streak}天`} />
            <MiniStat label="到期" value={`${totalDue}`} />
          </div>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            {profile ? profileSummary(profile) : null}
          </p>
          <button
            type="button"
            data-testid="home-edit-profile"
            className="font-scribble mt-2 text-sm text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground"
            onClick={() => setEditingProfile(true)}
          >
            改设置
          </button>
        </>
      ) : null}
    </aside>
  )
}

function profileSummary(profile: UserProfile) {
  const goalLabel =
    profile.goal === "travel" ? "旅行" : profile.goal === "jlpt" ? "JLPT" : profile.goal === "media" ? "动漫" : "均衡"
  const romajiLabel =
    profile.romajiMode === "hidden" ? "少看罗马音" : profile.romajiMode === "always" ? "显示罗马音" : "练习时少看罗马音"
  return `${goalLabel} · ${romajiLabel} · 每天 ${profile.minutesPerDay} 分钟`
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="ledger-row flex items-baseline justify-between gap-4 border-b border-border/30 px-1 py-2.5 last:border-b-0">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-scribble text-base font-semibold">{value}</div>
    </div>
  )
}
