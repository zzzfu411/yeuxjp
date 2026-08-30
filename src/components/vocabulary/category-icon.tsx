"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"

// Only the 5 high-priority categories have artwork (P2 minimum delivery from
// docs/ASSETS_REQUEST.md). Anything not in this map falls back to a styled
// "#" chip so the page stays consistent visually.
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
  const dimensionClass = `w-[${size}px] h-[${size}px]`

  if (src) {
    return (
      <span
        className={cn(
          "inline-block shrink-0 overflow-hidden rounded-full ring-1 ring-border/60 bg-card",
          className
        )}
        style={{ width: size, height: size }}
      >
        <Image
          src={src}
          alt=""
          width={size * 2}
          height={size * 2}
          className="w-full h-full object-cover"
        />
      </span>
    )
  }

  if (!fallback) return null

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center shrink-0 rounded-full bg-accent/10 text-accent font-black",
        dimensionClass,
        className
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.55) }}
      aria-hidden
    >
      #
    </span>
  )
}
