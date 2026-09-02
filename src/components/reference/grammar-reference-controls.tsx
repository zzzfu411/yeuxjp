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
      <div className="space-y-3 text-center">
        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
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
          <GlossaryButton className="h-auto rounded-none border-0 border-b border-dashed border-border/70 bg-transparent px-1 py-0 font-normal shadow-none hover:translate-y-0 hover:border-accent hover:bg-transparent">
            术语表
          </GlossaryButton>
        </p>
      </div>

      <SpeechSettingsBar className="max-w-3xl mx-auto" />

      <div className="relative mx-auto w-full max-w-md">
        <Search className="absolute left-1 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label="搜索语法"
          placeholder="搜索语法..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="border-border/75 bg-transparent pl-8 text-base focus-visible:border-accent"
        />
      </div>

      <div className="short-viewport-static sticky top-20 z-30 mx-auto flex w-fit max-w-full flex-wrap items-center justify-center border-y border-border/55 bg-background/90 px-1 py-1 backdrop-blur-sm">
        {GRAMMAR_LEVELS.map((level) => (
          <Button
            key={level}
            variant="ghost"
            onClick={() => setActiveLevel(level)}
            aria-pressed={activeLevel === level}
            className={cn(
              "min-w-[56px] rounded-none border-0 border-b-2 border-transparent bg-transparent font-scribble text-base font-normal shadow-none hover:translate-y-0 hover:border-border hover:bg-muted/30",
              activeLevel === level && "border-accent bg-accent/[0.04] text-accent"
            )}
          >
            {level}
          </Button>
        ))}
      </div>

      {currentPoints.length ? (
        <GrammarPointList points={currentPoints} activeLevel={activeLevel} onOpen={openAt} />
      ) : (
        <div className="paper-slip flex flex-col items-center gap-3 px-6 py-12 text-center" role="status">
          <SearchX className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
          <div className="font-brush text-2xl">没有找到匹配语法</div>
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
