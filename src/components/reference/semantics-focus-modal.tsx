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
      className="max-w-3xl h-[85vh] flex flex-col p-0"
      ariaLabelledBy={titleId}
      ariaDescribedBy={descriptionId}
    >
      <div className="flex-1 overflow-y-auto p-8 space-y-8">
        <div className="text-center border-b pb-6">
          <h2 id={titleId} className="text-4xl font-bold flex items-center justify-center gap-4 mb-3">
            <span className="text-accent">{point.pair[0]}</span>
            <ArrowRightLeft className="w-8 h-8 text-muted-foreground/50" />
            <span className="text-accent">{point.pair[1]}</span>
          </h2>
          <div className="inline-block bg-secondary px-4 py-1 rounded-full text-sm font-medium text-secondary-foreground">
            {point.title}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <Lightbulb className="w-8 h-8 text-yellow-500 shrink-0" />
              <div>
                <h3 className="font-bold text-xl mb-3">核心差异</h3>
                <p id={descriptionId} className="text-foreground/90 leading-relaxed text-lg">{point.explanation}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-primary/5 p-5 rounded-xl border border-primary/10 text-center">
                <div className="font-bold text-accent mb-2 text-xl">{point.pair[0]}</div>
                <div className="text-sm text-muted-foreground">{point.meaning[0]}</div>
              </div>
              <div className="bg-primary/5 p-5 rounded-xl border border-primary/10 text-center">
                <div className="font-bold text-accent mb-2 text-xl">{point.pair[1]}</div>
                <div className="text-sm text-muted-foreground">{point.meaning[1]}</div>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <div className="h-px bg-border flex-1" />
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">语境例句</span>
              <div className="h-px bg-border flex-1" />
            </div>

            <div className="space-y-4">
              {point.examples.map((example, index) => (
                <div key={index} className="bg-card border p-5 rounded-xl space-y-2 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="font-medium text-xl text-foreground">{example.sentence}</div>
                    <SpeakButton text={example.sentence} label="朗读例句" className="shrink-0" />
                  </div>
                  <div className="text-base text-muted-foreground">{example.translation}</div>
                  <div className="mt-3 pt-3 border-t border-border/50 text-sm font-medium text-accent flex items-start gap-2">
                    <span className="shrink-0">提示</span>
                    <span>{example.nuance}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-t bg-muted/20 flex justify-between items-center shrink-0">
        <Link href={prevHref} className={buttonVariants({ variant: "ghost", className: "gap-2 pl-2" })}>
          <ChevronLeft className="w-5 h-5" /> 上一条
        </Link>
        <div className="text-sm text-muted-foreground font-mono">
          {selectedPosition} / {total}
        </div>
        <Link href={nextHref} className={buttonVariants({ variant: "ghost", className: "gap-2 pr-2" })}>
          下一条 <ChevronRight className="w-5 h-5" />
        </Link>
      </div>
    </UrlControlledReferenceModal>
  )
}
