"use client"

import { runLearningWrite } from "@/lib/learning-write-lock"

import { Pagination } from "@/components/ui/pagination"
import { useItemDeepLink } from "@/lib/use-item-deep-link"
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
    page,
    changePage,
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

  const filteredData = useMemo(() => {
    return filterVocabularyItems({
      items: rawData,
      searchQuery,
      onlyUnlearned,
      isLearned: isLearnedId,
    })
  }, [isLearnedId, onlyUnlearned, rawData, searchQuery])

  const categories = useMemo(
    () => getVocabularyCategories(filteredData),
    [filteredData]
  )

  const currentData = useMemo(() => activeCategory ? filteredData.filter(item => item.category === activeCategory) : filteredData, [activeCategory, filteredData])
  const pageSize = 24
  const currentPage = Math.min(page, Math.max(1, Math.ceil(currentData.length / pageSize)))
  const pageStart = (currentPage - 1) * pageSize
  const pageItems = currentData.slice(pageStart, pageStart + pageSize)

  const [isModalFlipped, setIsModalFlipped] = useState(false)
  const [selfAssessment, setSelfAssessment] = useState<VocabularySelfAssessment | null>(null)
  const selfAssessmentLockedRef = useRef(false)
  const focusedVersion = useRef(0)

  const resetFocusedCard = useCallback(() => {
    focusedVersion.current += 1
    setIsModalFlipped(false)
    setSelfAssessment(null)
    setSaveError(false)
    selfAssessmentLockedRef.current = false
  }, [setIsModalFlipped])

  const {
    selectedIndex,
    openAt,
    close,
    goNext,
    goPrev,
  } = useIndexedModalNavigation(currentData.length, resetFocusedCard)
  useItemDeepLink(currentData, item => item.id, openAt)
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

  const handleConfirmClearLearned = useCallback(async () => {
    setConfirmClearOpen(false)
    const saved = await runLearningWrite(() => clearLearned())
    setSaveError(!saved)
  }, [clearLearned])

  const handleCancelClearLearned = useCallback(() => {
    setConfirmClearOpen(false)
  }, [])

  const handleToggleLearned = useCallback(async () => {
    if (!selectedVocab) return
    const wasLearned = isLearnedId(selectedVocab.id)
    const saved = await runLearningWrite(() => toggleLearnedId(selectedVocab.id))
    setSaveError(!saved)
    if (saved && onlyUnlearned && !wasLearned) {
      resetSelection()
    }
  }, [isLearnedId, onlyUnlearned, resetSelection, selectedVocab, toggleLearnedId])

  const handlePlay = useCallback(() => {
    if (!selectedKana) return
    speakJapanese(selectedKana)
  }, [selectedKana])

  const handleSelfAssessment = useCallback(async (rating: VocabularySelfAssessment) => {
    if (!selectedVocab || selfAssessment || selfAssessmentLockedRef.current) return
    selfAssessmentLockedRef.current = true
    const version = focusedVersion.current

    const saved = await runLearningWrite(() => version === focusedVersion.current && recordVocabularySelfAssessment({
      progress: learning,
      itemId: selectedVocab.id,
      rating,
    }))
    if (version !== focusedVersion.current) return
    setSaveError(!saved)
    if (!saved) {
      selfAssessmentLockedRef.current = false
      return
    }

    setSelfAssessment(rating)
  }, [learning, selectedVocab, selfAssessment])

  return (
    <div className="vocabulary-page paper-wrap px-3 py-5 sm:px-5 sm:py-10">
      <article className="paper-sheet mx-auto mb-10 max-w-6xl px-4 sm:px-8 lg:px-12">
        <header className="border-b border-border/50 pb-4">
          <div className="mt-2 flex flex-wrap items-end justify-between gap-5">
            <div>
              <h1 className="inkline font-brush text-4xl sm:text-5xl">单词库 <span className="sr-only">Kotoba</span></h1>
            </div>
            <GlossaryButton className="h-auto border-0 bg-transparent px-0 py-1 text-sm text-muted-foreground shadow-none hover:bg-transparent hover:text-foreground">
              打开术语表
            </GlossaryButton>
          </div>
          <details className="mt-3 text-sm text-muted-foreground"><summary className="cursor-pointer py-2">使用说明</summary>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
            {getVocabularyLevelDescription(currentLevel)}。按难度和主题浏览单词。点开卡片可以听发音、检查记忆，并标记为已掌握。
          </p>
          <p className="hidden sm:block mt-2 text-xs leading-6 text-muted-foreground">
            <GlossaryTerm termId="jlpt">JLPT</GlossaryTerm>：N5 最基础，N1 最难。这里的分级用于安排学习顺序，与 JLPT 等级大致对应。
          </p>
          </details>
        </header>


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
          description="清空后，已掌握标记和复习安排都会删除。练习历史和错题本不会受影响，你仍可重新标记。"
          confirmLabel="清空进度"
          testId="vocabulary-clear-progress-dialog"
          onConfirm={handleConfirmClearLearned}
          onCancel={handleCancelClearLearned}
        />

        <div id="vocabulary-results" className="scroll-mt-24">
        <Pagination page={currentPage} total={currentData.length} pageSize={pageSize} onChange={changePage} />
        <VocabularyCategoryList
          categories={getVocabularyCategories(pageItems)}
          categoryNames={VOCABULARY_CATEGORY_NAMES}
          items={pageItems}
          loading={vocabulary.loading}
          error={vocabulary.error}
          showRomaji={showRomaji}
          isLearnedId={isLearnedId}
          onRetry={vocabulary.retry}
          onExpand={index => openAt(pageStart + index)}
        />

        <Pagination page={currentPage} total={currentData.length} pageSize={pageSize} onChange={changePage} />
        </div>
        <SpeechSettingsBar collapsible className="paper-slip relative mx-auto mt-3 sm:mt-6 max-w-3xl border-border/50 bg-card/60 shadow-paper-soft" />
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
