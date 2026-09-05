"use client"

import { GlossaryTerm } from "@/components/ui/glossary"
import type { KanaSet } from "@/lib/kana-page-model"

export function KanaSetHint({ kanaSet }: { kanaSet: KanaSet }) {
  if (kanaSet === "seion") {
    return (
      <>
        <GlossaryTerm termId="seion">清音</GlossaryTerm>：不带「゛/゜」的基础音，建议先把这一组练熟。
        <span className="font-jp ml-2 text-foreground/70">例：か・さ・た・は</span>
      </>
    )
  }

  if (kanaSet === "dakuon") {
    return (
      <>
        <GlossaryTerm termId="dakuon">浊音</GlossaryTerm>/<GlossaryTerm termId="handakuon">半浊音</GlossaryTerm>
        ：带「゛/゜」的变化音。
        <span className="font-jp ml-2 text-foreground/70">例：か→が、は→ぱ</span>
      </>
    )
  }

  if (kanaSet === "yoon") {
    return (
      <>
        <GlossaryTerm termId="yoon">拗音</GlossaryTerm>：由「い段 + 小ゃ/ゅ/ょ」组成，两个假名合起来读一拍。
        <span className="font-jp ml-2 text-foreground/70">例：きゃ・しゅ・ちょ</span>
      </>
    )
  }

  if (kanaSet === "special") {
    return (
      <>
        <GlossaryTerm termId="sokuon">促音</GlossaryTerm>：小「っ/ッ」本身不发音，要在后面的辅音前停一拍。
        <span className="font-jp ml-2 text-foreground/70">例：きて vs きって</span>
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
}
