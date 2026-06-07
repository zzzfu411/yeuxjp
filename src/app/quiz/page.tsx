"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { 
  RefreshCw, 
  Ear, 
  Languages, 
  Type, 
  Volume2
} from "lucide-react"
import { GlossaryButton } from "@/components/ui/glossary"
import { SpeechSettingsBar } from "@/components/ui/speech-preferences"
import { NextStepCard } from "@/components/learning/next-step-card"
import { QuizRunner } from "@/components/quiz/quiz-runner"
import {
  parseQuizMode,
  type QuizMode,
} from "@/lib/quiz-generators"

function QuizPageContent() {
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<QuizMode | null>(null)
  const lastAutoMode = useRef<string | null>(null)

  const urlMode = searchParams.get("mode")

  useEffect(() => {
    let cancelled = false

    Promise.resolve().then(() => {
      if (cancelled) return
      if (!urlMode) {
        lastAutoMode.current = null
        return
      }
      if (lastAutoMode.current === urlMode) return

      const parsed = parseQuizMode(urlMode)
      if (!parsed) return
      lastAutoMode.current = urlMode
      setMode(parsed)
    })

    return () => {
      cancelled = true
    }
  }, [urlMode])

  // -- Mode Selection --
  if (!mode) {
    return (
      <div className="container py-20 px-4 mx-auto max-w-4xl flex flex-col items-center space-y-10 animate-in fade-in slide-in-from-bottom-4">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">选择测验模式 (Select Mode)</h1>
          <p className="text-muted-foreground text-lg">Choose how you want to test your skills today.</p>
        </div>

        <SpeechSettingsBar className="w-full" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          <ModeCard 
            title="基础假名" 
            desc="看假名，选罗马音" 
            icon={<Type className="w-8 h-8 text-primary" />}
            onClick={() => setMode('hiragana-romaji')}
          />
          <ModeCard 
            title="听音辨字" 
            desc="听发音，选假名" 
            icon={<Ear className="w-8 h-8 text-primary" />}
            onClick={() => setMode('audio-kana')}
          />
          <ModeCard 
            title="助词道场" 
            desc="填空选择助词" 
            icon={<Type className="w-8 h-8 text-primary" />}
            onClick={() => setMode('particle')}
          />
          <ModeCard 
            title="动词活用" 
            desc="ます/ない/て/た 选择题" 
            icon={<RefreshCw className="w-8 h-8 text-primary" />}
            onClick={() => setMode('verb-conjugation')}
          />
          <ModeCard 
            title="促音听辨" 
            desc="区分有没有 っ" 
            icon={<Volume2 className="w-8 h-8 text-primary" />}
            onClick={() => setMode('audio-sokuon')}
          />
          <ModeCard 
            title="长音听辨" 
            desc="区分长音/短音" 
            icon={<Volume2 className="w-8 h-8 text-primary" />}
            onClick={() => setMode('audio-longvowel')}
          />
          <ModeCard 
            title="单词释义" 
            desc="看单词，选意思" 
            icon={<Languages className="w-8 h-8 text-primary" />}
            onClick={() => setMode('meaning-vocab')}
          />
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
      mode={mode}
      onExit={() => setMode(null)}
    />
  )
}

export default function QuizPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20">加载中...</div>}>
      <QuizPageContent />
    </Suspense>
  )
}

function ModeCard({ title, desc, icon, onClick }: { title: string, desc: string, icon: React.ReactNode, onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center p-8 bg-card border rounded-xl shadow-sm hover:shadow-md hover:border-primary/50 cursor-pointer transition-all group text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="mb-6 p-4 bg-primary/10 rounded-full group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground text-center">{desc}</p>
    </button>
  )
}
