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
    <div className="flex items-center justify-between gap-2 border-t border-border/35 px-1 pt-3">
      <div className="font-scribble select-none text-sm tabular-nums text-muted-foreground" data-testid="kana-stroke-progress">
        {Math.min(activeStroke, totalStrokes)} / {totalStrokes}
      </div>
      <div className="flex items-center gap-1">
        <ControlBtn onClick={onPrev} disabled={activeStroke === 0} aria-label="上一笔" data-testid="kana-stroke-prev">
          <SkipBack className="w-3.5 h-3.5" />
        </ControlBtn>
        <ControlBtn onClick={onTogglePause} aria-label={isPaused || isFinished ? "播放" : "暂停"} data-testid="kana-stroke-play-toggle">
          {isFinished ? (
            <RotateCcw className="w-3.5 h-3.5" />
          ) : isPaused ? (
            <Play className="w-3.5 h-3.5" />
          ) : (
            <Pause className="w-3.5 h-3.5" />
          )}
        </ControlBtn>
        <ControlBtn onClick={onNext} disabled={activeStroke >= totalStrokes} aria-label="下一笔" data-testid="kana-stroke-next">
          <SkipForward className="w-3.5 h-3.5" />
        </ControlBtn>
        <ControlBtn onClick={onReplay} aria-label="重播" data-testid="kana-stroke-replay">
          <RotateCcw className="w-3.5 h-3.5" />
        </ControlBtn>
        <ControlBtn onClick={onCycleSpeed} aria-label={`速度：${speedLabel}`} data-testid="kana-stroke-speed">
          <Gauge className="w-3.5 h-3.5" />
          <span className="font-scribble ml-0.5 text-xs">{speedLabel}</span>
        </ControlBtn>
      </div>
    </div>
  )
}
