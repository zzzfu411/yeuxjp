"use client"

import { useCallback, useState, Suspense } from "react"
import { useLearningStatus } from "@/lib/learning-status"
import { NextStepCard } from "@/components/learning/next-step-card"
import { SpeechSettingsBar } from "@/components/ui/speech-preferences"
import { KanaControls } from "@/components/kana/kana-controls"
import { KanaPageHero } from "@/components/kana/kana-page-hero"
import { KanaPageSections } from "@/components/kana/kana-page-sections"
import { KanaSetHint } from "@/components/kana/kana-set-hint"
import { useKanaPageControls } from "@/components/kana/use-kana-page-controls"
import { useKanaPageData } from "@/components/kana/use-kana-page-data"
import { PracticeSaveError } from "@/components/practice/practice-save-error"
import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog"
import type { KanaId } from "@/lib/kana-id"

function KanaPageContent() {
  const {
    mode,
    setMode,
    kanaSet,
    setKanaSet,
    showRomaji,
    onlyUnmastered,
    toggleShowRomaji,
    toggleOnlyUnmastered,
  } = useKanaPageControls()
  const [saveError, setSaveError] = useState(false)
  const [confirmClearOpen, setConfirmClearOpen] = useState(false)
  const {
    isKanaMastered: isMastered,
    toggleKanaMastered: toggleMastered,
    clearKanaMastered: clearMastered,
  } = useLearningStatus()

  const pageData = useKanaPageData(kanaSet, mode, onlyUnmastered, isMastered)

  const handleClearMastered = useCallback(() => {
    setConfirmClearOpen(true)
  }, [])

  const handleConfirmClearMastered = useCallback(() => {
    setConfirmClearOpen(false)
    const saved = clearMastered()
    setSaveError(!saved)
  }, [clearMastered])

  const handleCancelClearMastered = useCallback(() => {
    setConfirmClearOpen(false)
  }, [])

  const handleToggleMastered = useCallback(
    (id: KanaId) => {
      const saved = toggleMastered(id)
      setSaveError(!saved)
    },
    [toggleMastered]
  )

  return (
    <div className="container py-10 px-4 mx-auto flex flex-col items-center space-y-8">
      <KanaPageHero />

      <KanaControls
        mode={mode}
        kanaSet={kanaSet}
        showRomaji={showRomaji}
        onlyUnmastered={onlyUnmastered}
        progress={pageData.activeProgress}
        hint={<KanaSetHint kanaSet={kanaSet} />}
        onModeChange={setMode}
        onKanaSetChange={setKanaSet}
        onToggleRomaji={toggleShowRomaji}
        onToggleOnlyUnmastered={toggleOnlyUnmastered}
        onClearMastered={handleClearMastered}
      />
      <PracticeSaveError show={saveError} />
      <ConfirmActionDialog
        open={confirmClearOpen}
        title="清空假名掌握进度？"
        description="显式掌握标记及假名 SRS 箱位、到期时间会被清空。练习历史、错题本和由练习成绩推导的掌握状态会保留。"
        confirmLabel="清空进度"
        testId="kana-clear-progress-dialog"
        onConfirm={handleConfirmClearMastered}
        onCancel={handleCancelClearMastered}
      />
      <SpeechSettingsBar className="max-w-3xl" />

      <KanaPageSections
        kanaSet={kanaSet}
        pageData={pageData}
        mode={mode}
        showRomaji={showRomaji}
        isMastered={isMastered}
        onToggleMastered={handleToggleMastered}
      />

      <NextStepCard className="max-w-3xl" />
    </div>
  )
}

export function KanaPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20">加载中...</div>}>
      <KanaPageContent />
    </Suspense>
  )
}
