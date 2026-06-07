"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"

export type KanaBannerKey = "seion" | "dakuon" | "yoon" | "sokuon" | "all"

const BANNER_META: Record<KanaBannerKey, { src: string; title: string; sub: string }> = {
  seion: {
    src: "/assets/kana/kana-seion.webp",
    title: "清音 (Seion)",
    sub: "不带「゛/゜」的基础音 — 建议先把这一组练熟。",
  },
  dakuon: {
    src: "/assets/kana/kana-dakuon.webp",
    title: "浊音 / 半浊音",
    sub: "带「゛/゜」的变化音。例：か→が、は→ぱ。",
  },
  yoon: {
    src: "/assets/kana/kana-yoon.webp",
    title: "拗音 (Yōon)",
    sub: "「い段 + 小ゃ/ゅ/ょ」组合，读音会收缩。",
  },
  sokuon: {
    src: "/assets/kana/kana-sokuon.webp",
    title: "促音 (Sokuon)",
    sub: "小「っ/ッ」不单独发音，表示后续子音加倍。",
  },
  all: {
    src: "/assets/kana/kana-all.webp",
    title: "假名全图",
    sub: "清音 → 浊/半浊 → 拗音 → 促音 → 长音，建议按此顺序练。",
  },
}

interface KanaBannerProps {
  banner: KanaBannerKey
  className?: string
}

export function KanaBanner({ banner, className }: KanaBannerProps) {
  const meta = BANNER_META[banner]
  return (
    <div
      className={cn(
        "relative w-full max-w-3xl mx-auto h-28 sm:h-36 rounded-2xl overflow-hidden ring-1 ring-border/60 shadow-sm",
        className
      )}
    >
      <Image
        src={meta.src}
        alt=""
        fill
        sizes="(max-width: 768px) 100vw, 768px"
        className="object-cover"
        priority={banner === "seion"}
      />
      {/* Readability scrim — fades from solid background-ish color on the left
          into transparent on the right so artwork on the right stays visible. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-background/0"
      />
      <div className="relative h-full flex flex-col justify-center px-5 sm:px-7">
        <div className="text-base sm:text-lg font-bold text-foreground">{meta.title}</div>
        <div className="text-xs sm:text-sm text-muted-foreground max-w-[60%] leading-relaxed">
          {meta.sub}
        </div>
      </div>
    </div>
  )
}
