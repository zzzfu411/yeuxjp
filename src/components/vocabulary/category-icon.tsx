"use client"

import { Hash, Leaf, MessageCircle, ShoppingBag, Utensils, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  greetings: MessageCircle,
  food: Utensils,
  nature: Leaf,
  daily: ShoppingBag,
  numbers: Hash,
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
  const Icon = CATEGORY_ICON_MAP[category]

  if (Icon) {
    return (
      <span
        className={cn(
          "category-icon inline-flex shrink-0 items-center justify-center",
          className
        )}
        data-category={category}
        style={{ width: size, height: size }}
      >
        <Icon className="h-[52%] w-[52%]" aria-hidden="true" />
      </span>
    )
  }

  if (!fallback) return null

  return (
    <span
      className={cn(
        "category-icon inline-flex shrink-0 items-center justify-center p-0 font-bold",
        className
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.55) }}
      aria-hidden
    >
      <Hash className="h-[52%] w-[52%]" />
    </span>
  )
}
