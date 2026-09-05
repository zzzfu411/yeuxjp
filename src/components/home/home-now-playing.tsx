import { useState } from "react"
import { OnboardingPanel } from "@/components/home/onboarding-panel"
import { PracticeSaveError } from "@/components/practice/practice-save-error"
import { Modal } from "@/components/ui/modal"
import type { UserProfile } from "@/lib/learning-progress"

export function HomeNowPlaying({
  profile, profileLoaded = true, profileSaveError, onSaveProfile,
  todayPracticeCount, dailyTarget, completedCount, skippedCount,
  totalLessons, survivalDone, survivalTotal, streak,
}: {
  profile: UserProfile | null
  profileLoaded?: boolean
  profileSaveError: boolean
  onSaveProfile: (input: Omit<UserProfile, "createdAt" | "updatedAt">) => Promise<boolean>
  todayPracticeCount: number
  dailyTarget: number
  completedCount: number
  skippedCount: number
  totalLessons: number
  survivalDone: number
  survivalTotal: number
  streak: number
}) {
  const [editingProfile, setEditingProfile] = useState(false)
  const progress = Math.min(100, Math.round((todayPracticeCount / dailyTarget) * 100) || 0)

  return (
    <section className="home-progress" aria-labelledby="home-progress-title">
      <h2 id="home-progress-title">学习进度</h2>
      <div className="home-daily-label">
        <span>{todayPracticeCount >= dailyTarget ? "今日完成" : "今日练习"}</span>
        <span>{todayPracticeCount} / {dailyTarget}</span>
      </div>
      <div className="vn-progress-track" role="progressbar" aria-label="今日练习进度" aria-valuemin={0} aria-valuemax={dailyTarget} aria-valuenow={Math.min(todayPracticeCount, dailyTarget)}>
        <span style={{ width: `${progress}%` }} />
      </div>
      <dl className="home-stat-list">
        <MiniStat label="课程" value={`${completedCount}/${totalLessons}`} note={skippedCount > 0 ? `另跳过 ${skippedCount} 课` : undefined} />
        <MiniStat label="入门词" value={`${survivalDone}/${survivalTotal}`} />
        <MiniStat label="连续学习" value={`${streak} 天`} />
      </dl>
      <div className="home-profile-summary">
        <p>{profileLoaded ? profile ? profileSummary(profile) : "零基础 · 每天 10 分钟" : "正在读取学习设置..."}</p>
        <button type="button" data-testid="home-edit-profile" disabled={!profileLoaded} aria-haspopup="dialog" aria-expanded={editingProfile} className="home-text-button" onClick={() => setEditingProfile(true)}>学习设置</button>
      </div>
      <Modal isOpen={editingProfile} onClose={() => setEditingProfile(false)} ariaLabelledBy="home-profile-title" className="max-w-xl p-5 sm:p-8">
        <h2 id="home-profile-title" className="mb-5 pr-10 text-xl font-semibold">学习设置</h2>
        {editingProfile && (
          <OnboardingPanel
            key={profile ? `edit-${profile.updatedAt}` : "create"}
            initial={profile}
            onSave={async (input) => {
              const saved = await onSaveProfile(input)
              if (saved) setEditingProfile(false)
              return saved
            }}
          />
        )}
        <PracticeSaveError show={profileSaveError} />
        <button type="button" data-testid="home-edit-profile-cancel" className="home-text-button mt-4 w-full py-2" onClick={() => setEditingProfile(false)}>取消</button>
      </Modal>
    </section>
  )
}

function profileSummary(profile: UserProfile) {
  const goalLabel = profile.goal === "travel" ? "旅行" : profile.goal === "jlpt" ? "JLPT" : profile.goal === "media" ? "动漫" : "均衡学习"
  return `${goalLabel} · 每天 ${profile.minutesPerDay} 分钟`
}

function MiniStat({ label, value, note }: { label: string; value: string; note?: string }) {
  return <div><dt>{label}</dt><dd>{value}</dd>{note && <p>{note}</p>}</div>
}
