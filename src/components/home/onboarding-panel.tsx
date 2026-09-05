"use client"

import { useState } from "react"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { KanaLevel, LearningGoal, RomajiMode, UserProfile } from "@/lib/learning-progress"

const goalOptions: { value: LearningGoal; label: string; desc: string }[] = [
  { value: "balanced", label: "均衡推进", desc: "兼顾阅读、听力和造句，按 N5→N2 课程学习" },
  { value: "travel", label: "旅行实用", desc: "先学点餐、问路和求助等常用表达" },
  { value: "jlpt", label: "JLPT N5–N2", desc: "按 N5→N2 的考试范围循序学习" },
  { value: "media", label: "动漫理解", desc: "先打好基础，再学习动漫中的常见表达" },
]

const kanaOptions: { value: KanaLevel; label: string; desc: string }[] = [
  { value: "none", label: "刚开始", desc: "从 Day 1 的假名课开始" },
  { value: "some", label: "认识一些", desc: "仍从 Day 1 开始，并更早推荐句型练习" },
  { value: "solid", label: "基本会读", desc: "跳过 Day 1–21 的假名课，从基础句型开始" },
]

const romajiOptions: { value: RomajiMode; label: string }[] = [
  { value: "practice", label: "练习时逐步减少" },
  { value: "always", label: "先一直显示" },
  { value: "hidden", label: "尽量不显示" },
]

export function OnboardingPanel({
  onSave,
  initial,
}: {
  onSave: (input: Omit<UserProfile, "createdAt" | "updatedAt">) => Promise<boolean>
  initial?: Pick<UserProfile, "goal" | "kanaLevel" | "romajiMode" | "minutesPerDay"> | null
}) {
  const [saving, setSaving] = useState(false)
  const [goal, setGoal] = useState<LearningGoal>(initial?.goal ?? "balanced")
  const [kanaLevel, setKanaLevel] = useState<KanaLevel>(initial?.kanaLevel ?? "none")
  const [romajiMode, setRomajiMode] = useState<RomajiMode>(initial?.romajiMode ?? "practice")
  const [minutesPerDay, setMinutesPerDay] = useState(initial?.minutesPerDay ?? 10)

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">选择适合你的学习节奏，之后可以随时调整。</p>
      </div>

      <div>
        <div className="mb-2 text-sm font-semibold">学习目标</div>
        <div className="grid gap-2">
          {goalOptions.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={goal === item.value}
              data-testid={`onboarding-goal-${item.value}`}
              onClick={() => setGoal(item.value)}
              className={cn(
                "choice-card paper-slip block w-full px-3 py-3 text-left",
                goal === item.value && "border-l-accent"
              )}
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-semibold">{item.label}</span>
                {goal === item.value ? <span className="font-scribble text-sm text-accent">已选择</span> : null}
              </div>
              <div className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{item.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <SelectPills label="假名基础" value={kanaLevel} options={kanaOptions} onChange={(value) => setKanaLevel(value as KanaLevel)} />
        <SelectPills label="罗马音" value={romajiMode} options={romajiOptions} onChange={(value) => setRomajiMode(value as RomajiMode)} />
      </div>
      <p className="-mt-3 text-xs leading-relaxed text-muted-foreground">
        {kanaOptions.find((item) => item.value === kanaLevel)?.desc}
      </p>

      <div className="border-t border-border/50 pt-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-semibold">每天学习时长</span>
          <span className="font-scribble text-base text-muted-foreground">{minutesPerDay} 分钟</span>
        </div>
        <input
          aria-label="每天学习时长"
          data-testid="onboarding-minutes"
          type="range"
          min={5}
          max={20}
          step={5}
          value={minutesPerDay}
          onChange={(event) => setMinutesPerDay(Number(event.target.value))}
          className="anime-range w-full"
        />
      </div>

      <Button
        type="button"
        className="w-full gap-2"
        data-testid="onboarding-save"
        disabled={saving}
        onClick={async () => {
          setSaving(true)
          try { await onSave({ goal, kanaLevel, romajiMode, minutesPerDay }) } finally { setSaving(false) }
        }}
      >
        {initial ? "保存学习设置" : "保存并开始学习"} <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  )
}

function SelectPills({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold">{label}</div>
      <div className="flex flex-wrap gap-x-3 gap-y-2">
        {options.map((item) => (
          <button
            key={item.value}
            type="button"
            aria-pressed={value === item.value}
            data-testid={`onboarding-${item.value}`}
            onClick={() => onChange(item.value)}
            className={cn(
              "filter-chip px-2.5 py-1.5 text-xs font-semibold transition-colors",
              value === item.value
                ? "is-selected text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}
