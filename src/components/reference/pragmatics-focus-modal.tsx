import Link from "next/link"
import { CheckCircle2, ChevronLeft, ChevronRight, Crown, MessageCircle, XCircle } from "lucide-react"
import type { PragmaticScenario } from "@/data/pragmatics-data"
import { buttonVariants } from "@/components/ui/button"
import { SpeakButton } from "@/components/ui/speak-button"
import { UrlControlledReferenceModal } from "@/components/reference/url-controlled-reference-modal"
import { cn } from "@/lib/utils"

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
      className="max-w-2xl h-[85vh] flex flex-col p-0"
      ariaLabelledBy={titleId}
      ariaDescribedBy={descriptionId}
    >
      <div className="flex-1 overflow-y-auto p-8 space-y-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-wider text-sm">
            <MessageCircle className="w-4 h-4" />
            场景：{scenario.situation}
          </div>
          <h2 id={titleId} className="text-4xl font-bold tracking-tight">{scenario.title}</h2>
          <div id={descriptionId} className="text-xl font-medium text-foreground bg-muted/30 p-6 rounded-xl border-l-4 border-primary">
            {scenario.context}
          </div>
        </div>

        <div className="bg-secondary/40 p-6 rounded-xl text-base text-muted-foreground italic border border-border/50 shadow-sm">
          <span className="font-bold not-italic text-foreground/80 block mb-2 text-sm uppercase tracking-wide">
            文化背景
          </span>
          {scenario.culturalNote}
        </div>

        <div className="space-y-5">
          <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground border-b pb-2">
            回答分析
          </h3>
          <div className="grid gap-5">
            {scenario.responses.map((response, index) => {
              const isBad = response.type === "Bad"
              const isNative = response.type === "Native" || response.type === "Anime"

              return (
                <div
                  key={index}
                  className={cn(
                    "flex flex-col gap-3 p-5 rounded-xl border transition-all shadow-sm",
                    isBad
                      ? "bg-red-50/50 dark:bg-red-950/10 border-red-200/50 dark:border-red-900/30"
                      : isNative
                        ? "bg-primary/5 border-primary/20"
                        : "bg-card border-border"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide shadow-sm",
                        isBad
                          ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
                          : isNative
                            ? "bg-primary text-primary-foreground"
                            : "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                      )}
                    >
                      {response.type}
                    </span>
                    {isBad && <XCircle className="w-5 h-5 text-red-500/70" />}
                    {response.type === "Good" && <CheckCircle2 className="w-5 h-5 text-green-500/70" />}
                    {isNative && <Crown className="w-5 h-5 text-primary/70" />}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-2xl font-bold text-foreground font-serif leading-relaxed">
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
