"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"
import { useSearchParams } from "next/navigation"
import {
  Ear,
  Languages,
  RefreshCw,
  Type,
  Volume2,
} from "lucide-react"
import { GlossaryButton } from "@/components/ui/glossary"
import { SpeechSettingsBar } from "@/components/ui/speech-preferences"
import { NextStepCard } from "@/components/learning/next-step-card"
import { QUIZ_MODE_OPTIONS, type QuizModeIcon } from "@/lib/quiz-mode-options"
import { useLearningRecommendation } from "@/lib/learning-recommendation"
import {
  parseQuizMode,
  type QuizMode,
} from "@/lib/quiz-types"

const QuizRunner = dynamic(
  () => import("@/components/quiz/quiz-runner").then((mod) => mod.QuizRunner),
  {
    ssr: false,
    loading: () => (
      <div className="flex justify-center py-20 text-muted-foreground">
        正在加载测验...
      </div>
    ),
  }
)

function QuizPageContent() {
  const searchParams = useSearchParams()
  const { nextLesson } = useLearningRecommendation()
  const [mode, setMode] = useState<QuizMode | null>(null)
  const lastAutoMode = useRef<string | null>(null)
  const showN4Quiz = !nextLesson || nextLesson.track !== "starter-45"

  const urlMode = searchParams.get("mode")

  useEffect(() => {
    let cancelled = false

    Promise.resolve().then(() => {
      if (cancelled) return
      const parsed = parseQuizMode(urlMode)
      if (!parsed) {
        lastAutoMode.current = null
        setMode(null)
        return
      }
      if (lastAutoMode.current === urlMode) return
      lastAutoMode.current = urlMode
      setMode(parsed)
    })

    return () => {
      cancelled = true
    }
  }, [urlMode])

  if (!mode) {
    return (
      <div className="paper-wrap flex flex-col items-center space-y-10 py-12 sm:py-16 animate-in fade-in slide-in-from-bottom-4">
        <div className="space-y-3 text-center">
          <div className="eyebrow">选择练习方式</div>
          <h1 className="font-brush text-4xl sm:text-5xl"><span className="inkline">选择测验模式</span></h1>
          <p className="text-sm font-semibold text-muted-foreground">从听音、辨义、活用或输入中选一项开始</p>
        </div>

        <SpeechSettingsBar className="w-full" />

        <section aria-label="测验模式" className="paper-sheet grid w-full grid-cols-1 gap-4 px-5 py-3 md:grid-cols-2">
          {QUIZ_MODE_OPTIONS.map((option) => (
            <ModeCard
              key={option.mode}
              title={option.title}
              desc={option.description}
              icon={option.icon}
              testId={option.testId}
              badge={option.mode === "verb-conjugation" && showN4Quiz ? "N4+" : undefined}
              onClick={() => setMode(option.mode)}
            />
          ))}
        </section>

        <div className="text-sm text-muted-foreground">
          不懂术语？<GlossaryButton className="h-auto px-2 py-1">术语表</GlossaryButton>
        </div>

        <NextStepCard className="max-w-4xl" />
      </div>
    )
  }

  return (
    <QuizRunner
      key={mode}
      mode={mode}
      onExit={() => setMode(null)}
    />
  )
}

export function QuizPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20">加载中...</div>}>
      <QuizPageContent />
    </Suspense>
  )
}

function ModeIcon({ icon }: { icon: QuizModeIcon }) {
  const className = "h-7 w-7 text-foreground/60 transition-colors group-hover:text-accent"

  switch (icon) {
    case "ear":
      return <Ear className={className} />
    case "languages":
      return <Languages className={className} />
    case "refresh":
      return <RefreshCw className={className} />
    case "volume":
      return <Volume2 className={className} />
    case "type":
      return <Type className={className} />
  }
}

function ModeCard({
  title,
  desc,
  icon,
  onClick,
  testId,
  badge,
}: {
  title: string
  desc: string
  icon: QuizModeIcon
  onClick: () => void
  testId: string
  badge?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className="quiz-mode-card ledger-row group relative flex min-h-28 cursor-pointer items-center gap-4 px-3 py-5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {badge ? (
        <span className="seal-stamp absolute right-3 top-3 text-xs">
          {badge}
        </span>
      ) : null}
      <div className="mode-icon grid h-12 w-12 shrink-0 place-items-center bg-card">
        <ModeIcon icon={icon} />
      </div>
      <div className="min-w-0 pr-8">
        <h3 className="font-brush text-2xl">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{desc}</p>
      </div>
    </button>
  )
}
