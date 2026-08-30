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
        "paper-slip relative mx-auto min-h-32 w-full max-w-3xl overflow-hidden",
        className
      )}
    >
      <span className="paper-tape" aria-hidden="true" />
      <div className="absolute inset-y-0 right-0 w-[44%] opacity-65 dark:opacity-45">
        <Image
          src={meta.src}
          alt=""
          fill
          sizes="(max-width: 768px) 44vw, 338px"
          className="object-cover mix-blend-multiply dark:mix-blend-screen dark:invert"
          priority={banner === "seion"}
        />
      </div>
      <div className="relative flex min-h-32 w-[68%] flex-col justify-center px-5 py-6 sm:px-7">
        <div className="eyebrow">かな練習</div>
        <h2 className="mt-1 text-base font-semibold sm:text-lg">{meta.title}</h2>
        <div className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
          {meta.sub}
        </div>
      </div>
    </div>
  )
}
