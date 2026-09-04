"use client"

import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import type { VocabLevel } from "@/data/vocabulary/types"
import { DEFAULT_VOCABULARY_LEVEL, isVocabLevel } from "@/data/vocabulary/levels"
import { useLearningProfile } from "@/lib/learning-progress"
import { defaultShowStudyRomaji, nextRomajiVisibility } from "@/lib/romaji-visibility"

function parseVocabularyLevel(value: string | null): VocabLevel | null {
  return isVocabLevel(value) ? value : null
}

// The mobile filter rail is 222px tall and sits 80px below the fixed navbar.
const VOCABULARY_CATEGORY_SCROLL_OFFSET = 320
const VOCABULARY_SHORT_VIEWPORT_SCROLL_OFFSET = 96

export function useVocabularyPageControls() {
  const searchParams = useSearchParams()
  const { profile } = useLearningProfile()
  const [currentLevel, setCurrentLevel] = useState<VocabLevel>(DEFAULT_VOCABULARY_LEVEL)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [onlyUnlearned, setOnlyUnlearned] = useState(false)
  const [romajiOverride, setRomajiOverride] = useState<boolean | null>(null)
  const showRomaji = romajiOverride ?? defaultShowStudyRomaji(profile?.romajiMode)

  const urlLevel = searchParams.get("level")

  useEffect(() => {
    let cancelled = false

    Promise.resolve().then(() => {
      if (cancelled) return
      const parsedLevel = parseVocabularyLevel(urlLevel)
      setCurrentLevel(parsedLevel ?? DEFAULT_VOCABULARY_LEVEL)
      setActiveCategory(null)
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

  const handleToggleShowRomaji = useCallback(() => {
    setRomajiOverride((value) => nextRomajiVisibility(value, profile?.romajiMode, defaultShowStudyRomaji))
  }, [profile?.romajiMode])

  const scrollToCategory = useCallback((category: string) => {
    setActiveCategory(category)
    const element = document.getElementById(`cat-${category}`)
    if (!element) return

    const elementPosition = element.getBoundingClientRect().top
    const scrollOffset = window.innerHeight <= 420
      ? VOCABULARY_SHORT_VIEWPORT_SCROLL_OFFSET
      : VOCABULARY_CATEGORY_SCROLL_OFFSET
    const offsetPosition = elementPosition + window.pageYOffset - scrollOffset

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
    showRomaji,
    handleLevelChange,
    handleSearchChange,
    handleToggleOnlyUnlearned,
    handleToggleShowRomaji,
    scrollToCategory,
  }
}
