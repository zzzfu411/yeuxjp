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
    if (!playingRef.current) return
    playingRef.current = false
    cancelJapaneseSpeech()
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
        playingRef.current = true
        const utterance = speakJapanese(text, {
          rate,
          onEnd: () => {
            playingRef.current = false
          },
          onError: () => {
            playingRef.current = false
          },
        })
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
