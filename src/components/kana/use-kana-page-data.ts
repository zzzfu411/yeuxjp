"use client"

import { useMemo } from "react"
import { kanaData } from "@/data/kana-data"
import {
  filterKanaByProgress,
  getKanaProgress,
  getKanaRowsForData,
  getKanaSetData,
  KANA_ROWS,
  type KanaSet,
} from "@/lib/kana-page-model"

type IsKanaMastered = (romaji: string) => boolean

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

export function useKanaPageData(kanaSet: KanaSet, onlyUnmastered: boolean, isMastered: IsKanaMastered): KanaPageData {
  const seion = useMemo(() => getKanaSetData(kanaData, "seion"), [])
  const dakuonHandakuon = useMemo(() => getKanaSetData(kanaData, "dakuon"), [])
  const yoon = useMemo(() => getKanaSetData(kanaData, "yoon"), [])
  const special = useMemo(() => getKanaSetData(kanaData, "special"), [])
  const seionDakuon = useMemo(
    () => kanaData.filter((item) => item.type === "seion" || item.type === "dakuon" || item.type === "handakuon"),
    []
  )

  const visibleSeion = useMemo(
    () => filterKanaByProgress(seion, onlyUnmastered, isMastered),
    [isMastered, onlyUnmastered, seion]
  )
  const visibleDakuonHandakuon = useMemo(
    () => filterKanaByProgress(dakuonHandakuon, onlyUnmastered, isMastered),
    [dakuonHandakuon, isMastered, onlyUnmastered]
  )
  const visibleYoon = useMemo(
    () => filterKanaByProgress(yoon, onlyUnmastered, isMastered),
    [isMastered, onlyUnmastered, yoon]
  )
  const visibleSpecial = useMemo(
    () => filterKanaByProgress(special, onlyUnmastered, isMastered),
    [isMastered, onlyUnmastered, special]
  )
  const visibleSeionDakuon = useMemo(
    () => filterKanaByProgress(seionDakuon, onlyUnmastered, isMastered),
    [isMastered, onlyUnmastered, seionDakuon]
  )

  const activeData = useMemo(() => getKanaSetData(kanaData, kanaSet), [kanaSet])
  const activeProgress = useMemo(() => getKanaProgress(activeData, isMastered), [activeData, isMastered])

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
