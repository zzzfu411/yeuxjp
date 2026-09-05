"use client"

import type { KanaSet } from "@/lib/kana-page-model"
import { KanaLearningSection } from "@/components/kana/kana-learning-section"
import type { KanaMode } from "@/components/kana/kana-controls"
import type { KanaPageData } from "@/components/kana/use-kana-page-data"
import type { KanaId } from "@/lib/kana-id"

interface KanaPageSectionsProps {
  kanaSet: KanaSet
  pageData: KanaPageData
  mode: KanaMode
  showRomaji: boolean
  isMastered: (id: KanaId) => boolean
  onToggleMastered: (id: KanaId) => void
}

export function KanaPageSections({
  kanaSet,
  pageData,
  mode,
  showRomaji,
  isMastered,
  onToggleMastered,
}: KanaPageSectionsProps) {
  const {
    rows,
    visibleSeion,
    visibleDakuonHandakuon,
    visibleYoon,
    visibleSpecial,
    visibleSeionDakuon,
  } = pageData

  if (kanaSet === "seion") {
    return (
      <KanaLearningSection
        banner="seion"
        data={visibleSeion}
        mode={mode}
        rows={rows.seion}
        columns={5}
        showRomaji={showRomaji}
        isMastered={isMastered}
        onToggleMastered={onToggleMastered}
      />
    )
  }

  if (kanaSet === "dakuon") {
    return (
      <KanaLearningSection
        banner="dakuon"
        data={visibleDakuonHandakuon}
        mode={mode}
        rows={rows.dakuon}
        columns={5}
        showRomaji={showRomaji}
        isMastered={isMastered}
        onToggleMastered={onToggleMastered}
      />
    )
  }

  if (kanaSet === "yoon") {
    return (
      <KanaLearningSection
        banner="yoon"
        data={visibleYoon}
        mode={mode}
        rows={rows.yoon}
        columns={3}
        showRomaji={showRomaji}
        isMastered={isMastered}
        onToggleMastered={onToggleMastered}
      />
    )
  }

  if (kanaSet === "special") {
    return (
      <KanaLearningSection
        banner="sokuon"
        className="space-y-4"
        descriptionClassName="text-sm"
        description={
          <p>
            促音用小写的「っ/ッ」表示。它本身不发音，读到这里时要在后面的辅音前停一拍（比如：きて vs きって）。
            <br />
            可以先用朗读按钮反复比较，再用笔顺动画记住写法和大小。
          </p>
        }
        data={visibleSpecial}
        mode={mode}
        rows={rows.special}
        columns={3}
        showRomaji={showRomaji}
        isMastered={isMastered}
        onToggleMastered={onToggleMastered}
      />
    )
  }

  return (
    <div className="flex w-full flex-col items-center space-y-14">
      <KanaLearningSection
        banner="all"
        title="清音 + 浊音/半浊音"
        copyClassName="space-y-1"
        description="先掌握清音，再学习浊音和半浊音。"
        data={visibleSeionDakuon}
        mode={mode}
        rows={rows.seionDakuon}
        columns={5}
        showRomaji={showRomaji}
        isMastered={isMastered}
        onToggleMastered={onToggleMastered}
      />

      <KanaLearningSection
        title="拗音"
        copyClassName="space-y-1"
        description="由「い段 + 小ゃ/ゅ/ょ」组合而成，两个假名合起来读一拍。"
        data={visibleYoon}
        mode={mode}
        rows={rows.yoon}
        columns={3}
        showRomaji={showRomaji}
        isMastered={isMastered}
        onToggleMastered={onToggleMastered}
      />

      <KanaLearningSection
        title="促音（っ / ッ）"
        copyClassName="space-y-1"
        description="本身不发音，要在后面的辅音前停一拍（例：きって）。"
        data={visibleSpecial}
        mode={mode}
        rows={rows.special}
        columns={3}
        showRomaji={showRomaji}
        isMastered={isMastered}
        onToggleMastered={onToggleMastered}
      />
    </div>
  )
}
