"use client"

import * as React from "react"
import { Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { isSpeechSupported, speakJapanese } from "@/lib/speech"

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
  const disabled = !isSpeechSupported() || !text?.trim()

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn("rounded-full", className)}
      onClick={() => speakJapanese(text, { rate })}
      disabled={disabled}
      aria-label={label ?? "朗读"}
      title={label ?? "朗读"}
    >
      <Volume2 className="w-5 h-5" />
    </Button>
  )
}
