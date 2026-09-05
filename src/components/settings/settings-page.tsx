"use client"

import { useState } from "react"
import { useLearningProfile } from "@/lib/learning-profile"
import { runLearningWrite } from "@/lib/learning-write-lock"
import { OnboardingPanel } from "@/components/home/onboarding-panel"
import { SpeechSettingsBar } from "@/components/ui/speech-preferences"
import { LearningDataPanel } from "@/components/review/learning-data-panel"
import { PracticeSaveError } from "@/components/practice/practice-save-error"

export function SettingsPage() {
  const { profile, loaded, saveProfile } = useLearningProfile()
  const [saveError, setSaveError] = useState(false)
  const [saved, setSaved] = useState(false)
  return <div className="paper-wrap max-w-4xl space-y-6 py-8 sm:py-12">
    <header>
      <h1 className="font-brush text-4xl">学习设置与数据</h1>
      <p className="mt-3 text-sm text-muted-foreground">记录保存在当前浏览器，换设备或清理浏览器前，请先导出备份。</p>
    </header>
    <LearningDataPanel />
    <section className="paper-sheet p-5 sm:p-8" aria-label="学习路线设置">
      <h2 className="mb-4 text-lg font-semibold">学习路线</h2>
      {loaded ? <OnboardingPanel key={profile?.updatedAt ?? "new"} initial={profile} onSave={async input => {
        const ok = await runLearningWrite(() => saveProfile(input))
        setSaveError(!ok)
        setSaved(ok)
        return ok
      }} /> : <p role="status">正在读取学习设置…</p>}
      <PracticeSaveError show={saveError} title="学习设置没有保存成功" />
      {saved && <p role="status" className="mt-4 text-sm">学习设置已保存。</p>}
    </section>
    <SpeechSettingsBar showQuizOptions />
    <section className="paper-sheet space-y-3 p-5 text-sm leading-7" aria-labelledby="storage-help-title">
      <h2 id="storage-help-title" className="text-lg font-semibold">保存与离线使用</h2>
      <p>备份包含课程、练习、学习日历、掌握标记、错题、复习安排和朗读设置。导入会替换当前记录，请先导出已有数据。备份可在其他设备的本应用中导入。</p>
      <p>没有账号或云端同步。浏览器清理站点数据、使用隐私窗口或更换站点地址，都可能使原有记录不可用。</p>
      <p>离线时只能使用已缓存的页面与资源。新课程、未缓存的词库和部分语音需要联网；系统是否提供离线日语声音取决于设备。</p>
      <p>多页面保存会排队处理；导入、重置或应用升级后，请刷新其他已打开的旧页面，再继续学习。</p>
    </section>
  </div>
}
