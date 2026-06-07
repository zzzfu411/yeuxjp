"use client"

import { useEffect, useMemo, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { kanaData } from "@/data/kana-data"
import { KanaGrid } from "@/components/kana/kana-grid"
import { cn } from "@/lib/utils"
import { Eye, EyeOff } from "lucide-react"
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
import { GlossaryButton, GlossaryTerm } from "@/components/ui/glossary"
import { NextStepCard } from "@/components/learning/next-step-card"
import { SpeechSettingsBar } from "@/components/ui/speech-preferences"
import { KanaBanner } from "@/components/kana/kana-banner"

function KanaPageContent() {
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<"hiragana" | "katakana">("hiragana")
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

      <div className="flex p-1 bg-secondary rounded-lg">
        <button
          onClick={() => setMode("hiragana")}
          className={cn(
            "px-4 sm:px-8 py-2 rounded-md text-sm font-medium transition-all",
            mode === "hiragana" 
              ? "bg-background text-foreground shadow-sm" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          平假名 (Hiragana)
        </button>
        <button
          onClick={() => setMode("katakana")}
          className={cn(
            "px-4 sm:px-8 py-2 rounded-md text-sm font-medium transition-all",
            mode === "katakana" 
              ? "bg-background text-foreground shadow-sm" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          片假名 (Katakana)
        </button>
      </div>

      <div className="flex flex-col items-center gap-3">
        <div className="flex p-1 bg-secondary rounded-lg">
          <button
            onClick={() => setKanaSet("seion")}
            className={cn(
              "px-4 sm:px-6 py-2 rounded-md text-sm font-medium transition-all",
              kanaSet === "seion"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            清音
          </button>
          <button
            onClick={() => setKanaSet("dakuon")}
            className={cn(
              "px-4 sm:px-6 py-2 rounded-md text-sm font-medium transition-all",
              kanaSet === "dakuon"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            浊音/半浊音
          </button>
          <button
            onClick={() => setKanaSet("yoon")}
            className={cn(
              "px-4 sm:px-6 py-2 rounded-md text-sm font-medium transition-all",
              kanaSet === "yoon"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            拗音
          </button>
          <button
            onClick={() => setKanaSet("special")}
            className={cn(
              "px-4 sm:px-6 py-2 rounded-md text-sm font-medium transition-all",
              kanaSet === "special"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            促音(っ)
          </button>
          <button
            onClick={() => setKanaSet("all")}
            className={cn(
              "px-4 sm:px-6 py-2 rounded-md text-sm font-medium transition-all",
              kanaSet === "all"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            全部
          </button>
        </div>

        <div className="text-xs text-muted-foreground text-center max-w-2xl leading-relaxed">
          {kanaSetHint}{" "}
          <GlossaryButton className="ml-2 h-auto px-2 py-1 rounded-md">术语表</GlossaryButton>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => setShowRomaji(v => !v)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors",
              "bg-background hover:bg-secondary/60"
            )}
          >
            {showRomaji ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showRomaji ? "隐藏罗马音" : "显示罗马音"}
          </button>

          <button
            onClick={() => setOnlyUnmastered(v => !v)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors",
              "bg-background hover:bg-secondary/60"
            )}
          >
            {onlyUnmastered ? "显示全部" : "只看未掌握"}
          </button>

          <button
            onClick={() => {
              if (typeof window === "undefined") return
              const ok = window.confirm("确认清空假名掌握进度吗？")
              if (ok) clearMastered()
            }}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors",
              "bg-background hover:bg-secondary/60 text-muted-foreground hover:text-foreground"
            )}
          >
            清空进度
          </button>
        </div>

        <div className="text-xs text-muted-foreground font-mono">
          Progress: {activeProgress.learned}/{activeProgress.total}
        </div>

        {showRomaji && (
          <div className="text-xs text-muted-foreground text-center max-w-2xl">
            小提示：熟悉后可隐藏 <GlossaryTerm termId="romaji">罗马音</GlossaryTerm>，训练直接读{" "}
            <GlossaryTerm termId="kana">假名</GlossaryTerm>。
          </div>
        )}
      </div>

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
