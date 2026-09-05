"use client"
import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import type { VocabLevel } from "@/data/vocabulary/types"
import { DEFAULT_VOCABULARY_LEVEL, isVocabLevel } from "@/data/vocabulary/levels"
import { useLearningProfile } from "@/lib/learning-progress"
import { defaultShowStudyRomaji, nextRomajiVisibility } from "@/lib/romaji-visibility"

export function useVocabularyPageControls() {
  const params = useSearchParams()
  const { profile } = useLearningProfile()
  const [currentLevel, setCurrentLevel] = useState<VocabLevel>(DEFAULT_VOCABULARY_LEVEL)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [onlyUnlearned, setOnlyUnlearned] = useState(false)
  const [page, setPage] = useState(1)
  const [romajiOverride, setRomajiOverride] = useState<boolean | null>(null)
  const showRomaji = romajiOverride ?? defaultShowStudyRomaji(profile?.romajiMode)
  const queryString = params.toString()
  useEffect(() => {
    const query = new URLSearchParams(queryString)
    const level = query.get("level")
    const timer = setTimeout(() => {
      setCurrentLevel(isVocabLevel(level) ? level : DEFAULT_VOCABULARY_LEVEL)
      setActiveCategory(query.get("category") || null)
      setSearchQuery(query.get("q") || "")
      setOnlyUnlearned(query.get("unlearned") === "1")
      const requestedPage = Number(query.get("page"))
      setPage(Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1)
    }, 0)
    return () => clearTimeout(timer)
  }, [queryString])

  const changeQuery = useCallback((patch: Record<string, string | null>) => {
    const url = new URL(window.location.href)
    url.searchParams.delete("item")
    for (const [key, value] of Object.entries(patch)) {
      if (value) url.searchParams.set(key, value)
      else url.searchParams.delete(key)
    }
    window.history.replaceState(null, "", url.pathname + url.search)
  }, [])
  const handleLevelChange = useCallback((level: VocabLevel) => {
    setCurrentLevel(level); setActiveCategory(null); setPage(1)
    changeQuery({ level, category: null, page: null })
  }, [changeQuery])
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value); setPage(1)
    changeQuery({ q: value, page: null })
  }, [changeQuery])
  const handleToggleOnlyUnlearned = useCallback(() => {
    setOnlyUnlearned(!onlyUnlearned); setPage(1)
    changeQuery({ unlearned: onlyUnlearned ? null : "1", page: null })
  }, [changeQuery, onlyUnlearned])
  const handleToggleShowRomaji = useCallback(() => {
    setRomajiOverride(value => nextRomajiVisibility(value, profile?.romajiMode, defaultShowStudyRomaji))
  }, [profile?.romajiMode])
  const scrollToCategory = useCallback((category: string) => {
    setActiveCategory(category || null); setPage(1)
    changeQuery({ category: category || null, page: null })
    requestAnimationFrame(() => document.getElementById("vocabulary-results")?.scrollIntoView({ block: "start" }))
  }, [changeQuery])
  const changePage = useCallback((value: number) => {
    setPage(value); changeQuery({ page: String(value) })
    document.getElementById("vocabulary-results")?.scrollIntoView({ block: "start" })
  }, [changeQuery])
  return { currentLevel, activeCategory, searchQuery, onlyUnlearned, page, changePage, showRomaji, handleLevelChange, handleSearchChange, handleToggleOnlyUnlearned, handleToggleShowRomaji, scrollToCategory }
}
