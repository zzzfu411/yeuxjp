"use client"

import * as React from "react"
import { Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { cancelJapaneseSpeech, isSpeechSupported, speakJapanese } from "@/lib/speech"

type ButtonVariant = React.ComponentProps<typeof Button>["variant"]
type ButtonSize = React.ComponentProps<typeof Button>["size"]

interface SpeakButtonProps {
  text: string
  label?: string
  rate?: number
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
}

export function SpeakButton({
  text,
  label,
  rate,
  variant = "ghost",
  size = "icon",
  className,
}: SpeakButtonProps) {
  const [speechSupported, setSpeechSupported] = React.useState(true)
  const playingRef = React.useRef(false)
  const utteranceRef = React.useRef<SpeechSynthesisUtterance | null>(null)
  const playbackIdRef = React.useRef(0)

  React.useEffect(() => {
    let cancelled = false
    Promise.resolve().then(() => {
      if (!cancelled) setSpeechSupported(isSpeechSupported())
    })
    return () => {
      cancelled = true
    }
  }, [])

  React.useEffect(() => () => {
    const utterance = utteranceRef.current
    utteranceRef.current = null
    playbackIdRef.current += 1
    if (!playingRef.current || !utterance) return
    playingRef.current = false
    cancelJapaneseSpeech(utterance)
  }, [text])

  const disabled = !speechSupported || !text?.trim()

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn(
        "rounded-sm border-transparent bg-transparent text-muted-foreground shadow-none hover:translate-y-0 hover:border-border/50 hover:bg-muted/35 hover:text-accent",
        className
      )}
      onClick={() => {
        const playbackId = playbackIdRef.current + 1
        playbackIdRef.current = playbackId
        playingRef.current = true
        const utterance = speakJapanese(text, {
          rate,
          onEnd: () => {
            if (playbackIdRef.current !== playbackId) return
            playingRef.current = false
            utteranceRef.current = null
          },
          onError: () => {
            if (playbackIdRef.current !== playbackId) return
            playingRef.current = false
            utteranceRef.current = null
          },
        })
        utteranceRef.current = utterance
        if (!utterance) playingRef.current = false
      }}
      disabled={disabled}
      aria-label={label ?? "朗读"}
      title={label ?? "朗读"}
    >
      <Volume2 className="h-5 w-5" aria-hidden="true" />
    </Button>
  )
}
