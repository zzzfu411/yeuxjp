"use client"

import { Gauge, Pause, Play, RotateCcw, SkipBack, SkipForward } from "lucide-react"
import { ControlBtn } from "@/components/kana/kana-glyph-board"

interface KanaStrokeControlsProps {
  activeStroke: number
  totalStrokes: number
  isPaused: boolean
  speedLabel: string
  onPrev: () => void
  onTogglePause: () => void
  onNext: () => void
  onReplay: () => void
  onCycleSpeed: () => void
}

export function KanaStrokeControls({
  activeStroke,
  totalStrokes,
  isPaused,
  speedLabel,
  onPrev,
  onTogglePause,
  onNext,
  onReplay,
  onCycleSpeed,
}: KanaStrokeControlsProps) {
  const isFinished = activeStroke > totalStrokes

  return (
    <div className="flex items-center justify-between gap-2 px-1">
      <div className="text-[11px] font-mono text-muted-foreground tabular-nums select-none">
        {Math.min(activeStroke, totalStrokes)} / {totalStrokes}
      </div>
      <div className="flex items-center gap-1">
        <ControlBtn onClick={onPrev} disabled={activeStroke === 0} aria-label="上一笔">
          <SkipBack className="w-3.5 h-3.5" />
        </ControlBtn>
        <ControlBtn onClick={onTogglePause} aria-label={isPaused || isFinished ? "播放" : "暂停"}>
          {isFinished ? (
            <RotateCcw className="w-3.5 h-3.5" />
          ) : isPaused ? (
            <Play className="w-3.5 h-3.5" />
          ) : (
            <Pause className="w-3.5 h-3.5" />
          )}
        </ControlBtn>
        <ControlBtn onClick={onNext} disabled={activeStroke >= totalStrokes} aria-label="下一笔">
          <SkipForward className="w-3.5 h-3.5" />
        </ControlBtn>
        <ControlBtn onClick={onReplay} aria-label="重播">
          <RotateCcw className="w-3.5 h-3.5" />
        </ControlBtn>
        <ControlBtn onClick={onCycleSpeed} aria-label={`速度：${speedLabel}`}>
          <Gauge className="w-3.5 h-3.5" />
          <span className="text-[10px] font-mono ml-0.5">{speedLabel}</span>
        </ControlBtn>
      </div>
    </div>
  )
}
