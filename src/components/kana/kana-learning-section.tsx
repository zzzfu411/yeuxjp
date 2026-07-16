"use client"

import type { ReactNode } from "react"
import type { Kana } from "@/data/kana-data"
import { cn } from "@/lib/utils"
import { KanaBanner, type KanaBannerKey } from "@/components/kana/kana-banner"
import { KanaGrid } from "@/components/kana/kana-grid"
import type { KanaMode } from "@/components/kana/kana-controls"
import type { KanaId } from "@/lib/kana-id"

interface KanaLearningSectionProps {
  banner?: KanaBannerKey
  title?: string
  description?: ReactNode
  data: Kana[]
  mode: KanaMode
  rows: readonly string[]
  columns: 3 | 5
  showRomaji: boolean
  isMastered: (id: KanaId) => boolean
  onToggleMastered: (id: KanaId) => void
  className?: string
  copyClassName?: string
  descriptionClassName?: string
}

export function KanaLearningSection({
  banner,
  title,
  description,
  data,
  mode,
  rows,
  columns,
  showRomaji,
  isMastered,
  onToggleMastered,
  className,
  copyClassName,
  descriptionClassName,
}: KanaLearningSectionProps) {
  return (
    <div className={cn("w-full space-y-6 flex flex-col items-center", className)}>
      {banner && <KanaBanner banner={banner} />}

      {(title || description) && (
        <div className={cn("text-center space-y-2 max-w-2xl mx-auto", copyClassName)}>
          {title && <h2 className="text-lg font-bold">{title}</h2>}
          {description && (
            <div className={cn("text-xs text-muted-foreground leading-relaxed", descriptionClassName)}>
              {description}
            </div>
          )}
        </div>
      )}

      <KanaGrid
        data={data}
        mode={mode}
        rows={[...rows]}
        columns={columns}
        showRomaji={showRomaji}
        isMastered={isMastered}
        onToggleMastered={onToggleMastered}
      />
    </div>
  )
}
