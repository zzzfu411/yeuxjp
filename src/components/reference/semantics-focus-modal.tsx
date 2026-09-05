import Link from "next/link"
import { ArrowRightLeft, ChevronLeft, ChevronRight, Lightbulb } from "lucide-react"
import type { NuancePoint } from "@/data/semantics-data"
import { buttonVariants } from "@/components/ui/button"
import { SpeakButton } from "@/components/ui/speak-button"
import { UrlControlledReferenceModal } from "@/components/reference/url-controlled-reference-modal"

interface SemanticsFocusModalProps {
  point: NuancePoint
  selectedPosition: number
  total: number
  closeHref: string
  nextHref: string
  prevHref: string
}

export function SemanticsFocusModal({
  point,
  selectedPosition,
  total,
  closeHref,
  nextHref,
  prevHref,
}: SemanticsFocusModalProps) {
  const titleId = "semantics-focus-modal-title"
  const descriptionId = "semantics-focus-modal-description"

  return (
    <UrlControlledReferenceModal
      closeHref={closeHref}
      nextHref={nextHref}
      prevHref={prevHref}
      className="paper-sheet flex h-[min(85vh,52rem)] max-w-3xl flex-col overflow-hidden border border-border/60 bg-card p-0 shadow-paper"
      ariaLabelledBy={titleId}
      ariaDescribedBy={descriptionId}
    >
      <span className="paper-tape top-0" aria-hidden="true" />
      <div className="flex-1 space-y-8 overflow-y-auto px-5 pb-8 pt-10 sm:px-8">
        <div className="border-b border-border/50 pb-6 text-center">
          <p className="eyebrow mb-3">意味 · Nuance note</p>
          <h2 id={titleId} className="flex flex-wrap items-center justify-center gap-3 font-jp text-3xl font-medium sm:text-4xl" lang="ja">
            <span>{point.pair[0]}</span>
            <ArrowRightLeft className="h-6 w-6 shrink-0 text-muted-foreground/55 sm:h-7 sm:w-7" />
            <span>{point.pair[1]}</span>
          </h2>
          <div className="font-scribble mt-2 text-lg text-muted-foreground">
            {point.title}
          </div>
        </div>

        <div className="grid gap-9 md:grid-cols-2 md:gap-8">
          <div className="space-y-6">
            <div className="flex items-start gap-3">
              <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              <div>
                <h3 className="eyebrow mb-2 text-base text-foreground">核心差异 · distinction</h3>
                <p id={descriptionId} className="text-base leading-relaxed text-foreground/85 sm:text-lg">
                  {point.explanation}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 border-y border-border/50">
              <div className="ledger-row border-b-0 border-r border-border/40 px-3 py-5 text-center">
                <div className="font-jp mb-2 text-xl font-semibold" lang="ja">{point.pair[0]}</div>
                <div className="text-sm text-muted-foreground">{point.meaning[0]}</div>
              </div>
              <div className="ledger-row border-b-0 px-3 py-5 text-center">
                <div className="font-jp mb-2 text-xl font-semibold" lang="ja">{point.pair[1]}</div>
                <div className="text-sm text-muted-foreground">{point.meaning[1]}</div>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border/70" />
              <span className="eyebrow text-sm">语境例句 · in context</span>
              <div className="h-px flex-1 bg-border/70" />
            </div>

            <div className="border-t border-border/35">
              {point.examples.map((example, index) => (
                <div key={index} className="ledger-row space-y-2 border-b border-border/45 px-1 py-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="font-jp text-xl font-medium leading-relaxed text-foreground" lang="ja">{example.sentence}</div>
                    <SpeakButton text={example.sentence} label="朗读例句" className="shrink-0" />
                  </div>
                  <div className="text-base text-muted-foreground">{example.translation}</div>
                  <div className="mt-3 flex items-start gap-3 border-t border-dashed border-border/45 pt-3 text-sm text-foreground/80">
                    <span className="seal-stamp shrink-0 text-xs">提示</span>
                    <span className="leading-relaxed">{example.nuance}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between border-t border-border/55 bg-transparent px-3 py-3 sm:px-5">
        <Link href={prevHref} className={buttonVariants({ variant: "ghost", className: "gap-2 rounded-none border-0 bg-transparent pl-1 font-normal shadow-none hover:translate-y-0" })}>
          <ChevronLeft className="w-5 h-5" /> 上一条
        </Link>
        <div className="font-scribble text-base text-muted-foreground">
          {selectedPosition} / {total}
        </div>
        <Link href={nextHref} className={buttonVariants({ variant: "ghost", className: "gap-2 rounded-none border-0 bg-transparent pr-1 font-normal shadow-none hover:translate-y-0" })}>
          下一条 <ChevronRight className="w-5 h-5" />
        </Link>
      </div>
    </UrlControlledReferenceModal>
  )
}
