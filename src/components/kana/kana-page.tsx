"use client"

import { useCallback, useMemo, useState, Suspense } from "react"
import { useKanaProgress } from "@/lib/kana-progress"
import { GlossaryTerm } from "@/components/ui/glossary"
import { NextStepCard } from "@/components/learning/next-step-card"
import { SpeechSettingsBar } from "@/components/ui/speech-preferences"
import { KanaLearningSection } from "@/components/kana/kana-learning-section"
import { KanaControls } from "@/components/kana/kana-controls"
import { useKanaPageControls } from "@/components/kana/use-kana-page-controls"
import { useKanaPageData } from "@/components/kana/use-kana-page-data"
import { PracticeSaveError } from "@/components/practice/practice-save-error"

function KanaPageContent() {
  const {
    mode,
    setMode,
    kanaSet,
    setKanaSet,
    showRomaji,
    onlyUnmastered,
    toggleShowRomaji,
    toggleOnlyUnmastered,
  } = useKanaPageControls()
  const [saveError, setSaveError] = useState(false)
  const { isMastered, toggleMastered, clearMastered } = useKanaProgress()

  const {
    activeProgress,
    rows,
    visibleSeion,
    visibleDakuonHandakuon,
    visibleYoon,
    visibleSpecial,
    visibleSeionDakuon,
  } = useKanaPageData(kanaSet, onlyUnmastered, isMastered)

  const handleClearMastered = useCallback(() => {
    if (typeof window === "undefined") return
    const ok = window.confirm("确认清空假名掌握进度吗？")
    if (!ok) return
    const saved = clearMastered()
    setSaveError(!saved)
  }, [clearMastered])

  const handleToggleMastered = useCallback(
    (romaji: string) => {
      const saved = toggleMastered(romaji)
      setSaveError(!saved)
    },
    [toggleMastered]
  )

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
        onToggleRomaji={toggleShowRomaji}
        onToggleOnlyUnmastered={toggleOnlyUnmastered}
        onClearMastered={handleClearMastered}
      />
      <PracticeSaveError show={saveError} />
      <SpeechSettingsBar className="max-w-3xl" />

      {kanaSet === "seion" && (
        <KanaLearningSection
          banner="seion"
          data={visibleSeion}
          mode={mode}
          rows={rows.seion}
          columns={5}
          showRomaji={showRomaji}
          isMastered={isMastered}
          onToggleMastered={handleToggleMastered}
        />
      )}
      {kanaSet === "dakuon" && (
        <KanaLearningSection
          banner="dakuon"
          data={visibleDakuonHandakuon}
          mode={mode}
          rows={rows.dakuon}
          columns={5}
          showRomaji={showRomaji}
          isMastered={isMastered}
          onToggleMastered={handleToggleMastered}
        />
      )}
      {kanaSet === "yoon" && (
        <KanaLearningSection
          banner="yoon"
          data={visibleYoon}
          mode={mode}
          rows={rows.yoon}
          columns={3}
          showRomaji={showRomaji}
          isMastered={isMastered}
          onToggleMastered={handleToggleMastered}
        />
      )}
      {kanaSet === "special" && (
        <KanaLearningSection
          banner="sokuon"
          className="space-y-4"
          descriptionClassName="text-sm"
          description={
            <p>
              促音用小写的「っ/ッ」表示，读的时候不单独发音，而是让后面的子音“加倍”（比如：きて vs きって）。
              <br />
              建议：先用朗读按钮反复听辨，再用笔顺动画记住写法与大小。
            </p>
          }
          data={visibleSpecial}
          mode={mode}
          rows={rows.special}
          columns={3}
          showRomaji={showRomaji}
          isMastered={isMastered}
          onToggleMastered={handleToggleMastered}
        />
      )}

      {kanaSet === "all" && (
        <div className="w-full space-y-10 flex flex-col items-center">
          <KanaLearningSection
            banner="all"
            title="清音 + 浊音/半浊音"
            copyClassName="space-y-1"
            description="建议先掌握清音，再逐步解锁后两类。"
            data={visibleSeionDakuon}
            mode={mode}
            rows={rows.seionDakuon}
            columns={5}
            showRomaji={showRomaji}
            isMastered={isMastered}
            onToggleMastered={handleToggleMastered}
          />

          <KanaLearningSection
            title="拗音"
            copyClassName="space-y-1"
            description="由「い段 + 小ゃ/ゅ/ょ」组合而成，读音会收缩。"
            data={visibleYoon}
            mode={mode}
            rows={rows.yoon}
            columns={3}
            showRomaji={showRomaji}
            isMastered={isMastered}
            onToggleMastered={handleToggleMastered}
          />

          <KanaLearningSection
            title="促音（っ / ッ）"
            copyClassName="space-y-1"
            description="不单独发音，表示后续子音加倍（例：きって）。"
            data={visibleSpecial}
            mode={mode}
            rows={rows.special}
            columns={3}
            showRomaji={showRomaji}
            isMastered={isMastered}
            onToggleMastered={handleToggleMastered}
          />
        </div>
      )}

      <NextStepCard className="max-w-3xl" />
    </div>
  )
}

export function KanaPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20">加载中...</div>}>
      <KanaPageContent />
    </Suspense>
  )
}
