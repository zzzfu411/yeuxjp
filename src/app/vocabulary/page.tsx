"use client"

import { useMemo, useState, useEffect, useCallback, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { loadVocabularyLevel } from "@/data/vocabulary/loader"
import type { VocabLevel, Vocabulary } from "@/data/vocabulary/types"
import { Flashcard } from "@/components/vocabulary/flashcard"
import { speakJapanese } from "@/lib/speech"
import { useVocabProgress } from "@/lib/vocab-progress"
import {
  filterVocabularyItems,
  findVocabularyIndex,
  getVocabularyCategories,
  getVocabularyItemsByCategory,
  getVocabularyProgress,
} from "@/lib/vocabulary-page-model"
import { GlossaryButton, GlossaryTerm } from "@/components/ui/glossary"
import { NextStepCard } from "@/components/learning/next-step-card"
import { SpeechSettingsBar } from "@/components/ui/speech-preferences"
import { CategoryIcon } from "@/components/vocabulary/category-icon"
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

      {/* Content Grid */}
      <div className="space-y-16 pt-4">
        {categories.map(category => (
          <div key={category} id={`cat-${category}`} className="space-y-6 scroll-mt-48">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-3 border-b pb-2">
              <CategoryIcon category={category} size={40} />
              {categoryNames[category] || category}
              <span className="text-xs font-normal text-muted-foreground ml-auto bg-secondary px-2 py-1 rounded-full">
                {getVocabularyItemsByCategory(currentData, category).length}
              </span>
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 justify-items-center">
              {getVocabularyItemsByCategory(currentData, category)
                .map(vocab => {
                  const actualIndex = findVocabularyIndex(currentData, vocab.id)
                  return (
                    <Flashcard
                      key={vocab.id}
                      vocab={vocab}
                      learned={isLearnedId(vocab.id)}
                      onExpand={() => {
                        setSelectedIndex(actualIndex)
                        setIsModalFlipped(false)
                      }}
                    />
                  )
                })}
            </div>
          </div>
        ))}
        {vocabLoading && (
          <div className="text-center py-20 text-muted-foreground">
            {"\u6b63\u5728\u52a0\u8f7d\u8bcd\u6c47..."}
          </div>
        )}

        {!vocabLoading && vocabState.error && (
          <div className="text-center py-20 text-muted-foreground">
            {"\u8bcd\u6c47\u52a0\u8f7d\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5\u3002"}
          </div>
        )}

        {!vocabLoading && !vocabState.error && currentData.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            {"\u8be5\u7b49\u7ea7\u6682\u65e0\u5339\u914d\u8bcd\u6c47\u3002"}
          </div>
        )}
      </div>

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
