"use client"

import { useState, useEffect, useCallback } from "react"
import { semanticsData } from "@/data/semantics-data"
import { ArrowRightLeft, BrainCircuit, Lightbulb, ChevronLeft, ChevronRight } from "lucide-react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { SpeakButton } from "@/components/ui/speak-button"

export default function SemanticsPage() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const selectedPoint = selectedIndex !== null ? semanticsData[selectedIndex] : null

  // Nav Logic
  const handleNext = useCallback(() => {
    if (selectedIndex === null) return
    setSelectedIndex((prev) => (prev! + 1) % semanticsData.length)
  }, [selectedIndex])

  const handlePrev = useCallback(() => {
    if (selectedIndex === null) return
    setSelectedIndex((prev) => (prev! - 1 + semanticsData.length) % semanticsData.length)
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
          <BrainCircuit className="w-8 h-8 text-primary" />
          语义辨析 (Nuance Lab)
        </h1>
        <p className="text-muted-foreground text-lg">
          点击卡片进入深度辨析模式。
        </p>
      </div>

      {/* List View (Detailed) */}
      <div className="grid gap-10">
        {semanticsData.map((point, index) => (
          <div 
            key={point.id} 
            onClick={() => setSelectedIndex(index)}
            className="group relative bg-card border rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden cursor-pointer"
          >
            {/* Header */}
            <div className="bg-secondary/30 p-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 group-hover:bg-secondary/50 transition-colors">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <span className="text-primary">{point.pair[0]}</span>
                <ArrowRightLeft className="w-5 h-5 text-muted-foreground" />
                <span className="text-primary">{point.pair[1]}</span>
              </h2>
              <div className="text-sm font-mono text-muted-foreground bg-background/50 px-3 py-1 rounded-full border">
                {point.title}
              </div>
            </div>

            <div className="p-6 grid md:grid-cols-2 gap-8">
              {/* Left: Core Meaning */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-yellow-500 mt-1 shrink-0" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">核心语义差异</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {point.explanation}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right: Examples Preview */}
              <div className="space-y-2">
                 {point.examples.slice(0, 1).map((ex, i) => (
                    <div key={i} className="bg-muted/30 p-3 rounded-lg text-sm">
                      <div className="font-medium">{ex.sentence}</div>
                      <div className="text-muted-foreground">{ex.translation}</div>
                    </div>
                 ))}
                 <div className="text-xs text-center text-muted-foreground mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   Click to see full analysis
                 </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Focus Modal */}
      <Modal isOpen={selectedIndex !== null} onClose={() => setSelectedIndex(null)} className="max-w-3xl h-[85vh] flex flex-col p-0">
        {selectedPoint && (
          <>
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {/* Header */}
              <div className="text-center border-b pb-6">
                <h2 className="text-4xl font-bold flex items-center justify-center gap-4 mb-3">
                  <span className="text-primary">{selectedPoint.pair[0]}</span>
                  <ArrowRightLeft className="w-8 h-8 text-muted-foreground/50" />
                  <span className="text-primary">{selectedPoint.pair[1]}</span>
                </h2>
                <div className="inline-block bg-secondary px-4 py-1 rounded-full text-sm font-medium text-secondary-foreground">
                  {selectedPoint.title}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Meaning */}
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <Lightbulb className="w-8 h-8 text-yellow-500 shrink-0" />
                    <div>
                      <h3 className="font-bold text-xl mb-3">核心差异</h3>
                      <p className="text-foreground/90 leading-relaxed text-lg">
                        {selectedPoint.explanation}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="bg-primary/5 p-5 rounded-xl border border-primary/10 text-center">
                      <div className="font-bold text-primary mb-2 text-xl">{selectedPoint.pair[0]}</div>
                      <div className="text-sm text-muted-foreground">{selectedPoint.meaning[0]}</div>
                    </div>
                    <div className="bg-primary/5 p-5 rounded-xl border border-primary/10 text-center">
                      <div className="font-bold text-primary mb-2 text-xl">{selectedPoint.pair[1]}</div>
                      <div className="text-sm text-muted-foreground">{selectedPoint.meaning[1]}</div>
                    </div>
                  </div>
                </div>

                {/* Examples */}
                <div className="space-y-5">
                  <div className="flex items-center gap-2">
                    <div className="h-px bg-border flex-1"></div>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Contextual Examples</span>
                    <div className="h-px bg-border flex-1"></div>
                  </div>
                  
                  <div className="space-y-4">
                    {selectedPoint.examples.map((ex, i) => (
                      <div key={i} className="bg-card border p-5 rounded-xl space-y-2 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div className="font-medium text-xl text-foreground">{ex.sentence}</div>
                          <SpeakButton text={ex.sentence} label="朗读例句" className="shrink-0" />
                        </div>
                        <div className="text-base text-muted-foreground">
                          {ex.translation}
                        </div>
                        <div className="mt-3 pt-3 border-t border-border/50 text-sm font-medium text-primary flex items-start gap-2">
                          <span className="shrink-0">💡</span> 
                          <span>{ex.nuance}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-muted/20 flex justify-between items-center shrink-0">
              <Button variant="ghost" onClick={handlePrev} className="gap-2 pl-2">
                <ChevronLeft className="w-5 h-5" /> Prev
              </Button>
              <div className="text-sm text-muted-foreground font-mono">
                {selectedIndex! + 1} / {semanticsData.length}
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
