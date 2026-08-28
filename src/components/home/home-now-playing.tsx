import Link from "next/link"
import { OnboardingPanel } from "@/components/home/onboarding-panel"
import { PracticeSaveError } from "@/components/practice/practice-save-error"
import type { LearningEntry } from "@/lib/learning-entry"
import type { UserProfile } from "@/lib/learning-progress"

export function HomeNowPlaying({
  profile,
  profileSaveError,
  onSaveProfile,
  learningEntry,
  todayPracticeCount,
  dailyTarget,
  dailyGoalDone,
  completedCount,
  totalLessons,
  streak,
  totalDue,
}: {
  profile: UserProfile | null
  profileSaveError: boolean
  onSaveProfile: (input: Omit<UserProfile, "createdAt" | "updatedAt">) => boolean
  learningEntry: LearningEntry
  todayPracticeCount: number
  dailyTarget: number
  dailyGoalDone: boolean
  completedCount: number
  totalLessons: number
  streak: number
  totalDue: number
}) {
  const progress = Math.min(100, Math.round((todayPracticeCount / dailyTarget) * 100) || 0)

  return (
    <aside className="flex w-full shrink-0 flex-col items-center border-[3px] border-foreground bg-card px-4 py-6 lg:w-[320px] lg:border-r-0">
      <div className="flex h-40 w-40 items-center justify-center border-[5px] border-foreground bg-muted shadow-hard">
        <span className="font-jp text-6xl text-accent">あ</span>
      </div>
      <div className="mt-4 text-center font-black leading-tight">{learningEntry.title}</div>
      <p className="mt-1 max-w-[16rem] text-center text-xs font-semibold text-muted-foreground">
        {learningEntry.subtitle}
      </p>

      <Link
        href={learningEntry.href}
        data-testid="home-start-learning"
        className="mt-5 flex h-14 w-14 items-center justify-center border-[3px] border-foreground bg-destructive text-2xl text-white shadow-hard-sm hover:-translate-x-px hover:-translate-y-px"
        aria-label={learningEntry.cta}
      >
        ▶
      </Link>
      <div className="mt-2 text-xs font-extrabold">{learningEntry.cta}</div>

      {profile ? (
        <>
          <div className="mt-4 w-full max-w-[16rem]">
            <div className="mb-1 flex justify-between text-[10px] font-extrabold tracking-wide text-muted-foreground">
              <span>{dailyGoalDone ? "今日完成" : "今日进度"}</span>
              <span>
                {todayPracticeCount}/{dailyTarget}
              </span>
            </div>
            <div
              className="h-2.5 border-[2px] border-foreground bg-muted"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={dailyTarget}
              aria-valuenow={Math.min(todayPracticeCount, dailyTarget)}
              aria-label="今日练习进度"
            >
              <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className="mt-5 grid w-full grid-cols-3 gap-2 text-center">
            <MiniStat label="已完成" value={`${completedCount}/${totalLessons}`} />
            <MiniStat label="连续" value={`${streak}天`} />
            <MiniStat label="到期" value={`${totalDue}`} />
          </div>
        </>
      ) : (
        <div className="mt-5 w-full">
          <OnboardingPanel onSave={onSaveProfile} />
          <PracticeSaveError show={profileSaveError} />
        </div>
      )}
    </aside>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-[2px] border-foreground bg-background px-1 py-2">
      <div className="text-[10px] font-extrabold text-muted-foreground">{label}</div>
      <div className="text-sm font-black">{value}</div>
    </div>
  )
}
