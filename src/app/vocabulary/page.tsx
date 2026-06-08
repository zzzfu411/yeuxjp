"use client"

import { useMemo, useState, useEffect, useCallback, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { loadVocabularyLevel } from "@/data/vocabulary/loader"
import type { VocabLevel, Vocabulary } from "@/data/vocabulary/types"
import { speakJapanese } from "@/lib/speech"
import { useVocabProgress } from "@/lib/vocab-progress"
import {
  filterVocabularyItems,
  getVocabularyCategories,
  getVocabularyProgress,
} from "@/lib/vocabulary-page-model"
import { GlossaryButton, GlossaryTerm } from "@/components/ui/glossary"
import { NextStepCard } from "@/components/learning/next-step-card"
import { SpeechSettingsBar } from "@/components/ui/speech-preferences"
import { VocabularyCategoryList } from "@/components/vocabulary/vocabulary-category-list"
import { VocabularyFocusModal } from "@/components/vocabulary/vocabulary-focus-modal"
import { VocabularyToolbar } from "@/components/vocabulary/vocabulary-toolbar"

const EMPTY_VOCAB: Vocabulary[] = []

const levels: { id: VocabLevel; label: string; desc: string }[] = [
  { id: "survival", label: "生存级 (N5)", desc: "购物、问路、自我介绍" },
  { id: "daily", label: "日常级 (N4-N3)", desc: "生活交流、动漫理解" },
  { id: "fluent", label: "流利级 (N2-N1)", desc: "商务、新闻、深层文化" },
];

const categoryNames: Record<string, string> = {
  "greetings": "寒暄 (Greetings)",
  "verbs": "动词 (Verbs)",
  "adjectives": "形容词 (Adjectives)",
  "people": "人物 (People)",
  "food": "食物 (Food)",
  "time": "时间 (Time)",
  "nature": "自然 (Nature)",
  "daily": "日用品 (Daily)",
  "body": "身体 (Body)",
  "directions": "方位 (Directions)",
  "transport": "交通 (Transport)",
  "colors": "颜色 (Colors)",
  "numbers": "数字 (Numbers)",
  "furniture": "家居 (Furniture)",
  "city": "城市 (City)",
  "grammar_words": "虚词 (Grammar Words)",
  "abstract": "抽象 (Abstract)",
  "society": "社会 (Society)",
  "business": "商务 (Business)",
  "culture": "文化 (Culture)",
  "emotion": "情感 (Emotion)"
};

function VocabularyPageContent() {
  const searchParams = useSearchParams()
  const [currentLevel, setCurrentLevel] = useState<VocabLevel>("survival")
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [onlyUnlearned, setOnlyUnlearned] = useState(false)
  const [vocabState, setVocabState] = useState<{
    level: VocabLevel | null
    data: Vocabulary[]
    error: string | null
  }>({
    level: null,
    data: [],
    error: null,
  })

  const { isLearnedId, toggleLearnedId, clearLearned } = useVocabProgress()

  const urlLevel = searchParams.get("level")
  useEffect(() => {
    let cancelled = false

    Promise.resolve().then(() => {
      if (cancelled) return
      if (urlLevel === "survival" || urlLevel === "daily" || urlLevel === "fluent") {
        setCurrentLevel(urlLevel)
      }
    })

    return () => {
      cancelled = true
    }
  }, [urlLevel])

  useEffect(() => {
    let cancelled = false

    loadVocabularyLevel(currentLevel)
      .then((data) => {
        if (cancelled) return
        setVocabState({ level: currentLevel, data, error: null })
      })
      .catch((err) => {
        if (cancelled) return
        setVocabState({
          level: currentLevel,
          data: [],
          error: err instanceof Error ? err.message : String(err),
        })
      })

    return () => {
      cancelled = true
    }
  }, [currentLevel])
   
  const vocabLoading = vocabState.level !== currentLevel
  const rawData = vocabLoading ? EMPTY_VOCAB : vocabState.data
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
  
  // Keep original order
  const categories = useMemo(
    () => getVocabularyCategories(currentData),
    [currentData]
  )

  // Navigation State
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [isModalFlipped, setIsModalFlipped] = useState(false)

  const currentDataLength = currentData.length
  const selectedVocab = selectedIndex !== null ? currentData[selectedIndex] ?? null : null
  const selectedKana = selectedVocab?.kana

  // Scroll to category
  const scrollToCategory = (cat: string) => {
    setActiveCategory(cat);
    const element = document.getElementById(`cat-${cat}`);
    if (element) {
      const headerOffset = 180; 
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  const resetSelection = useCallback(() => {
    setSelectedIndex(null)
    setIsModalFlipped(false)
  }, [])

  const handleLevelChange = useCallback((level: VocabLevel) => {
    setCurrentLevel(level)
    setActiveCategory(null)
    resetSelection()
    window.scrollTo({ top: 0 })
  }, [resetSelection])

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value)
    resetSelection()
  }, [resetSelection])

  const handleToggleOnlyUnlearned = useCallback(() => {
    setOnlyUnlearned((value) => !value)
    resetSelection()
  }, [resetSelection])

  const handleClearLearned = useCallback(() => {
    if (typeof window === "undefined") return
    const ok = window.confirm("纭娓呯┖璇嶆眹鎺屾彙杩涘害鍚楋紵")
    if (ok) clearLearned()
  }, [clearLearned])

  // Handlers
  const handleNext = useCallback(() => {
    if (selectedIndex === null || currentDataLength === 0) return
    setSelectedIndex((prev) => (prev! + 1) % currentDataLength)
    setIsModalFlipped(false)
  }, [currentDataLength, selectedIndex])

  const handlePrev = useCallback(() => {
    if (selectedIndex === null || currentDataLength === 0) return
    setSelectedIndex((prev) => (prev! - 1 + currentDataLength) % currentDataLength)
    setIsModalFlipped(false)
  }, [currentDataLength, selectedIndex])

  const handlePlay = useCallback(() => {
    if (!selectedKana) return
    speakJapanese(selectedKana)
  }, [selectedKana])

  // Keyboard
  useEffect(() => {
    if (selectedIndex === null) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") handleNext()
      if (e.key === "ArrowLeft") handlePrev()
      if (e.key === " ") {
        e.preventDefault()
        setIsModalFlipped(prev => !prev)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedIndex, handleNext, handlePrev])

  return (
    <div className="container py-10 px-4 mx-auto space-y-8 mb-20">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">单词宝库 (Kotoba)</h1>
        <p className="text-muted-foreground text-sm">
          {levels.find(l => l.id === currentLevel)?.desc}
        </p>
        <p className="text-muted-foreground text-xs">
          <GlossaryTerm termId="jlpt">JLPT</GlossaryTerm>：N5 最基础，N1 最难。本页分级为学习路线（大致对应 JLPT）。{" "}
          <GlossaryButton className="h-auto px-2 py-1 rounded-md">术语表</GlossaryButton>
        </p>
      </div>

      <SpeechSettingsBar className="max-w-3xl mx-auto" />

      <VocabularyToolbar
        levels={levels}
        currentLevel={currentLevel}
        searchQuery={searchQuery}
        onlyUnlearned={onlyUnlearned}
        activeCategory={activeCategory}
        categories={categories}
        categoryNames={categoryNames}
        progress={levelProgress}
        onSearchChange={handleSearchChange}
        onLevelChange={handleLevelChange}
        onToggleOnlyUnlearned={handleToggleOnlyUnlearned}
        onClearLearned={handleClearLearned}
        onSelectCategory={scrollToCategory}
      />

      <VocabularyCategoryList
        categories={categories}
        categoryNames={categoryNames}
        items={currentData}
        loading={vocabLoading}
        error={vocabState.error}
        isLearnedId={isLearnedId}
        onExpand={(index) => {
          setSelectedIndex(index)
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
        onClose={() => setSelectedIndex(null)}
        onFlip={() => setIsModalFlipped((prev) => !prev)}
        onNext={handleNext}
        onPrev={handlePrev}
        onPlay={handlePlay}
        onToggleLearned={() => {
          if (selectedVocab) toggleLearnedId(selectedVocab.id)
        }}
      />
    </div>
  )
}

export default function VocabularyPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20">加载中...</div>}>
      <VocabularyPageContent />
    </Suspense>
  )
}
