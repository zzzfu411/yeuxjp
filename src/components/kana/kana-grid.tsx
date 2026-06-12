"use client"

import { useState, useCallback, useEffect } from "react"
import { Kana } from "@/data/kana-data"
import { KanaCard } from "./kana-card"
import { cn } from "@/lib/utils"
import { KanaDetailModal } from "./kana-detail-modal"
import { speakJapanese } from "@/lib/speech"
import { shouldHandleGlobalShortcut } from "@/lib/keyboard-shortcuts"
import {
  cacheKeyForChar,
  checkStrokeAvailability,
  getAdjacentKanaIndexes,
  getKanaGridRowContent,
  prefetchStrokeSvgs,
  type StrokeAvailability,
} from "@/lib/kana-grid-model"

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
      if (!shouldHandleGlobalShortcut(e.target)) return

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

    const indexes = getAdjacentKanaIndexes(selectedIndex, data.length)

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

  return (
    <>
      <div className="flex flex-col gap-4 sm:gap-6 w-full max-w-3xl mx-auto pb-20">
        {rows.map(row => {
          const content = getKanaGridRowContent(data, row, columns);
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

      <KanaDetailModal
        kana={selectedKana}
        mode={mode}
        currentChar={currentChar}
        currentStrokeAvailability={currentStrokeAvailability}
        selectedIndex={selectedIndex}
        total={data.length}
        isWriting={isWriting}
        isPlaying={isPlaying}
        hasStrokes={hasStrokes}
        isComboChar={isComboChar}
        learned={learned}
        canToggleMastered={!!onToggleMastered}
        onClose={() => {
          setSelectedIndex(null)
          setIsWriting(false)
        }}
        onPrev={handlePrev}
        onNext={handleNext}
        onPlay={handlePlay}
        onToggleWriting={() => setIsWriting((prev) => !prev)}
        onToggleMastered={() => {
          if (selectedKana) onToggleMastered?.(selectedKana.romaji)
        }}
      />
    </>
  )
}
