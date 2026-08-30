"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"

// These five category illustrations are intentionally kept as the vocabulary
// ledger's visual index; unillustrated categories use a small ink seal.
const CATEGORY_ICON_MAP: Record<string, string> = {
  greetings: "/assets/vocab-categories/greetings.webp",
  food: "/assets/vocab-categories/food.webp",
  nature: "/assets/vocab-categories/nature.webp",
  daily: "/assets/vocab-categories/daily.webp",
  numbers: "/assets/vocab-categories/numbers.webp",
}

export function hasCategoryIcon(category: string): boolean {
  return category in CATEGORY_ICON_MAP
}

interface CategoryIconProps {
  category: string
  size?: number
  className?: string
  /** Show the "#" textual fallback when no artwork exists. Defaults to true. */
  fallback?: boolean
}

export function CategoryIcon({ category, size = 32, className, fallback = true }: CategoryIconProps) {
  const src = CATEGORY_ICON_MAP[category]

  if (src) {
    return (
      <span
        className={cn(
          "inline-block shrink-0 overflow-hidden rounded-[2px] border border-border/45 bg-card opacity-[0.86] shadow-paper-soft",
          className
        )}
        style={{ width: size, height: size }}
      >
        <Image
          src={src}
          alt=""
          width={size * 2}
          height={size * 2}
          className="h-full w-full object-cover saturate-[0.7] mix-blend-multiply dark:invert dark:grayscale dark:contrast-125 dark:opacity-75 dark:mix-blend-screen"
        />
      </span>
    )
  }

  if (!fallback) return null

  return (
    <span
      className={cn(
        "seal-stamp inline-flex shrink-0 items-center justify-center bg-transparent p-0",
        className
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.55) }}
      aria-hidden
    >
      #
    </span>
  )
}
