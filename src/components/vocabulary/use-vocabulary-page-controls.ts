"use client"

import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import type { VocabLevel } from "@/data/vocabulary/types"

function parseVocabularyLevel(value: string | null): VocabLevel | null {
  if (value === "survival" || value === "daily" || value === "fluent") return value
  return null
}

export function useVocabularyPageControls() {
  const searchParams = useSearchParams()
  const [currentLevel, setCurrentLevel] = useState<VocabLevel>("survival")
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [onlyUnlearned, setOnlyUnlearned] = useState(false)

  const urlLevel = searchParams.get("level")

  useEffect(() => {
    let cancelled = false

    Promise.resolve().then(() => {
      if (cancelled) return
      const parsedLevel = parseVocabularyLevel(urlLevel)
      if (parsedLevel) setCurrentLevel(parsedLevel)
    })

    return () => {
      cancelled = true
    }
  }, [urlLevel])

  const handleLevelChange = useCallback((level: VocabLevel) => {
    setCurrentLevel(level)
    setActiveCategory(null)
    window.scrollTo({ top: 0 })
  }, [])

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value)
  }, [])

  const handleToggleOnlyUnlearned = useCallback(() => {
    setOnlyUnlearned((value) => !value)
  }, [])

  const scrollToCategory = useCallback((category: string) => {
    setActiveCategory(category)
    const element = document.getElementById(`cat-${category}`)
    if (!element) return

    const headerOffset = 180
    const elementPosition = element.getBoundingClientRect().top
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth",
    })
  }, [])

  return {
    currentLevel,
    activeCategory,
    searchQuery,
    onlyUnlearned,
    handleLevelChange,
    handleSearchChange,
    handleToggleOnlyUnlearned,
    scrollToCategory,
  }
}
