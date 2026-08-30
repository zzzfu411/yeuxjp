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
      <div className="container py-20 px-4 mx-auto max-w-4xl flex flex-col items-center space-y-10 animate-in fade-in slide-in-from-bottom-4">
        <div className="text-center space-y-4">
          <h1 className="font-brush text-4xl">选择测验模式</h1>
          <p className="text-muted-foreground text-lg">Choose how you want to test your skills today.</p>
        </div>

        <SpeechSettingsBar className="w-full" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
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
        </div>

        <div className="text-sm text-muted-foreground">
          不懂术语？<GlossaryButton className="h-auto px-2 py-1 rounded-md">术语表</GlossaryButton>
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
  const className = "w-8 h-8 text-primary-foreground"

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
      className="relative flex flex-col items-center p-8 bg-card border-[3px] border-foreground shadow-hard hover:-translate-x-px hover:-translate-y-px cursor-pointer transition-transform group text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      {badge ? (
        <span className="absolute right-3 top-3 border-[2px] border-foreground bg-primary px-2 py-0.5 text-[10px] font-black">
          {badge}
        </span>
      ) : null}
      <div className="mb-6 p-4 bg-primary border-[3px] border-foreground shadow-hard-sm">
        <ModeIcon icon={icon} />
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground text-center">{desc}</p>
    </button>
  )
}
