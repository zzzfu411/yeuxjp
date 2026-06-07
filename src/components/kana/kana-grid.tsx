"use client"

import { useState, useCallback, useEffect } from "react"
import { Kana } from "@/data/kana-data"
import { KanaCard } from "./kana-card"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { CheckCircle2, ChevronLeft, ChevronRight, PenTool, Volume2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { getAnimCjkKanaUrls, KanaStrokeAnimCJK } from "./kana-stroke-animcjk"
import { speakJapanese } from "@/lib/speech"

interface KanaGridProps {
  data: Kana[]
  mode: "hiragana" | "katakana"
  rows?: string[]
  columns?: 3 | 5
  showRomaji?: boolean
  isMastered?: (romaji: string) => boolean
  onToggleMastered?: (romaji: string) => void
}

const DEFAULT_ROWS = ["a", "ka", "sa", "ta", "na", "ha", "ma", "ya", "ra", "wa", "n"]
type StrokeAvailability = "unknown" | "available" | "missing"

function cacheKeyForChar(char: string) {
  return Array.from(char).join("")
}

async function checkStrokeAvailability(char: string) {
  const urls = getAnimCjkKanaUrls(char)
  if (!urls.length) return false

  const results = await Promise.all(
    urls.map(async (url) => {
      try {
        const response = await fetch(url, { method: "HEAD", cache: "force-cache" })
        if (response.ok) return true
        if (response.status !== 405) return false

        const fallback = await fetch(url, { cache: "force-cache" })
        return fallback.ok
      } catch {
        return false
      }
    })
  )

  return results.every(Boolean)
}

function prefetchStrokeSvgs(char: string) {
  for (const url of getAnimCjkKanaUrls(char)) {
    fetch(url, { cache: "force-cache" }).catch(() => undefined)
  }
}

export function KanaGrid({
  data,
  mode,
  rows = DEFAULT_ROWS,
  columns = 5,
  showRomaji = true,
  isMastered,
  onToggleMastered,
}: KanaGridProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isWriting, setIsWriting] = useState(false)
  const [strokeAvailability, setStrokeAvailability] = useState<Record<string, StrokeAvailability>>({})
  
  const selectedKana = selectedIndex !== null ? data[selectedIndex] : null
  const learned = selectedKana ? (isMastered?.(selectedKana.romaji) ?? false) : false
  
  // 获取当前字符 (根据模式)
  const currentChar = selectedKana ? (mode === "hiragana" ? selectedKana.hiragana : selectedKana.katakana) : null
  const currentStrokeKey = currentChar ? cacheKeyForChar(currentChar) : null
  const currentStrokeAvailability = currentStrokeKey ? strokeAvailability[currentStrokeKey] ?? "unknown" : "missing"
  const hasStrokes = !!currentChar && currentStrokeAvailability === "available"
  const isComboChar = (currentChar?.length ?? 0) > 1

  // 导航逻辑
  const handleNext = useCallback(() => {
    if (selectedIndex === null) return
    setIsWriting(false)
    setSelectedIndex((prev) => (prev! + 1) % data.length)
  }, [selectedIndex, data.length])

  const handlePrev = useCallback(() => {
    if (selectedIndex === null) return
    setIsWriting(false)
    setSelectedIndex((prev) => (prev! - 1 + data.length) % data.length)
  }, [selectedIndex, data.length])

  // 键盘支持
  useEffect(() => {
    if (selectedIndex === null) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") handleNext()
      if (e.key === "ArrowLeft") handlePrev()
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedIndex, handleNext, handlePrev])

  useEffect(() => {
    if (!currentChar) return

    const key = cacheKeyForChar(currentChar)
    if (strokeAvailability[key] && strokeAvailability[key] !== "unknown") return

    let cancelled = false
    checkStrokeAvailability(currentChar).then((available) => {
      if (cancelled) return
      setStrokeAvailability((prev) => ({ ...prev, [key]: available ? "available" : "missing" }))
    })

    return () => {
      cancelled = true
    }
  }, [currentChar, strokeAvailability])

  useEffect(() => {
    if (selectedIndex === null) return

    const indexes = [
      selectedIndex,
      (selectedIndex + 1) % data.length,
      (selectedIndex - 1 + data.length) % data.length,
    ]

    for (const index of indexes) {
      const item = data[index]
      if (!item) continue
      const char = mode === "hiragana" ? item.hiragana : item.katakana
      const key = cacheKeyForChar(char)
      prefetchStrokeSvgs(char)
      if (strokeAvailability[key]) continue
      checkStrokeAvailability(char).then((available) => {
        setStrokeAvailability((prev) => ({ ...prev, [key]: available ? "available" : "missing" }))
      })
    }
  }, [data, mode, selectedIndex, strokeAvailability])

  const handlePlay = () => {
    if (!selectedKana) return
    setIsPlaying(true)
    const utterance = speakJapanese(currentChar ?? selectedKana.hiragana, {
      onEnd: () => setIsPlaying(false),
      onError: () => setIsPlaying(false),
    })
    if (!utterance) setIsPlaying(false)
  }

  const getRowContent = (rowName: string, columns: 3 | 5) => {
    const rowKana = data.filter(k => k.row === rowName);
    if (columns === 5 && rowName === "ya") {
       const ya = rowKana.find(k => k.romaji === "ya");
       const yu = rowKana.find(k => k.romaji === "yu");
       const yo = rowKana.find(k => k.romaji === "yo");
       return [ya, null, yu, null, yo];
    }
    if (columns === 5 && rowName === "wa") {
       const wa = rowKana.find(k => k.romaji === "wa");
       const wo = rowKana.find(k => k.romaji === "wo");
       return [wa, null, null, null, wo];
    }
    if (columns === 5 && rowName === "n") {
       return [rowKana[0], null, null, null, null];
    }
    return rowKana;
  };

  return (
    <>
      <div className="flex flex-col gap-4 sm:gap-6 w-full max-w-3xl mx-auto pb-20">
        {rows.map(row => {
          const content = getRowContent(row, columns);
          return (
            <div key={row} className={cn("grid gap-3 sm:gap-4", columns === 3 ? "grid-cols-3" : "grid-cols-5")}>
               {content.map((item, idx) => {
                  const itemChar = mode === "hiragana" ? item?.hiragana : item?.katakana
                  const strokesAvailable = itemChar
                    ? strokeAvailability[cacheKeyForChar(itemChar)] === "available"
                    : false
                  
                  return item ? (
                    <KanaCard 
                      key={item.romaji} 
                      kana={item} 
                      mode={mode} 
                      hasStrokes={strokesAvailable}
                      showRomaji={showRomaji}
                      mastered={isMastered?.(item.romaji) ?? false}
                      onClick={() => {
                        setIsWriting(false)
                        setSelectedIndex(data.indexOf(item))
                      }} 
                    />
                  ) : (
                    <div key={`${row}-empty-${idx}`} className="aspect-square" />
                  )
               })}
            </div>
          )
        })}
      </div>

      <Modal
        isOpen={selectedIndex !== null}
        onClose={() => {
          setSelectedIndex(null)
          setIsWriting(false)
        }}
        className="max-w-md"
      >
        {selectedKana && (
          <div className="flex flex-col h-full">
            <div className="flex-1 p-8 flex flex-col items-center justify-center space-y-8">
              
              {/* 头部：罗马音 */}
              <div className="text-sm font-mono text-muted-foreground uppercase tracking-[0.2em]">
                {selectedKana.romaji}
              </div>

              {/* 主显示区域 */}
              {isWriting && currentChar ? (
                <div className={cn("h-72 flex items-stretch justify-center", isComboChar ? "w-[22rem]" : "w-64")}>
                  <KanaStrokeAnimCJK
                    char={currentChar}
                    label={`笔顺：${selectedKana.romaji}`}
                    className="w-full"
                  />
                </div>
              ) : (
                <div className="relative w-64 h-56 flex items-center justify-center bg-secondary/30 rounded-[2rem] border-4 border-background shadow-inner overflow-hidden">
                  <span
                    className={cn(
                      "font-bold text-foreground leading-none pb-4 whitespace-nowrap",
                      isComboChar ? "text-[5.5rem] tracking-tight" : "text-[9rem]"
                    )}
                  >
                    {mode === "hiragana" ? selectedKana.hiragana : selectedKana.katakana}
                  </span>
                  {/* 背景水印 (Ghost Char) — single-char only, two-char combos
                      would overflow the corner. */}
                  {!isComboChar && (
                    <span className="absolute top-4 left-5 text-5xl text-muted-foreground/10 font-serif font-black select-none">
                      {mode === "hiragana" ? selectedKana.katakana : selectedKana.hiragana}
                    </span>
                  )}
                </div>
              )}

              {!isWriting && currentChar && currentStrokeAvailability === "missing" ? (
                <div className="rounded-xl border bg-muted/30 px-4 py-3 text-center text-sm text-muted-foreground">
                  当前字符暂无可用 AnimCJK 笔顺资源，仍可朗读和标记掌握。
                </div>
              ) : null}

              {/* 控制按钮 */}
              <div className="w-full space-y-3">
                <div className="flex gap-3 w-full">
                  <Button 
                    size="lg" 
                    className="flex-1 rounded-full shadow-lg hover:shadow-xl transition-all" 
                    onClick={handlePlay}
                    disabled={isPlaying}
                  >
                    <Volume2 className={cn("w-5 h-5 mr-2", isPlaying && "animate-pulse")} />
                    朗读
                  </Button>
                  
                  {/* 只有当有数据时才显示书写按钮 */}
                  {hasStrokes && (
                    <Button 
                      size="lg" 
                      variant="outline"
                      className="flex-1 rounded-full border-2" 
                      data-testid="kana-stroke-toggle"
                      onClick={() => setIsWriting(!isWriting)}
                    >
                      {isWriting ? <PenTool className="w-5 h-5 mr-2" /> : <PenTool className="w-5 h-5 mr-2" />}
                      {isWriting ? "字形" : "笔顺"}
                    </Button>
                  )}
                </div>

                {/* Progress */}
                {selectedKana && onToggleMastered && (
                  <Button
                    size="lg"
                    variant={learned ? "default" : "secondary"}
                    className="w-full rounded-full"
                    onClick={() => onToggleMastered(selectedKana.romaji)}
                  >
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    {learned ? "已掌握" : "标记已掌握"}
                  </Button>
                )}
              </div>
            </div>

            {/* 底部导航 */}
            <div className="p-4 border-t bg-muted/30 flex justify-between items-center shrink-0">
              <Button variant="ghost" size="icon" onClick={handlePrev}>
                <ChevronLeft className="w-6 h-6" />
              </Button>
              <div className="text-xs font-mono text-muted-foreground">
                {selectedIndex! + 1} / {data.length}
              </div>
              <Button variant="ghost" size="icon" onClick={handleNext}>
                <ChevronRight className="w-6 h-6" />
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
