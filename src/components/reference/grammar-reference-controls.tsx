"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Search, SearchX } from "lucide-react"
import type { GrammarPoint, Level } from "@/data/grammar-data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GlossaryButton, GlossaryTerm } from "@/components/ui/glossary"
import { SpeechSettingsBar } from "@/components/ui/speech-preferences"
import { GrammarFocusModal } from "@/components/reference/grammar-focus-modal"
import { GrammarPointList } from "@/components/reference/grammar-point-list"
import { filterGrammarPoints, GRAMMAR_LEVELS, parseGrammarLevel } from "@/lib/grammar-page-model"
import { useIndexedModalNavigation } from "@/lib/use-indexed-modal-navigation"
import { cn } from "@/lib/utils"

export function GrammarReferenceControls({
  pointsByLevel,
}: {
  pointsByLevel: Record<Level, GrammarPoint[]>
}) {
  const searchParams = useSearchParams()
  const [activeLevel, setActiveLevel] = useState<Level>("N5")
  const [searchQuery, setSearchQuery] = useState("")

  const urlLevel = searchParams.get("level")
  useEffect(() => {
    let cancelled = false

    Promise.resolve().then(() => {
      if (cancelled) return
      const parsedLevel = parseGrammarLevel(urlLevel)
      setActiveLevel(parsedLevel ?? "N5")
    })

    return () => {
      cancelled = true
    }
  }, [urlLevel])

  const currentPoints = useMemo(() => {
    return filterGrammarPoints(pointsByLevel[activeLevel] || [], searchQuery)
  }, [activeLevel, pointsByLevel, searchQuery])

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
    <>
      <div className="text-center space-y-3">
        <p className="text-muted-foreground">
          {activeLevel === "Anime" ? (
            <>
              <GlossaryTerm termId="anime-level">作品口语</GlossaryTerm> 表达合集，不等同于{" "}
              <GlossaryTerm termId="jlpt">JLPT</GlossaryTerm> 分级。
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

      <div className="relative max-w-md mx-auto w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="搜索语法..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="pl-9 bg-secondary/30 border-primary/20 focus-visible:ring-primary/50"
        />
      </div>

      <div className="sticky top-20 z-30 mx-auto flex w-fit flex-wrap items-center justify-center">
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

      {currentPoints.length ? (
        <GrammarPointList points={currentPoints} activeLevel={activeLevel} onOpen={openAt} />
      ) : (
        <div className="hard-panel flex flex-col items-center gap-3 px-6 py-12 text-center" role="status">
          <SearchX className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
          <div className="font-bold">没有找到匹配语法</div>
          <p className="text-sm text-muted-foreground">试试更短的关键词，或切换其他等级。</p>
        </div>
      )}

      <GrammarFocusModal
        point={selectedPoint}
        isOpen={isOpen}
        selectedPosition={selectedPosition}
        total={currentPoints.length}
        onClose={close}
        onPrev={goPrev}
        onNext={goNext}
      />
    </>
  )
}
