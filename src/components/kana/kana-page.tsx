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
    <div className="paper-wrap py-8 sm:py-12">
      <article className="paper-sheet mx-auto mb-16 px-4 py-8 sm:px-8 lg:px-12">
        <KanaPageHero />

        <div className="mt-9 border-y border-border/45 py-6">
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
        </div>
        <PracticeSaveError show={saveError} />
        <ConfirmActionDialog
          open={confirmClearOpen}
          title="清空假名掌握进度？"
          description="当前假名掌握状态及 SRS 箱位、到期时间会被清空。练习历史和错题本会保留；之后仍可逐个重新标记掌握。"
          confirmLabel="清空进度"
          testId="kana-clear-progress-dialog"
          onConfirm={handleConfirmClearMastered}
          onCancel={handleCancelClearMastered}
        />

        <div className="mx-auto mt-6 max-w-3xl">
          <SpeechSettingsBar className="max-w-3xl" />
        </div>

        <div className="mt-10">
          <KanaPageSections
            kanaSet={kanaSet}
            pageData={pageData}
            mode={mode}
            showRomaji={showRomaji}
            isMastered={isMastered}
            onToggleMastered={handleToggleMastered}
          />
        </div>

        <div className="mx-auto mt-12 max-w-3xl">
          <NextStepCard className="max-w-3xl" />
        </div>
      </article>
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
