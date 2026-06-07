"use client"

import { useState, useEffect, useCallback } from "react"
import { pragmaticsData, PragmaticScenario } from "@/data/pragmatics-data"
import { cn } from "@/lib/utils"
import { MessageCircle, Users, XCircle, CheckCircle2, Crown, ChevronLeft, ChevronRight } from "lucide-react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { SpeakButton } from "@/components/ui/speak-button"

export default function PragmaticsPage() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const selectedScenario = selectedIndex !== null ? pragmaticsData[selectedIndex] : null

  const handleNext = useCallback(() => {
    if (selectedIndex === null) return
    setSelectedIndex((prev) => (prev! + 1) % pragmaticsData.length)
  }, [selectedIndex])

  const handlePrev = useCallback(() => {
    if (selectedIndex === null) return
    setSelectedIndex((prev) => (prev! - 1 + pragmaticsData.length) % pragmaticsData.length)
  }, [selectedIndex])

  useEffect(() => {
    if (selectedIndex === null) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") handleNext()
      if (e.key === "ArrowLeft") handlePrev()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedIndex, handleNext, handlePrev])

  return (
    <div className="container py-10 px-4 mx-auto space-y-12 max-w-4xl mb-20">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold tracking-tight flex items-center justify-center gap-3">
          <Users className="w-8 h-8 text-primary" />
          情境模拟 (Context Dojo)
        </h1>
        <p className="text-muted-foreground text-lg">
          选择一个情境进行挑战。
        </p>
      </div>

      {/* List View (Restored Detailed) */}
      <div className="grid gap-8">
        {pragmaticsData.map((scenario, index) => (
          <div 
            key={scenario.id} 
            onClick={() => setSelectedIndex(index)}
            className="cursor-pointer border-l-4 border-primary/50 pl-6 py-4 space-y-4 hover:bg-muted/20 transition-colors rounded-r-xl"
          >
            <div>
              <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-wider text-sm mb-1">
                <MessageCircle className="w-4 h-4" />
                Scenario: {scenario.situation}
              </div>
              <h2 className="text-2xl font-bold mb-2">{scenario.title}</h2>
              <p className="text-lg text-foreground/80 font-medium">
                {scenario.context}
              </p>
            </div>

            {/* Preview of responses */}
            <div className="flex gap-2 opacity-60">
               {scenario.responses.slice(0, 2).map((r, i) => (
                 <div key={i} className="text-xs bg-muted px-2 py-1 rounded border">
                   {r.expression}
                 </div>
               ))}
               {scenario.responses.length > 2 && <div className="text-xs self-center">...</div>}
            </div>
          </div>
        ))}
      </div>

      {/* Focus Modal */}
      <Modal isOpen={selectedIndex !== null} onClose={() => setSelectedIndex(null)} className="max-w-2xl h-[85vh] flex flex-col p-0">
        {selectedScenario && (
          <>
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {/* Header */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-wider text-sm">
                  <MessageCircle className="w-4 h-4" />
                  Scenario: {selectedScenario.situation}
                </div>
                <h2 className="text-4xl font-bold tracking-tight">{selectedScenario.title}</h2>
                <div className="text-xl font-medium text-foreground bg-muted/30 p-6 rounded-xl border-l-4 border-primary">
                  {selectedScenario.context}
                </div>
              </div>

              {/* Cultural Note */}
              <div className="bg-secondary/40 p-6 rounded-xl text-base text-muted-foreground italic border border-border/50 shadow-sm">
                <span className="font-bold not-italic text-foreground/80 block mb-2 text-sm uppercase tracking-wide flex items-center gap-2">
                  <span>💡</span> Cultural Context
                </span>
                {selectedScenario.culturalNote}
              </div>

              {/* Responses */}
              <div className="space-y-5">
                <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground border-b pb-2">Response Analysis</h3>
                <div className="grid gap-5">
                  {selectedScenario.responses.map((res: PragmaticScenario['responses'][number], idx: number) => {
                    const isBad = res.type === "Bad"
                    const isNative = res.type === "Native" || res.type === "Anime"
                    
                    return (
                      <div 
                        key={idx}
                        className={cn(
                          "flex flex-col gap-3 p-5 rounded-xl border transition-all shadow-sm",
                          isBad ? "bg-red-50/50 dark:bg-red-950/10 border-red-200/50 dark:border-red-900/30" : 
                          isNative ? "bg-primary/5 border-primary/20" : 
                          "bg-card border-border"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className={cn(
                            "text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide shadow-sm",
                            isBad ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300" :
                            isNative ? "bg-primary text-primary-foreground" :
                            "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                          )}>
                            {res.type}
                          </span>
                          {isBad && <XCircle className="w-5 h-5 text-red-500/70" />}
                          {res.type === "Good" && <CheckCircle2 className="w-5 h-5 text-green-500/70" />}
                          {isNative && <Crown className="w-5 h-5 text-primary/70" />}
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <div className="text-2xl font-bold text-foreground font-serif leading-relaxed">
                              {res.expression}
                            </div>
                            <SpeakButton text={res.expression} label="朗读表达" className="shrink-0" />
                          </div>
                          <div className="text-base text-muted-foreground">
                            {res.explanation}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-muted/20 flex justify-between items-center shrink-0">
              <Button variant="ghost" onClick={handlePrev} className="gap-2 pl-2">
                <ChevronLeft className="w-5 h-5" /> Prev
              </Button>
              <div className="text-sm text-muted-foreground font-mono">
                {selectedIndex! + 1} / {pragmaticsData.length}
              </div>
              <Button variant="ghost" onClick={handleNext} className="gap-2 pr-2">
                Next <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}
