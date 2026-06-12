"use client"

import { useState, useEffect, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { grammarData, type Level } from "@/data/grammar-data"
import { filterGrammarPoints, GRAMMAR_LEVELS, parseGrammarLevel } from "@/lib/grammar-page-model"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { GlossaryButton, GlossaryTerm } from "@/components/ui/glossary"
import { NextStepCard } from "@/components/learning/next-step-card"
import { SpeechSettingsBar } from "@/components/ui/speech-preferences"
import { GrammarFocusModal } from "@/components/reference/grammar-focus-modal"
import { GrammarPointList } from "@/components/reference/grammar-point-list"
import { useIndexedModalNavigation } from "@/lib/use-indexed-modal-navigation"

export function GrammarReferencePage() {
  const searchParams = useSearchParams()
  const [activeLevel, setActiveLevel] = useState<Level>("N5")
  const [searchQuery, setSearchQuery] = useState("")

  const urlLevel = searchParams.get("level")
  useEffect(() => {
    let cancelled = false

    Promise.resolve().then(() => {
      if (cancelled) return
      const parsedLevel = parseGrammarLevel(urlLevel)
      if (parsedLevel) setActiveLevel(parsedLevel)
    })

    return () => {
      cancelled = true
    }
  }, [urlLevel])

  const currentPoints = useMemo(() => {
    return filterGrammarPoints(grammarData[activeLevel] || [], searchQuery)
  }, [activeLevel, searchQuery])

  const {
    selectedIndex,
    selectedPosition,
    isOpen,
    openAt,
    close,
    goNext,
    goPrev,
  } = useIndexedModalNavigation(currentPoints.length)
  
  const selectedPoint = selectedIndex !== null ? currentPoints[selectedIndex] : null

  useEffect(() => {
    close()
  }, [activeLevel, close, searchQuery])

  return (
    <div className="container py-10 px-4 mx-auto space-y-8 max-w-4xl mb-20">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">语法道场 (Grammar Dojo)</h1>
        <p className="text-muted-foreground">
          {activeLevel === "Anime" ? (
            <>
              <GlossaryTerm termId="anime-level">作品口语</GlossaryTerm> 表达合集（不等同于{" "}
              <GlossaryTerm termId="jlpt">JLPT</GlossaryTerm> 分级）。
            </>
          ) : (
            <>
              {activeLevel} 级语法核心指南（<GlossaryTerm termId="jlpt">JLPT</GlossaryTerm>：N5 最基础，N1 最难）。
            </>
          )}{" "}
          <GlossaryButton className="h-auto px-2 py-1 rounded-md">术语表</GlossaryButton>
        </p>
      </div>

      <SpeechSettingsBar className="max-w-3xl mx-auto" />

      {/* Search Input */}
      <div className="relative max-w-md mx-auto w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="搜索语法..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-secondary/30 border-primary/20 focus-visible:ring-primary/50"
        />
      </div>

      {/* Level Selector */}
      <div className="flex flex-wrap justify-center items-center gap-2 p-1 bg-secondary/50 rounded-lg w-fit mx-auto sticky top-20 z-30 backdrop-blur-md">
        {GRAMMAR_LEVELS.map((level) => (
          <Button
            key={level}
            variant={activeLevel === level ? "default" : "ghost"}
            onClick={() => setActiveLevel(level)}
            className={cn(
              "rounded-md min-w-[60px]",
              activeLevel === level && "shadow-sm"
            )}
          >
            {level}
          </Button>
        ))}
      </div>

      <GrammarPointList points={currentPoints} activeLevel={activeLevel} onOpen={openAt} />

      <NextStepCard />

      <GrammarFocusModal
        point={selectedPoint}
        isOpen={isOpen}
        selectedPosition={selectedPosition}
        total={currentPoints.length}
        onClose={close}
        onPrev={goPrev}
        onNext={goNext}
      />
    </div>
  )
}
