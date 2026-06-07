"use client"

import { useMemo, useState, useEffect, useCallback, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { loadVocabularyLevel } from "@/data/vocabulary/loader"
import type { VocabLevel, Vocabulary } from "@/data/vocabulary/types"
import { Flashcard } from "@/components/vocabulary/flashcard"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CheckCircle2, ChevronLeft, ChevronRight, Volume2, RotateCw, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { speakJapanese } from "@/lib/speech"
import { useVocabProgress } from "@/lib/vocab-progress"
import { GlossaryButton, GlossaryTerm } from "@/components/ui/glossary"
import { NextStepCard } from "@/components/learning/next-step-card"
import { SpeechSettingsBar } from "@/components/ui/speech-preferences"
import { CategoryIcon, hasCategoryIcon } from "@/components/vocabulary/category-icon"

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
    const total = rawData.length
    const learned = rawData.reduce((acc, v) => acc + (isLearnedId(v.id) ? 1 : 0), 0)
    return { learned, total }
  }, [isLearnedId, rawData])

  const currentData = useMemo(() => {
    const query = searchQuery.trim()
    const q = query.toLowerCase()

    return rawData
      .filter((v) => {
        if (!query) return true
        return (
          v.kana.includes(query) ||
          (v.kanji && v.kanji.includes(query)) ||
          v.romaji.toLowerCase().includes(q) ||
          v.meaning.toLowerCase().includes(q)
        )
      })
      .filter((v) => (onlyUnlearned ? !isLearnedId(v.id) : true))
  }, [isLearnedId, onlyUnlearned, rawData, searchQuery])
  
  // Keep original order
  const categories = useMemo(
    () => Array.from(new Set(currentData.map(v => v.category))),
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

      {/* Search Input */}
      <div className="relative max-w-md mx-auto w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="搜索单词..." 
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            setSelectedIndex(null)
            setIsModalFlipped(false)
          }}
          className="pl-9 bg-secondary/30 border-primary/20 focus-visible:ring-primary/50"
        />
      </div>

      {/* Sticky Header Group */}
      <div className="sticky top-16 z-30 bg-background/95 backdrop-blur py-4 space-y-4 shadow-sm -mx-4 px-4 sm:mx-0 sm:px-0 sm:rounded-xl border-b sm:border-none transition-all">
        
        {/* Level Tabs */}
        <div className="flex justify-center">
          <div className="bg-secondary/50 p-1 rounded-full inline-flex">
            {levels.map(level => (
              <button
                key={level.id}
                onClick={() => {
                  setCurrentLevel(level.id)
                  setActiveCategory(null)
                  setSelectedIndex(null)
                  setIsModalFlipped(false)
                  window.scrollTo({top: 0})
                }}
                className={cn(
                  "px-6 py-2 rounded-full text-sm font-medium transition-all",
                  currentLevel === level.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {level.label}
              </button>
            ))}
          </div>
        </div>

        {/* Progress / Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
          <div className="text-xs text-muted-foreground font-mono px-3 py-1 rounded-full bg-secondary/50 border">
            Progress: {levelProgress.learned}/{levelProgress.total}
          </div>

          <button
            onClick={() => {
              setOnlyUnlearned(v => !v)
              setSelectedIndex(null)
              setIsModalFlipped(false)
            }}
            className={cn(
              "px-4 py-2 rounded-full border transition-colors bg-background hover:bg-secondary/60",
              onlyUnlearned && "border-primary/40 bg-primary/5"
            )}
          >
            {onlyUnlearned ? "显示全部" : "只看未掌握"}
          </button>

          <button
            onClick={() => {
              if (typeof window === "undefined") return
              const ok = window.confirm("确认清空词汇掌握进度吗？")
              if (ok) clearLearned()
            }}
            className="px-4 py-2 rounded-full border transition-colors bg-background hover:bg-secondary/60 text-muted-foreground hover:text-foreground"
          >
            清空进度
          </button>
        </div>

        {/* Category Anchor Chips (Scrollable) */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mask-fade items-center">
          {categories.map(cat => {
            const withIcon = hasCategoryIcon(cat)
            return (
              <button
                key={cat}
                onClick={() => scrollToCategory(cat)}
                className={cn(
                  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full text-xs font-medium border transition-all hover:shadow-sm",
                  withIcon ? "pl-1 pr-3 py-1" : "px-4 py-1.5",
                  activeCategory === cat
                    ? "bg-primary/10 border-primary text-primary font-bold scale-105"
                    : "bg-card border-border hover:border-primary/50 text-muted-foreground"
                )}
              >
                {withIcon && <CategoryIcon category={cat} size={20} fallback={false} />}
                {categoryNames[cat] || cat}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content Grid */}
      <div className="space-y-16 pt-4">
        {categories.map(category => (
          <div key={category} id={`cat-${category}`} className="space-y-6 scroll-mt-48">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-3 border-b pb-2">
              <CategoryIcon category={category} size={40} />
              {categoryNames[category] || category}
              <span className="text-xs font-normal text-muted-foreground ml-auto bg-secondary px-2 py-1 rounded-full">
                {currentData.filter(v => v.category === category).length}
              </span>
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 justify-items-center">
              {currentData
                .filter(v => v.category === category)
                .map(vocab => {
                  // 修复Bug5: 使用currentData中的实际索引
                  const actualIndex = currentData.findIndex(v => v.id === vocab.id)
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

      {/* Focus Modal */}
      <Modal isOpen={selectedVocab !== null} onClose={() => setSelectedIndex(null)} className="max-w-xl h-[70vh] flex flex-col p-0 overflow-hidden rounded-2xl">
        {selectedVocab && (
          <>
            <div 
              className="flex-1 relative cursor-pointer group bg-gradient-to-b from-card to-secondary/10" 
              onClick={() => setIsModalFlipped(!isModalFlipped)}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                {!isModalFlipped ? (
                  <div className="animate-in fade-in zoom-in duration-200 space-y-6">
                    <div className="space-y-2">
                      <h2 className="text-6xl sm:text-7xl font-bold text-foreground tracking-tight">{selectedVocab.kanji || selectedVocab.kana}</h2>
                      {selectedVocab.kanji && <p className="text-2xl text-muted-foreground/80 font-medium">{selectedVocab.kana}</p>}
                    </div>
                    <div className="absolute bottom-8 left-0 right-0 flex justify-center opacity-50 group-hover:opacity-100 transition-opacity">
                      <div className="bg-background/80 backdrop-blur px-4 py-1.5 rounded-full text-xs font-medium text-muted-foreground shadow-sm flex items-center gap-2 border">
                        <RotateCw className="w-3 h-3" /> Tap or Space to Flip
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="animate-in fade-in zoom-in duration-200 space-y-8 w-full max-w-sm">
                    <div className="space-y-1">
                      <p className="text-4xl font-bold text-primary">{selectedVocab.meaning}</p>
                      <p className="text-xl text-muted-foreground font-serif italic">{selectedVocab.romaji}</p>
                    </div>
                    <div className="pt-2">
                      <Button size="lg" className="w-full rounded-full gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all" onClick={(e) => { e.stopPropagation(); handlePlay(); }}>
                        <Volume2 className="w-5 h-5" /> Listen
                      </Button>
                    </div>
                    <div className="pt-2">
                      <Button
                        size="lg"
                        variant={isLearnedId(selectedVocab.id) ? "default" : "secondary"}
                        className="w-full rounded-full gap-2"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleLearnedId(selectedVocab.id)
                        }}
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        {isLearnedId(selectedVocab.id) ? "已掌握" : "标记已掌握"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-background border-t flex justify-between items-center shrink-0 select-none">
              <Button variant="ghost" size="sm" onClick={handlePrev} className="gap-1 pl-2 text-muted-foreground hover:text-foreground">
                <ChevronLeft className="w-4 h-4" /> Prev
              </Button>
              <div className="text-xs font-mono text-muted-foreground bg-secondary px-3 py-1 rounded-full">
                {selectedIndex! + 1} / {currentData.length}
              </div>
              <Button variant="ghost" size="sm" onClick={handleNext} className="gap-1 pr-2 text-muted-foreground hover:text-foreground">
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}
      </Modal>
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
