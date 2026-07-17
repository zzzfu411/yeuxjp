"use client"

import { useMemo, useState, useCallback, Suspense } from "react"
import type { VocabLevel } from "@/data/vocabulary/types"
import { speakJapanese } from "@/lib/speech"
import { useLearningStatus } from "@/lib/learning-status"
import {
  filterVocabularyItems,
  getVocabularyCategories,
  getVocabularyProgress,
} from "@/lib/vocabulary-page-model"
import {
  getVocabularyLevelDescription,
  VOCABULARY_CATEGORY_NAMES,
  VOCABULARY_LEVELS,
} from "@/lib/vocabulary-page-config"
import { useIndexedModalNavigation } from "@/lib/use-indexed-modal-navigation"
import { GlossaryButton, GlossaryTerm } from "@/components/ui/glossary"
import { NextStepCard } from "@/components/learning/next-step-card"
import { SpeechSettingsBar } from "@/components/ui/speech-preferences"
import { VocabularyCategoryList } from "@/components/vocabulary/vocabulary-category-list"
import { VocabularyFocusModal } from "@/components/vocabulary/vocabulary-focus-modal"
import { VocabularyToolbar } from "@/components/vocabulary/vocabulary-toolbar"
import { useVocabularyLevelData } from "@/components/vocabulary/use-vocabulary-level-data"
import { useVocabularyPageControls } from "@/components/vocabulary/use-vocabulary-page-controls"
import { PracticeSaveError } from "@/components/practice/practice-save-error"
import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog"

function VocabularyPageContent() {
  const [saveError, setSaveError] = useState(false)
  const [confirmClearOpen, setConfirmClearOpen] = useState(false)

  const {
    isVocabLearned: isLearnedId,
    toggleVocabLearned: toggleLearnedId,
    clearVocabLearned: clearLearned,
  } = useLearningStatus()
  const {
    currentLevel,
    activeCategory,
    searchQuery,
    onlyUnlearned,
    showRomaji,
    handleLevelChange: setVocabularyLevel,
    handleSearchChange: setVocabularySearch,
    handleToggleOnlyUnlearned: toggleOnlyUnlearned,
    handleToggleShowRomaji: toggleShowRomaji,
    scrollToCategory,
  } = useVocabularyPageControls()
  const vocabulary = useVocabularyLevelData(currentLevel)

  const rawData = vocabulary.data
  const levelProgress = useMemo(() => {
    return getVocabularyProgress(rawData, isLearnedId)
  }, [isLearnedId, rawData])

  const currentData = useMemo(() => {
    return filterVocabularyItems({
      items: rawData,
      searchQuery,
      onlyUnlearned,
      isLearned: isLearnedId,
    })
  }, [isLearnedId, onlyUnlearned, rawData, searchQuery])

  const categories = useMemo(
    () => getVocabularyCategories(currentData),
    [currentData]
  )

  const [isModalFlipped, setIsModalFlipped] = useState(false)
  const {
    selectedIndex,
    openAt,
    close,
    goNext,
    goPrev,
  } = useIndexedModalNavigation(currentData.length)
  const selectedVocab = selectedIndex !== null ? currentData[selectedIndex] ?? null : null
  const selectedKana = selectedVocab?.kana

  const resetSelection = useCallback(() => {
    close()
    setIsModalFlipped(false)
  }, [close])

  const handleLevelChange = useCallback((level: VocabLevel) => {
    setVocabularyLevel(level)
    resetSelection()
  }, [resetSelection, setVocabularyLevel])

  const handleSearchChange = useCallback((value: string) => {
    setVocabularySearch(value)
    resetSelection()
  }, [resetSelection, setVocabularySearch])

  const handleToggleOnlyUnlearned = useCallback(() => {
    toggleOnlyUnlearned()
    resetSelection()
  }, [resetSelection, toggleOnlyUnlearned])

  const handleClearLearned = useCallback(() => {
    setConfirmClearOpen(true)
  }, [])

  const handleConfirmClearLearned = useCallback(() => {
    setConfirmClearOpen(false)
    const saved = clearLearned()
    setSaveError(!saved)
  }, [clearLearned])

  const handleCancelClearLearned = useCallback(() => {
    setConfirmClearOpen(false)
  }, [])

  const handleToggleLearned = useCallback(() => {
    if (!selectedVocab) return
    const saved = toggleLearnedId(selectedVocab.id)
    setSaveError(!saved)
  }, [selectedVocab, toggleLearnedId])

  // Handlers
  const handleNext = useCallback(() => {
    goNext()
    setIsModalFlipped(false)
  }, [goNext])

  const handlePrev = useCallback(() => {
    goPrev()
    setIsModalFlipped(false)
  }, [goPrev])

  const handlePlay = useCallback(() => {
    if (!selectedKana) return
    speakJapanese(selectedKana)
  }, [selectedKana])

  return (
    <div className="container py-10 px-4 mx-auto space-y-8 mb-20">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">单词宝库 (Kotoba)</h1>
        <p className="text-muted-foreground text-sm">
          {getVocabularyLevelDescription(currentLevel)}
        </p>
        <p className="text-muted-foreground text-xs">
          <GlossaryTerm termId="jlpt">JLPT</GlossaryTerm>：N5 最基础，N1 最难。本页分级为学习路线（大致对应 JLPT）。{" "}
          <GlossaryButton className="h-auto px-2 py-1 rounded-md">术语表</GlossaryButton>
        </p>
      </div>

      <SpeechSettingsBar className="max-w-3xl mx-auto" />

      <VocabularyToolbar
        levels={VOCABULARY_LEVELS}
        currentLevel={currentLevel}
        searchQuery={searchQuery}
        onlyUnlearned={onlyUnlearned}
        showRomaji={showRomaji}
        activeCategory={activeCategory}
        categories={categories}
        categoryNames={VOCABULARY_CATEGORY_NAMES}
        progress={levelProgress}
        onSearchChange={handleSearchChange}
        onLevelChange={handleLevelChange}
        onToggleOnlyUnlearned={handleToggleOnlyUnlearned}
        onToggleShowRomaji={toggleShowRomaji}
        onClearLearned={handleClearLearned}
        onSelectCategory={scrollToCategory}
      />
      <PracticeSaveError show={saveError} />
      <ConfirmActionDialog
        open={confirmClearOpen}
        title="清空词汇掌握进度？"
        description="当前词汇掌握状态及 SRS 箱位、到期时间会被清空。练习历史和错题本会保留；之后仍可逐个重新标记掌握。"
        confirmLabel="清空进度"
        testId="vocabulary-clear-progress-dialog"
        onConfirm={handleConfirmClearLearned}
        onCancel={handleCancelClearLearned}
      />

      <VocabularyCategoryList
        categories={categories}
        categoryNames={VOCABULARY_CATEGORY_NAMES}
        items={currentData}
        loading={vocabulary.loading}
        error={vocabulary.error}
        showRomaji={showRomaji}
        isLearnedId={isLearnedId}
        onRetry={vocabulary.retry}
        onExpand={(index) => {
          openAt(index)
          setIsModalFlipped(false)
        }}
      />

      <NextStepCard />

      <VocabularyFocusModal
        vocab={selectedVocab}
        selectedIndex={selectedIndex}
        total={currentData.length}
        flipped={isModalFlipped}
        learned={selectedVocab ? isLearnedId(selectedVocab.id) : false}
        showRomaji={showRomaji}
        onClose={resetSelection}
        onFlip={() => setIsModalFlipped((prev) => !prev)}
        onNext={handleNext}
        onPrev={handlePrev}
        onPlay={handlePlay}
        onToggleLearned={handleToggleLearned}
      />
    </div>
  )
}

export function VocabularyPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20">加载中...</div>}>
      <VocabularyPageContent />
    </Suspense>
  )
}
