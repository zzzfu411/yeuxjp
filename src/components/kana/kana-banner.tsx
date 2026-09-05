"use client"

import { cn } from "@/lib/utils"

export type KanaBannerKey = "seion" | "dakuon" | "yoon" | "sokuon" | "all"

const sectionTitles: Record<KanaBannerKey, string> = {
  seion: "清音",
  dakuon: "浊音 / 半浊音",
  yoon: "拗音",
  sokuon: "促音",
  all: "假名全图",
}

export function KanaBanner({ banner, className }: { banner: KanaBannerKey; className?: string }) {
  return (
    <div className={cn("mx-auto w-full max-w-3xl", className)}>
      <h2 className="text-base font-medium">{sectionTitles[banner]}</h2>
    </div>
  )
}
