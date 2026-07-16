"use client"

import { Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"

function ReviewAudioButton({
  text,
  onPlay,
}: {
  text: string
  onPlay: (text: string) => void
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="w-20 h-20 rounded-full border-4"
      aria-label="播放复习音频"
      onClick={() => onPlay(text)}
    >
      <Volume2 className="w-8 h-8" />
    </Button>
  )
}

export function MixedReviewPrompt({
  prompt,
  sub,
  hint,
  audio,
  onPlay,
}: {
  prompt: string
  sub?: string
  hint?: string
  audio?: string
  onPlay: (text: string) => void
}) {
  return (
    <>
      {audio ? <ReviewAudioButton text={audio} onPlay={onPlay} /> : null}
      <div className="mt-6 text-center space-y-2 px-6">
        <div className="text-4xl font-bold leading-snug break-words">{prompt}</div>
        {sub ? <div className="text-sm text-muted-foreground">{sub}</div> : null}
        {hint ? <div className="text-xs text-muted-foreground">{hint}</div> : null}
      </div>
    </>
  )
}

export function KanaReviewPrompt({
  glyph,
  script,
  onPlay,
}: {
  glyph: string
  script: "hiragana" | "katakana"
  onPlay: (text: string) => void
}) {
  return (
    <>
      <ReviewAudioButton text={glyph} onPlay={onPlay} />

      <div className="mt-6 text-center">
        <div className="text-7xl font-bold leading-none">{glyph}</div>
        <div className="mt-2 text-sm text-muted-foreground">{script === "hiragana" ? "平假名" : "片假名"}</div>
        <div className="mt-3 text-xs text-muted-foreground">选择正确的罗马音</div>
      </div>
    </>
  )
}

export function VocabReviewPrompt({
  display,
  sub,
  hint,
  audio,
  onPlay,
}: {
  display: string
  sub?: string
  hint: string
  audio?: string
  onPlay: (text: string) => void
}) {
  return (
    <>
      {audio ? <ReviewAudioButton text={audio} onPlay={onPlay} /> : null}

      <div className="mt-6 text-center space-y-2 px-6">
        <div className="text-6xl font-bold leading-tight break-words">{display}</div>
        {sub ? <div className="text-xl text-muted-foreground">{sub}</div> : null}
        <div className="text-xs text-muted-foreground">{hint}</div>
      </div>
    </>
  )
}

export function MistakeReviewPrompt({
  questionText,
  questionAudio,
  type,
  onPlay,
}: {
  questionText?: string
  questionAudio?: string
  type: string
  onPlay: (text: string) => void
}) {
  if (questionAudio) {
    return (
      <>
        <ReviewAudioButton text={questionAudio} onPlay={onPlay} />
        {questionText ? (
          <div className="mt-5 text-center px-6 text-sm text-muted-foreground leading-relaxed">{questionText}</div>
        ) : null}
      </>
    )
  }

  return (
    <div className="text-center space-y-3 px-6">
      <div className="text-3xl font-bold leading-snug break-words">{questionText ?? "（无题干）"}</div>
      <div className="text-xs text-muted-foreground">{type}</div>
    </div>
  )
}
