import { useState } from "react"
import Image from "next/image"
import { OnboardingPanel } from "@/components/home/onboarding-panel"
import { PracticeSaveError } from "@/components/practice/practice-save-error"
import { Modal } from "@/components/ui/modal"
import type { UserProfile } from "@/lib/learning-progress"

export function HomeNowPlaying({
  profile, profileLoaded = true, profileSaveError, onSaveProfile,
  todayPracticeCount, completedCount, skippedCount,
  totalLessons, survivalDone, survivalTotal, streak,
  entryOrder = 1,
}: {
  profile: UserProfile | null
  profileLoaded?: boolean
  profileSaveError: boolean
  onSaveProfile: (input: Omit<UserProfile, "createdAt" | "updatedAt">) => Promise<boolean>
  todayPracticeCount: number
  completedCount: number
  skippedCount: number
  totalLessons: number
  survivalDone: number
  survivalTotal: number
  streak: number
  entryOrder?: number
}) {
  const [editingProfile, setEditingProfile] = useState(false)

  return (
    <section className="home-progress" aria-labelledby="home-progress-title">
      <div className="home-progress-heading">
        <div>
          <h2 id="home-progress-title">学习进度</h2>
          <p className="home-companion-note">按自己的节奏，<br />一点点进步就好。</p>
        </div>
        <figure className="companion-portrait companion-emilia">
          <Image src="/assets/visual-novel/emilia-wave.webp" alt="爱蜜莉雅眨眼挥手" width={144} height={144} sizes="(max-width: 1023px) 108px, 144px" />
          <figcaption lang="ja">エミリア</figcaption>
        </figure>
      </div>
      <div className="home-daily-label">
        <span>今日答题次数</span>
        <span>{todayPracticeCount} 次</span>
      </div>
      <dl className="home-stat-list">
        <MiniStat label="课程" value={`${completedCount}/${totalLessons}`} note={skippedCount > 0 ? `另跳过 ${skippedCount} 课` : undefined} />
        <MiniStat label="入门词" value={`${survivalDone}/${survivalTotal}`} />
        <MiniStat label="连续学习" value={`${streak} 天`} note="含阅读／表达本人确认" />
      </dl>
      <div className="home-profile-summary">
        <p>{profileLoaded ? profile ? profileSummary(profile) : entryOrder > 1 ? "按诊断起点学习 · 每天 10 分钟" : "零基础 · 每天 10 分钟" : "正在读取学习设置..."}</p>
        {entryOrder > 1 && <p className="text-sm">诊断起点 · 第 {entryOrder} 课</p>}
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
  return <div><dt>{label}</dt><dd>{value}{note && <p className="font-sans font-normal">{note}</p>}</dd></div>
}
