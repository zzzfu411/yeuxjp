"use client"

import { GlossaryTerm } from "@/components/ui/glossary"

export function KanaPageHero() {
  return (
    <div className="text-center space-y-4">
      <h1 className="font-brush text-4xl tracking-tight">五十音图 (Gojūon)</h1>
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
  )
}
