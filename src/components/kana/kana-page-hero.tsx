"use client"

import { GlossaryTerm } from "@/components/ui/glossary"

export function KanaPageHero() {
  return (
    <header className="mx-auto max-w-3xl text-center">
      <p className="eyebrow">かな帖 · Kana practice</p>
      <h1 className="mt-2 font-brush text-4xl sm:text-5xl">五十音图 (Gojūon)</h1>
      <p className="font-scribble mt-1 text-lg text-muted-foreground">listen, trace, remember</p>
      <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
        日语的基础。轻点字格听发音；
        <span className="font-semibold text-foreground">
          Hiragana（<GlossaryTerm termId="hiragana">平假名</GlossaryTerm>）
        </span>
        写原生词，
        <span className="font-semibold text-foreground">
          Katakana（<GlossaryTerm termId="katakana">片假名</GlossaryTerm>）
        </span>
        写外来语。
      </p>
    </header>
  )
}
