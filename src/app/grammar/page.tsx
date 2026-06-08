"use client"

import { useState, useEffect, useMemo, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { grammarData, Level } from "@/data/grammar-data"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { BookOpen, ChevronLeft, ChevronRight, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { SpeakButton } from "@/components/ui/speak-button"
import { GlossaryButton, GlossaryTerm } from "@/components/ui/glossary"
import { NextStepCard } from "@/components/learning/next-step-card"
import { SpeechSettingsBar } from "@/components/ui/speech-preferences"
import { useIndexedModalNavigation } from "@/lib/use-indexed-modal-navigation"

const levels: Level[] = ["N5", "N4", "N3", "N2", "N1", "Anime"]

function GrammarPageContent() {
  const searchParams = useSearchParams()
  const [activeLevel, setActiveLevel] = useState<Level>("N5")
  const [searchQuery, setSearchQuery] = useState("")

  const urlLevel = searchParams.get("level")
  useEffect(() => {
    let cancelled = false

    Promise.resolve().then(() => {
      if (cancelled) return
      if (!urlLevel) return
      if ((levels as readonly string[]).includes(urlLevel)) {
        setActiveLevel(urlLevel as Level)
      }
    })

    return () => {
      cancelled = true
    }
  }, [urlLevel])

  const currentPoints = useMemo(() => {
    const allPoints = grammarData[activeLevel] || []
    return allPoints.filter(p => 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.explanation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.structure.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.examples.some(e => e.meaning.toLowerCase().includes(searchQuery.toLowerCase()) || e.japanese.includes(searchQuery))
    )
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
        {levels.map((level) => (
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

      {/* Grammar List (Restored Detailed View) */}
      <div className="grid gap-8">
        {currentPoints.map((point, index) => (
          <div 
            key={point.id} 
            onClick={() => openAt(index)}
            className="group cursor-pointer flex flex-col bg-card border rounded-xl shadow-sm overflow-hidden transition-all hover:shadow-md hover:border-primary/50 relative"
          >
            {/* Decoration */}
            <div className="absolute top-0 right-0 p-4 opacity-5 text-6xl font-black select-none pointer-events-none group-hover:opacity-10 transition-opacity">
               {activeLevel}
            </div>

            <div className="p-6 border-b bg-secondary/30">
              <div className="flex items-center gap-3 mb-2 relative z-10">
                 <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm shadow-sm group-hover:scale-110 transition-transform">
                   {index + 1}
                 </span>
                 <h2 className="text-xl font-bold group-hover:text-primary transition-colors">{point.title}</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed relative z-10">{point.explanation}</p>
            </div>
            
            <div className="p-6 space-y-6">
               <div className="bg-muted/50 p-4 rounded-lg border border-border/50">
                 <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider flex items-center gap-2">
                   Structure
                   <div className="h-px bg-border flex-1"></div>
                 </div>
                 <code className="text-lg font-mono font-bold text-primary block">{point.structure}</code>
               </div>

               <div className="space-y-4">
                 <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                   Examples
                   <div className="h-px bg-border flex-1"></div>
                 </div>
                 <div className="grid gap-4">
                   {point.examples.map((ex, i) => (
                     <div key={i} className="pl-4 border-l-2 border-primary/30 space-y-1 hover:border-primary transition-colors">
                       <div className="text-lg font-medium tracking-wide">{ex.japanese}</div>
                       <div className="text-sm text-muted-foreground italic font-serif">{ex.romaji}</div>
                       <div className="text-sm text-foreground/80">{ex.meaning}</div>
                     </div>
                   ))}
                 </div>
               </div>
            </div>
          </div>
        ))}
      </div>

      <NextStepCard />

      {/* Focus Modal */}
      <Modal isOpen={isOpen} onClose={close} className="max-w-3xl h-[85vh] flex flex-col p-0 overflow-hidden">
        {selectedPoint && (
          <>
            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              <div className="space-y-4 text-center pb-6 border-b">
                <div className="flex items-center justify-center gap-2 text-primary font-bold text-sm uppercase tracking-wider">
                  <BookOpen className="w-4 h-4" />
                  {selectedPoint.level} Grammar No.{selectedPosition}
                </div>
                <h2 className="text-4xl font-bold tracking-tight">{selectedPoint.title}</h2>
                <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">{selectedPoint.explanation}</p>
              </div>

              <div className="space-y-8">
                 <div className="bg-primary/5 p-6 rounded-xl border border-primary/20 text-center">
                   <div className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Structure</div>
                   <code className="text-3xl font-mono font-bold text-primary block">{selectedPoint.structure}</code>
                 </div>

                 <div className="space-y-6">
                   <div className="flex items-center gap-4">
                     <div className="h-px bg-border flex-1"></div>
                     <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Examples</div>
                     <div className="h-px bg-border flex-1"></div>
                   </div>
                   
                   <div className="grid gap-6">
                     {selectedPoint.examples.map((ex, i) => (
                       <div key={i} className="bg-card p-6 rounded-xl border shadow-sm space-y-2">
                         <div className="flex items-start justify-between gap-3">
                           <div className="text-2xl font-medium tracking-wide text-foreground">{ex.japanese}</div>
                           <SpeakButton text={ex.japanese} label="朗读例句" className="shrink-0" />
                         </div>
                         <div className="text-base text-primary/80 font-serif italic">{ex.romaji}</div>
                         <div className="text-lg text-muted-foreground">{ex.meaning}</div>
                       </div>
                     ))}
                   </div>
                 </div>
              </div>
            </div>

            {/* Navigation Footer - Fixed */}
            <div className="p-4 border-t bg-muted/20 flex justify-between items-center shrink-0">
              <Button variant="ghost" onClick={goPrev} className="gap-2 pl-2">
                <ChevronLeft className="w-5 h-5" /> Previous
              </Button>
              <div className="text-sm text-muted-foreground font-mono">
                {selectedPosition} / {currentPoints.length}
              </div>
              <Button variant="ghost" onClick={goNext} className="gap-2 pr-2">
                Next <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}

export default function GrammarPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20">加载中...</div>}>
      <GrammarPageContent />
    </Suspense>
  )
}
