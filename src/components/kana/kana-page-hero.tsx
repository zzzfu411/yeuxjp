"use client"

import { GlossaryTerm } from "@/components/ui/glossary"

export function KanaPageHero() {
  return (
    <header className="mx-auto max-w-3xl text-center">
      <h1 className="font-brush text-4xl sm:text-5xl">五十音图</h1>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
        轻点字格听发音、看笔顺。支持 <GlossaryTerm termId="hiragana">平假名</GlossaryTerm> 与 <GlossaryTerm termId="katakana">片假名</GlossaryTerm>。
      </p>
    </header>
  )
}
