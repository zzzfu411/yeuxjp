"use client"

import { useMemo, useRef, useState, useCallback, useEffect, Suspense } from "react"
import type { VocabLevel } from "@/data/vocabulary/types"
import { cancelJapaneseSpeech, speakJapanese } from "@/lib/speech"
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
import {
  recordVocabularySelfAssessment,
  type VocabularySelfAssessment,
} from "@/lib/vocabulary-self-assessment"

function VocabularyPageContent() {
  const [saveError, setSaveError] = useState(false)
  const [confirmClearOpen, setConfirmClearOpen] = useState(false)

  const learning = useLearningStatus()
  const {
    isVocabLearned: isLearnedId,
    toggleVocabLearned: toggleLearnedId,
    clearVocabLearned: clearLearned,
  } = learning
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
  const [selfAssessment, setSelfAssessment] = useState<VocabularySelfAssessment | null>(null)
  const selfAssessmentLockedRef = useRef(false)

  const resetFocusedCard = useCallback(() => {
    setIsModalFlipped(false)
    setSelfAssessment(null)
    setSaveError(false)
    selfAssessmentLockedRef.current = false
  }, [])

  const {
    selectedIndex,
    openAt,
    close,
    goNext,
    goPrev,
  } = useIndexedModalNavigation(currentData.length, resetFocusedCard)
  const selectedVocab = selectedIndex !== null ? currentData[selectedIndex] ?? null : null
  const selectedKana = selectedVocab?.kana

  const resetSelection = useCallback(() => {
    close()
  }, [close])

  useEffect(() => {
    close()
  }, [close, currentLevel])

  useEffect(() => () => cancelJapaneseSpeech(), [selectedVocab?.id])

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
    const wasLearned = isLearnedId(selectedVocab.id)
    const saved = toggleLearnedId(selectedVocab.id)
    setSaveError(!saved)
    if (saved && onlyUnlearned && !wasLearned) {
      resetSelection()
    }
  }, [isLearnedId, onlyUnlearned, resetSelection, selectedVocab, toggleLearnedId])

  const handlePlay = useCallback(() => {
    if (!selectedKana) return
    speakJapanese(selectedKana)
  }, [selectedKana])

  const handleSelfAssessment = useCallback((rating: VocabularySelfAssessment) => {
    if (!selectedVocab || selfAssessment || selfAssessmentLockedRef.current) return
    selfAssessmentLockedRef.current = true

    const saved = recordVocabularySelfAssessment({
      progress: learning,
      itemId: selectedVocab.id,
      rating,
    })
    setSaveError(!saved)
    if (!saved) {
      selfAssessmentLockedRef.current = false
      return
    }

    setSelfAssessment(rating)
  }, [learning, selectedVocab, selfAssessment])

  return (
    <div className="paper-wrap px-3 py-8 sm:px-5 sm:py-12">
      <article className="paper-sheet mx-auto mb-16 max-w-6xl px-4 py-8 sm:px-8 lg:px-12">
        <header className="border-b border-border/50 pb-7">
          <p className="eyebrow">ことば帖 · Vocabulary ledger</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-5">
            <div>
              <h1 className="inkline font-brush text-4xl sm:text-5xl">单词手帖 <span className="sr-only">Kotoba</span></h1>
              <p className="font-scribble mt-1 text-lg text-muted-foreground">words, noted by hand</p>
            </div>
            <GlossaryButton className="h-auto border-0 bg-transparent px-0 py-1 text-sm text-muted-foreground shadow-none hover:bg-transparent hover:text-foreground">
              打开术语笺
            </GlossaryButton>
          </div>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-muted-foreground">
            {getVocabularyLevelDescription(currentLevel)} 依等级与主题翻阅，点开词笺可朗读、自评并记入掌握进度。
          </p>
          <p className="mt-2 text-xs leading-6 text-muted-foreground">
            <GlossaryTerm termId="jlpt">JLPT</GlossaryTerm>：N5 最基础，N1 最难。本页分级为学习路线（大致对应 JLPT）。
          </p>
        </header>

        <SpeechSettingsBar className="paper-slip relative mx-auto mt-8 max-w-3xl border-border/50 bg-card/60 shadow-paper-soft" />

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
        <PracticeSaveError show={saveError && !selectedVocab} />
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
          onExpand={openAt}
        />

        <NextStepCard className="mt-12" />
      </article>

      <VocabularyFocusModal
        vocab={selectedVocab}
        selectedIndex={selectedIndex}
        total={currentData.length}
        flipped={isModalFlipped}
        learned={selectedVocab ? isLearnedId(selectedVocab.id) : false}
        assessment={selfAssessment}
        saveError={saveError}
        showRomaji={showRomaji}
        onClose={resetSelection}
        onFlip={() => setIsModalFlipped((prev) => !prev)}
        onNext={goNext}
        onPrev={goPrev}
        onPlay={handlePlay}
        onSelfAssess={handleSelfAssessment}
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
