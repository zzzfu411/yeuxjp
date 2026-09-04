"use client"

import { useState, useCallback, useEffect } from "react"
import { Kana } from "@/data/kana-data"
import { KanaCard } from "./kana-card"
import { cn } from "@/lib/utils"
import { KanaDetailModal } from "./kana-detail-modal"
import { cancelJapaneseSpeech, speakJapanese } from "@/lib/speech"
import { shouldHandleGlobalShortcutEvent } from "@/lib/keyboard-shortcuts"
import { makeKanaId, type KanaId, type KanaScript } from "@/lib/kana-id"
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
  mode: KanaScript
  rows?: string[]
  columns?: 3 | 5
  showRomaji?: boolean
  isMastered?: (id: KanaId) => boolean
  onToggleMastered?: (id: KanaId) => void
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
  const [selectedRomaji, setSelectedRomaji] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isWriting, setIsWriting] = useState(false)
  const [strokeAvailability, setStrokeAvailability] = useState<Record<string, StrokeAvailability>>({})

  const selectedIndex = selectedRomaji === null
    ? null
    : data.findIndex((item) => item.romaji === selectedRomaji)
  const selectedKana = selectedIndex !== null && selectedIndex >= 0 ? data[selectedIndex] : null
  const selectedKanaId = selectedKana ? makeKanaId(mode, selectedKana.romaji) : null
  const learned = selectedKanaId ? (isMastered?.(selectedKanaId) ?? false) : false
  
  // 获取当前字符 (根据模式)
  const currentChar = selectedKana ? (mode === "hiragana" ? selectedKana.hiragana : selectedKana.katakana) : null
  const currentStrokeKey = currentChar ? cacheKeyForChar(currentChar) : null
  const currentStrokeAvailability = currentStrokeKey ? strokeAvailability[currentStrokeKey] ?? "unknown" : "missing"
  const hasStrokes = !!currentChar && currentStrokeAvailability === "available"
  const isComboChar = (currentChar?.length ?? 0) > 1

  useEffect(() => {
    return () => cancelJapaneseSpeech()
  }, [])

  // 导航逻辑
  const handleNext = useCallback(() => {
    if (selectedIndex === null || selectedIndex < 0 || data.length === 0) return
    cancelJapaneseSpeech()
    setIsPlaying(false)
    setIsWriting(false)
    setSelectedRomaji(data[(selectedIndex + 1) % data.length].romaji)
  }, [data, selectedIndex])

  const handlePrev = useCallback(() => {
    if (selectedIndex === null || selectedIndex < 0 || data.length === 0) return
    cancelJapaneseSpeech()
    setIsPlaying(false)
    setIsWriting(false)
    setSelectedRomaji(data[(selectedIndex - 1 + data.length) % data.length].romaji)
  }, [data, selectedIndex])

  useEffect(() => {
    if (selectedRomaji === null || selectedIndex !== -1) return
    let cancelled = false
    queueMicrotask(() => {
      if (cancelled) return
      cancelJapaneseSpeech()
      setIsPlaying(false)
      setSelectedRomaji(null)
      setIsWriting(false)
    })
    return () => {
      cancelled = true
    }
  }, [selectedIndex, selectedRomaji])

  // 键盘支持
  useEffect(() => {
    if (selectedIndex === null || selectedIndex < 0) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!shouldHandleGlobalShortcutEvent(e)) return

      if (e.key === "ArrowRight") {
        e.preventDefault()
        handleNext()
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault()
        handlePrev()
      }
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
    if (selectedIndex === null || selectedIndex < 0) return

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
      onCancel: () => setIsPlaying(false),
    })
    if (!utterance) setIsPlaying(false)
  }

  const handleClose = useCallback(() => {
    cancelJapaneseSpeech()
    setIsPlaying(false)
    setSelectedRomaji(null)
    setIsWriting(false)
  }, [])

  return (
    <>
      <div className="mx-auto flex w-full max-w-3xl flex-col border-y border-border/40 pb-0">
        {rows.map(row => {
          const content = getKanaGridRowContent(data, row, columns);
          return (
            <div key={row} className={cn("grid gap-2 border-b border-border/30 py-2 last:border-b-0 sm:gap-3 sm:py-3", columns === 3 ? "grid-cols-3" : "grid-cols-5")}>
               {content.map((item, idx) => {
                  const itemChar = mode === "hiragana" ? item?.hiragana : item?.katakana
                  const itemId = item ? makeKanaId(mode, item.romaji) : null
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
                      mastered={itemId ? (isMastered?.(itemId) ?? false) : false}
                      onClick={() => {
                        setIsWriting(false)
                        setSelectedRomaji(item.romaji)
                      }} 
                    />
                  ) : (
                    <div key={`${row}-empty-${idx}`} className="aspect-square" aria-hidden="true" />
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
        selectedIndex={selectedKana ? selectedIndex : null}
        total={data.length}
        isWriting={isWriting}
        isPlaying={isPlaying}
        hasStrokes={hasStrokes}
        isComboChar={isComboChar}
        learned={learned}
        canToggleMastered={!!onToggleMastered}
        onClose={handleClose}
        onPrev={handlePrev}
        onNext={handleNext}
        onPlay={handlePlay}
        onToggleWriting={() => setIsWriting((prev) => !prev)}
        onToggleMastered={() => {
          if (selectedKanaId) onToggleMastered?.(selectedKanaId)
        }}
      />
    </>
  )
}
