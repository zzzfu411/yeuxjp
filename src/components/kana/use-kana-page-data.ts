"use client"

import { useCallback, useMemo } from "react"
import { kanaData } from "@/data/kana-data"
import { makeKanaId, type KanaId, type KanaScript } from "@/lib/kana-id"
import {
  filterKanaByProgress,
  getKanaProgress,
  getKanaRowsForData,
  getKanaSetData,
  KANA_ROWS,
  type KanaSet,
} from "@/lib/kana-page-model"

type IsKanaMastered = (id: KanaId) => boolean

export interface KanaPageData {
  activeProgress: {
    learned: number
    total: number
  }
  rows: {
    seion: readonly string[]
    dakuon: readonly string[]
    yoon: readonly string[]
    special: readonly string[]
    seionDakuon: readonly string[]
  }
  visibleSeion: typeof kanaData
  visibleDakuonHandakuon: typeof kanaData
  visibleYoon: typeof kanaData
  visibleSpecial: typeof kanaData
  visibleSeionDakuon: typeof kanaData
}

export function useKanaPageData(
  kanaSet: KanaSet,
  mode: KanaScript,
  onlyUnmastered: boolean,
  isMastered: IsKanaMastered
): KanaPageData {
  const isModeMastered = useCallback(
    (romaji: string) => {
      const id = makeKanaId(mode, romaji)
      return id ? isMastered(id) : false
    },
    [isMastered, mode]
  )

  const seion = useMemo(() => getKanaSetData(kanaData, "seion"), [])
  const dakuonHandakuon = useMemo(() => getKanaSetData(kanaData, "dakuon"), [])
  const yoon = useMemo(() => getKanaSetData(kanaData, "yoon"), [])
  const special = useMemo(() => getKanaSetData(kanaData, "special"), [])
  const seionDakuon = useMemo(
    () => kanaData.filter((item) => item.type === "seion" || item.type === "dakuon" || item.type === "handakuon"),
    []
  )

  const visibleSeion = useMemo(
    () => filterKanaByProgress(seion, onlyUnmastered, isModeMastered),
    [isModeMastered, onlyUnmastered, seion]
  )
  const visibleDakuonHandakuon = useMemo(
    () => filterKanaByProgress(dakuonHandakuon, onlyUnmastered, isModeMastered),
    [dakuonHandakuon, isModeMastered, onlyUnmastered]
  )
  const visibleYoon = useMemo(
    () => filterKanaByProgress(yoon, onlyUnmastered, isModeMastered),
    [isModeMastered, onlyUnmastered, yoon]
  )
  const visibleSpecial = useMemo(
    () => filterKanaByProgress(special, onlyUnmastered, isModeMastered),
    [isModeMastered, onlyUnmastered, special]
  )
  const visibleSeionDakuon = useMemo(
    () => filterKanaByProgress(seionDakuon, onlyUnmastered, isModeMastered),
    [isModeMastered, onlyUnmastered, seionDakuon]
  )

  const activeData = useMemo(() => getKanaSetData(kanaData, kanaSet), [kanaSet])
  const activeProgress = useMemo(() => getKanaProgress(activeData, isModeMastered), [activeData, isModeMastered])

  const rows = useMemo(
    () => ({
      seion: getKanaRowsForData(KANA_ROWS.seion, visibleSeion),
      dakuon: getKanaRowsForData(KANA_ROWS.dakuon, visibleDakuonHandakuon),
      yoon: getKanaRowsForData(KANA_ROWS.yoon, visibleYoon),
      special: getKanaRowsForData(KANA_ROWS.special, visibleSpecial),
      seionDakuon: getKanaRowsForData([...KANA_ROWS.seion, ...KANA_ROWS.dakuon], visibleSeionDakuon),
    }),
    [visibleDakuonHandakuon, visibleSeion, visibleSeionDakuon, visibleSpecial, visibleYoon]
  )

  return {
    activeProgress,
    rows,
    visibleSeion,
    visibleDakuonHandakuon,
    visibleYoon,
    visibleSpecial,
    visibleSeionDakuon,
  }
}
