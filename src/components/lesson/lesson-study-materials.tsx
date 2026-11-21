"use client"

import Link from "next/link"
import { useState } from "react"
import { Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { LessonStudy } from "@/data/coursebook/types"
import { WrittenWorkEditor } from "@/components/learning/written-work-editor"
import { lessonWritingTask } from "@/lib/writing-tasks"

export function LessonStudyMaterials({ study, mode, onPlay, lessonId }: {
  lessonId: string
  study: LessonStudy
  mode: "instruction" | "reading" | "production"
  onPlay: (text: string) => void
}) {
  if (mode === "instruction") return (
    <section aria-label="学习目标与深入讲解" className="mb-6 space-y-4 border-b border-border/50 pb-6" data-testid="coursebook-instruction">
      <p className="eyebrow">单元 {study.unitNumber} · {study.unitTitle}</p>
      <h3 className="text-xl font-semibold leading-relaxed">{study.goal}</h3>
      <p className="text-base leading-8 sm:text-lg">{study.explanation}</p>
      <p className="text-sm leading-6 text-muted-foreground">先理解用法，再试着表达。单元五课共用一组情境，按本课目标选读即可。</p>
    </section>
  )

  if (mode === "production") return (
    <section aria-label="课后表达任务" className="mt-8 space-y-5 border-t border-border/50 pt-6" data-testid="coursebook-production">
      <h3 className="text-2xl font-semibold">把日语用起来</h3>
      <p className="text-lg leading-8">{study.task}</p>
      <p className="text-base leading-7 text-muted-foreground">先写下自己的答案或记录口述内容，再展开示范。开放表达不计入选择题成绩，可以有不同的正确说法。</p>
      <WrittenWorkEditor task={lessonWritingTask(lessonId, study)} />
      <details className="border-y border-border/50 py-4">
        <summary className="cursor-pointer text-base font-semibold">查看表达示范</summary>
        <p lang="ja" className="mt-4 font-jp text-xl leading-9">{study.model}</p>
        <Button variant="outline" className="mt-3 gap-2" onClick={() => onPlay(study.model)}><Volume2 className="h-4 w-4" />朗读示范</Button>
      </details>
      {study.reviewLessonIds.length > 0 && <div className="text-base leading-7"><p className="font-semibold">邻近课程资料</p><p className="text-muted-foreground">需要时可回看这些课程。实际间隔复习按作答与到期时间安排，请查看本课复习状态或复习台。</p><div className="mt-2 flex flex-wrap gap-4">{study.reviewLessonIds.map((id, index) => <Link key={id} href={`/learn/${id}`} className="underline underline-offset-4">{index === 0 ? "查阅上一课" : "查阅五课前"}</Link>)}</div></div>}
    </section>
  )

  return <ReadingMaterials key={lessonId} study={study} lessonId={lessonId} onPlay={onPlay} />
}

function ReadingMaterials({ study, lessonId, onPlay }: { study: LessonStudy; lessonId: string; onPlay: (text: string) => void }) {
  const [showTranslation, setShowTranslation] = useState(false)
  const order = Number(lessonId.match(/^day-(\d+)-/)?.[1])
  const firstInUnit = (order - 1) % 5 === 0
  return <section aria-label="单元情境与课文" className="mt-8 border-t border-border/50 pt-6" data-testid="coursebook-reading">
    <p className="text-sm text-muted-foreground">单元 {study.unitNumber} · 共用情境</p>
    <h3 className="mt-2 text-xl font-semibold leading-relaxed">{study.unitTitle}</h3>
    <p className="mt-3 text-base leading-8"><strong>这次留意：</strong>{study.goal}</p>
    <p className="mt-2 text-sm leading-7 text-muted-foreground">{firstInUnit ? "先从短对话进入情境；课文与词汇按需展开。" : "本单元材料与前课相同，按这次的目标回看即可。"}遇到不懂的内容，可以显示中文辅助。</p>
    <Button type="button" variant="outline" className="my-4" aria-pressed={showTranslation} data-testid="coursebook-translation-toggle" onClick={() => setShowTranslation(value => !value)}>
      {showTranslation ? "隐藏中文辅助" : "显示中文辅助"}
    </Button>
    <div className="divide-y divide-border/50 border-y border-border/50">
      <details open={firstInUnit} className="py-4" data-testid="coursebook-dialogue">
        <summary className="cursor-pointer py-1 text-lg font-semibold">短对话 · {study.dialogue.length} 句</summary>
        <p className="mt-3 text-base leading-8 text-muted-foreground">{study.scene}</p>
        <div className="mt-2 divide-y divide-border/40">
          {study.dialogue.map(([speaker, japanese, meaning], index) => <div key={index} className="py-4">
            <div className="flex items-start gap-3"><span className="mt-1 shrink-0 text-sm font-semibold text-muted-foreground">{speaker}</span><p lang="ja" className="min-w-0 flex-1 font-jp text-xl leading-9">{japanese}</p><Button variant="ghost" size="icon" className="shrink-0" aria-label={`朗读第 ${index + 1} 句对话`} onClick={() => onPlay(japanese)}><Volume2 className="h-4 w-4" /></Button></div>
            {showTranslation && <p className="mt-2 text-base leading-7 text-muted-foreground" data-testid="coursebook-dialogue-translation">{meaning}</p>}
          </div>)}
        </div>
      </details>
      <details className="py-4" data-testid="coursebook-passage">
        <summary className="cursor-pointer py-1 text-lg font-semibold">课文 · {study.readingTitle}</summary>
        <div className="mt-4 space-y-4">
          <p lang="ja" className="font-jp text-xl leading-10 [overflow-wrap:anywhere]">{study.reading}</p>
          <Button variant="outline" className="gap-2" onClick={() => onPlay(study.reading)}><Volume2 className="h-4 w-4" />朗读课文</Button>
          <p className="text-sm leading-6 text-muted-foreground">使用设备日语合成语音。先听整体意思，再分句跟读。</p>
          {showTranslation && <p className="border-l-2 border-border pl-4 text-base leading-8 text-muted-foreground" data-testid="coursebook-passage-translation">{study.translation}</p>}
        </div>
      </details>
      <details className="py-4" data-testid="coursebook-words">
        <summary className="cursor-pointer py-1 text-lg font-semibold">语境词汇与读音 · {study.words.length} 条</summary>
        <dl className="mt-3 divide-y divide-border/40">{study.words.map(([word, reading, meaning]) => <div key={word} className="grid gap-1 py-3 sm:grid-cols-2 sm:gap-4"><dt lang="ja" className="font-jp text-lg leading-8">{word}{word !== reading && <span className="ml-2 text-base text-muted-foreground">（{reading}）</span>}</dt><dd className="text-base leading-8 text-muted-foreground">{meaning}</dd></div>)}</dl>
      </details>
    </div>
  </section>
}
