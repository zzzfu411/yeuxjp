"use client"

import { useCallback, useEffect, useMemo, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { kanaData } from "@/data/kana-data"
import { KanaGrid } from "@/components/kana/kana-grid"
import { useKanaProgress } from "@/lib/kana-progress"
import {
  filterKanaByProgress,
  getKanaProgress,
  getKanaRowsForData,
  getKanaSetData,
  KANA_ROWS,
  parseKanaSet,
  type KanaSet,
} from "@/lib/kana-page-model"
import { GlossaryTerm } from "@/components/ui/glossary"
import { NextStepCard } from "@/components/learning/next-step-card"
import { SpeechSettingsBar } from "@/components/ui/speech-preferences"
import { KanaBanner } from "@/components/kana/kana-banner"
import { KanaControls, type KanaMode } from "@/components/kana/kana-controls"

function KanaPageContent() {
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<KanaMode>("hiragana")
  const [kanaSet, setKanaSet] = useState<KanaSet>("seion")
  const [showRomaji, setShowRomaji] = useState(true)
  const [onlyUnmastered, setOnlyUnmastered] = useState(false)
  const { isMastered, toggleMastered, clearMastered } = useKanaProgress()

  const urlMode = searchParams.get("mode")
  const urlSet = searchParams.get("set")

  useEffect(() => {
    let cancelled = false

    Promise.resolve().then(() => {
      if (cancelled) return

      if (urlMode === "hiragana" || urlMode === "katakana") {
        setMode(urlMode)
      }

      const parsedSet = parseKanaSet(urlSet)
      if (parsedSet) setKanaSet(parsedSet)
    })

    return () => {
      cancelled = true
    }
  }, [urlMode, urlSet])

  const seion = useMemo(() => getKanaSetData(kanaData, "seion"), [])
  const dakuonHandakuon = useMemo(() => getKanaSetData(kanaData, "dakuon"), [])
  const yoon = useMemo(() => getKanaSetData(kanaData, "yoon"), [])
  const special = useMemo(() => getKanaSetData(kanaData, "special"), [])
  const seionDakuon = useMemo(
    () => kanaData.filter((item) => item.type === "seion" || item.type === "dakuon" || item.type === "handakuon"),
    []
  )

  const filterByProgress = (list: typeof kanaData) => filterKanaByProgress(list, onlyUnmastered, isMastered)
  const rowsFor = (rows: readonly string[], list: typeof kanaData) => getKanaRowsForData(rows, list)

  const activeData = useMemo(() => {
    return getKanaSetData(kanaData, kanaSet)
  }, [kanaSet])

  const activeProgress = useMemo(() => {
    return getKanaProgress(activeData, isMastered)
  }, [activeData, isMastered])

  const handleClearMastered = useCallback(() => {
    if (typeof window === "undefined") return
    const ok = window.confirm("确认清空假名掌握进度吗？")
    if (ok) clearMastered()
  }, [clearMastered])

  const kanaSetHint = useMemo(() => {
    if (kanaSet === "seion") {
      return (
        <>
          <GlossaryTerm termId="seion">清音</GlossaryTerm>：不带「゛/゜」的基础音，建议先把这一组练熟。
          <span className="ml-2 font-mono text-foreground/70">例：か・さ・た・は</span>
        </>
      )
    }

    if (kanaSet === "dakuon") {
      return (
        <>
          <GlossaryTerm termId="dakuon">浊音</GlossaryTerm>/<GlossaryTerm termId="handakuon">半浊音</GlossaryTerm>
          ：带「゛/゜」的变化音。
          <span className="ml-2 font-mono text-foreground/70">例：か→が、は→ぱ</span>
        </>
      )
    }

    if (kanaSet === "yoon") {
      return (
        <>
          <GlossaryTerm termId="yoon">拗音</GlossaryTerm>：由「い段 + 小ゃ/ゅ/ょ」组成，读音会“收缩”。
          <span className="ml-2 font-mono text-foreground/70">例：きゃ・しゅ・ちょ</span>
        </>
      )
    }

    if (kanaSet === "special") {
      return (
        <>
          <GlossaryTerm termId="sokuon">促音</GlossaryTerm>：小「っ/ッ」不单独发音，表示后续子音加倍。
          <span className="ml-2 font-mono text-foreground/70">例：きて vs きって</span>
        </>
      )
    }

    return (
      <>
        推荐顺序：<GlossaryTerm termId="seion">清音</GlossaryTerm> →{" "}
        <GlossaryTerm termId="dakuon">浊音</GlossaryTerm>/<GlossaryTerm termId="handakuon">半浊音</GlossaryTerm> →{" "}
        <GlossaryTerm termId="yoon">拗音</GlossaryTerm> → <GlossaryTerm termId="sokuon">促音</GlossaryTerm> →{" "}
        <GlossaryTerm termId="chouon">长音</GlossaryTerm>
      </>
    )
  }, [kanaSet])

  return (
    <div className="container py-10 px-4 mx-auto flex flex-col items-center space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">五十音图 (Gojūon)</h1>
        <p className="text-muted-foreground max-w-2xl text-sm sm:text-base">
          日语的基础。点击卡片听发音。
          <br className="hidden sm:inline" />
          <span className="font-semibold text-primary">
            {" "}
            Hiragana (<GlossaryTerm termId="hiragana">平假名</GlossaryTerm>)
          </span>{" "}
          用于原生词汇，
          <span className="font-semibold text-primary">
            {" "}
            Katakana (<GlossaryTerm termId="katakana">片假名</GlossaryTerm>)
          </span>{" "}
          用于外来语。
        </p>
      </div>

      <KanaControls
        mode={mode}
        kanaSet={kanaSet}
        showRomaji={showRomaji}
        onlyUnmastered={onlyUnmastered}
        progress={activeProgress}
        hint={kanaSetHint}
        onModeChange={setMode}
        onKanaSetChange={setKanaSet}
        onToggleRomaji={() => setShowRomaji((value) => !value)}
        onToggleOnlyUnmastered={() => setOnlyUnmastered((value) => !value)}
        onClearMastered={handleClearMastered}
      />
      <SpeechSettingsBar className="max-w-3xl" />

      {kanaSet === "seion" && (
        <div className="w-full space-y-6 flex flex-col items-center">
          <KanaBanner banner="seion" />
          <KanaGrid
            data={filterByProgress(seion)}
            mode={mode}
            rows={rowsFor(KANA_ROWS.seion, filterByProgress(seion))}
            columns={5}
            showRomaji={showRomaji}
            isMastered={isMastered}
            onToggleMastered={toggleMastered}
          />
        </div>
      )}
      {kanaSet === "dakuon" && (
        <div className="w-full space-y-6 flex flex-col items-center">
          <KanaBanner banner="dakuon" />
          <KanaGrid
            data={filterByProgress(dakuonHandakuon)}
            mode={mode}
            rows={rowsFor(KANA_ROWS.dakuon, filterByProgress(dakuonHandakuon))}
            columns={5}
            showRomaji={showRomaji}
            isMastered={isMastered}
            onToggleMastered={toggleMastered}
          />
        </div>
      )}
      {kanaSet === "yoon" && (
        <div className="w-full space-y-6 flex flex-col items-center">
          <KanaBanner banner="yoon" />
          <KanaGrid
            data={filterByProgress(yoon)}
            mode={mode}
            rows={rowsFor(KANA_ROWS.yoon, filterByProgress(yoon))}
            columns={3}
            showRomaji={showRomaji}
            isMastered={isMastered}
            onToggleMastered={toggleMastered}
          />
        </div>
      )}
      {kanaSet === "special" && (
        <div className="w-full space-y-4 flex flex-col items-center">
          <KanaBanner banner="sokuon" />
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <p className="text-sm text-muted-foreground leading-relaxed">
              促音用小写的「っ/ッ」表示，读的时候不单独发音，而是让后面的子音“加倍”（比如：きて vs きって）。
              <br />
              建议：先用朗读按钮反复听辨，再用笔顺动画记住写法与大小。
            </p>
          </div>
          <KanaGrid
            data={filterByProgress(special)}
            mode={mode}
            rows={rowsFor(KANA_ROWS.special, filterByProgress(special))}
            columns={3}
            showRomaji={showRomaji}
            isMastered={isMastered}
            onToggleMastered={toggleMastered}
          />
        </div>
      )}

      {kanaSet === "all" && (
        <div className="w-full space-y-10 flex flex-col items-center">
          <KanaBanner banner="all" />
          <div className="text-center space-y-1">
            <h2 className="text-lg font-bold">清音 + 浊音/半浊音</h2>
            <p className="text-xs text-muted-foreground">建议先掌握清音，再逐步解锁后两类。</p>
          </div>
          <KanaGrid
            data={filterByProgress(seionDakuon)}
            mode={mode}
            rows={rowsFor(
              [...KANA_ROWS.seion, ...KANA_ROWS.dakuon],
              filterByProgress(seionDakuon)
            )}
            columns={5}
            showRomaji={showRomaji}
            isMastered={isMastered}
            onToggleMastered={toggleMastered}
          />

          <div className="text-center space-y-1">
            <h2 className="text-lg font-bold">拗音</h2>
            <p className="text-xs text-muted-foreground">由「い段 + 小ゃ/ゅ/ょ」组合而成，读音会收缩。</p>
          </div>
          <KanaGrid
            data={filterByProgress(yoon)}
            mode={mode}
            rows={rowsFor(KANA_ROWS.yoon, filterByProgress(yoon))}
            columns={3}
            showRomaji={showRomaji}
            isMastered={isMastered}
            onToggleMastered={toggleMastered}
          />

          <div className="text-center space-y-1">
            <h2 className="text-lg font-bold">促音（っ / ッ）</h2>
            <p className="text-xs text-muted-foreground">不单独发音，表示后续子音加倍（例：きって）。</p>
          </div>
          <KanaGrid
            data={filterByProgress(special)}
            mode={mode}
            rows={rowsFor(KANA_ROWS.special, filterByProgress(special))}
            columns={3}
            showRomaji={showRomaji}
            isMastered={isMastered}
            onToggleMastered={toggleMastered}
          />
        </div>
      )}

      <NextStepCard className="max-w-3xl" />
    </div>
  )
}

export default function KanaPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20">加载中...</div>}>
      <KanaPageContent />
    </Suspense>
  )
}
