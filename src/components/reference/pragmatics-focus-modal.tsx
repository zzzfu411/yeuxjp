import Link from "next/link"
import { CheckCircle2, ChevronLeft, ChevronRight, Crown, MessageCircle, XCircle } from "lucide-react"
import type { PragmaticScenario } from "@/data/pragmatics-data"
import { buttonVariants } from "@/components/ui/button"
import { SpeakButton } from "@/components/ui/speak-button"
import { UrlControlledReferenceModal } from "@/components/reference/url-controlled-reference-modal"
import { cn } from "@/lib/utils"

const RESPONSE_TYPE_LABEL = {
  Good: "合适",
  Bad: "不推荐",
  Native: "自然表达",
  Anime: "作品用语",
} as const

interface PragmaticsFocusModalProps {
  scenario: PragmaticScenario
  selectedPosition: number
  total: number
  closeHref: string
  nextHref: string
  prevHref: string
}

export function PragmaticsFocusModal({
  scenario,
  selectedPosition,
  total,
  closeHref,
  nextHref,
  prevHref,
}: PragmaticsFocusModalProps) {
  const titleId = "pragmatics-focus-modal-title"
  const descriptionId = "pragmatics-focus-modal-description"

  return (
    <UrlControlledReferenceModal
      closeHref={closeHref}
      nextHref={nextHref}
      prevHref={prevHref}
      className="paper-sheet flex h-[min(85vh,52rem)] max-w-2xl flex-col overflow-hidden border border-border/60 bg-card p-0 shadow-paper"
      ariaLabelledBy={titleId}
      ariaDescribedBy={descriptionId}
    >
      <span className="paper-tape top-0" aria-hidden="true" />
      <div className="flex-1 space-y-8 overflow-y-auto px-5 pb-8 pt-10 sm:px-8">
        <div className="space-y-4 border-b border-border/45 pb-7">
          <div className="eyebrow flex items-center gap-2 text-base text-accent">
            <MessageCircle className="w-4 h-4" />
            场景：{scenario.situation}
          </div>
          <h2 id={titleId} className="font-brush text-3xl font-normal sm:text-4xl">{scenario.title}</h2>
          <div id={descriptionId} className="ledger-row border-y border-border/45 px-4 py-5 text-lg font-medium leading-relaxed text-foreground sm:text-xl">
            {scenario.context}
          </div>
        </div>

        <div className="border-l-2 border-accent/45 bg-primary/[0.035] px-5 py-4 text-base italic leading-relaxed text-muted-foreground">
          <span className="eyebrow mb-2 block text-sm not-italic text-foreground">
            使用背景 · context
          </span>
          {scenario.culturalNote}
        </div>

        <div className="space-y-5">
          <h3 className="eyebrow border-b border-border/45 pb-2 text-base text-foreground">
            表达说明 · response notes
          </h3>
          <div className="border-t border-border/30">
            {scenario.responses.map((response, index) => {
              const isBad = response.type === "Bad"
              const isNative = response.type === "Native" || response.type === "Anime"

              return (
                <div
                  key={index}
                  className={cn(
                    "ledger-row flex flex-col gap-3 border-b border-border/45 px-1 py-5 transition-colors",
                    isBad && "border-l-2 border-l-accent/55 pl-4",
                    isNative && "bg-primary/[0.035]"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "font-scribble border-b border-dashed border-border/70 px-0.5 text-sm text-muted-foreground",
                        isBad && "border-accent/60 text-accent",
                        isNative && "text-foreground"
                      )}
                    >
                      {RESPONSE_TYPE_LABEL[response.type]}
                    </span>
                    {isBad && <XCircle className="h-5 w-5 text-accent/75" />}
                    {response.type === "Good" && <CheckCircle2 className="h-5 w-5 text-foreground/55" />}
                    {isNative && <Crown className="w-5 h-5 text-foreground/55" />}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="font-jp text-2xl font-semibold leading-relaxed text-foreground" lang="ja">
                        {response.expression}
                      </div>
                      <SpeakButton text={response.expression} label="朗读表达" className="shrink-0" />
                    </div>
                    <div className="text-base text-muted-foreground">{response.explanation}</div>
                  </div>
                </div>
              )
            })}
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
