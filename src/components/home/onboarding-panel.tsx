"use client"

import { useState } from "react"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { KanaLevel, LearningGoal, RomajiMode, UserProfile } from "@/lib/learning-progress"

const goalOptions: { value: LearningGoal; label: string; desc: string }[] = [
  { value: "balanced", label: "均衡推进", desc: "会读、会听、会造句，沿 N5→N2 主线走" },
  { value: "travel", label: "旅行生存", desc: "优先点餐、问路、求助" },
  { value: "jlpt", label: "JLPT N5–N2", desc: "按考试结构从 N5 骨架走到 N2 连接" },
  { value: "media", label: "动漫理解", desc: "先打基础，再看兴趣表达" },
]

const kanaOptions: { value: KanaLevel; label: string; desc: string }[] = [
  { value: "none", label: "刚开始", desc: "从 Day 1 假名课学起" },
  { value: "some", label: "认识一些", desc: "仍走 Day 1，但技能树会更快转向句型" },
  { value: "solid", label: "基本会读", desc: "跳过 Day 1–21 假名课，从助词句型开始" },
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
  onSave: (input: Omit<UserProfile, "createdAt" | "updatedAt">) => boolean
  initial?: Pick<UserProfile, "goal" | "kanaLevel" | "romajiMode" | "minutesPerDay"> | null
}) {
  const [goal, setGoal] = useState<LearningGoal>(initial?.goal ?? "balanced")
  const [kanaLevel, setKanaLevel] = useState<KanaLevel>(initial?.kanaLevel ?? "none")
  const [romajiMode, setRomajiMode] = useState<RomajiMode>(initial?.romajiMode ?? "practice")
  const [minutesPerDay, setMinutesPerDay] = useState(initial?.minutesPerDay ?? 10)

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs font-semibold tracking-wider text-muted-foreground">
          {initial ? "学习设置" : "首次学习设置"}
        </div>
        <div className="mt-1 text-xl font-bold">先定一条适合你的路线</div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">设置只保存在本机，之后可以继续使用旧的五十音、词汇和测验页面。</p>
      </div>

      <div className="space-y-2">
        <div className="text-sm font-semibold">学习目标</div>
        <div className="grid gap-2">
          {goalOptions.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={goal === item.value}
              data-testid={`onboarding-goal-${item.value}`}
              onClick={() => setGoal(item.value)}
              className={cn(
                "border-[2px] border-foreground p-3 text-left transition hover:bg-primary/40",
                goal === item.value && "bg-primary"
              )}
            >
              <div className="text-sm font-semibold">{item.label}</div>
              <div className="text-xs text-muted-foreground">{item.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <SelectPills label="假名基础" value={kanaLevel} options={kanaOptions} onChange={(value) => setKanaLevel(value as KanaLevel)} />
        <SelectPills label="罗马音" value={romajiMode} options={romajiOptions} onChange={(value) => setRomajiMode(value as RomajiMode)} />
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        {kanaOptions.find((item) => item.value === kanaLevel)?.desc}
      </p>

      <div className="border-[2px] border-foreground bg-background p-3">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-semibold">每天学习时长</span>
          <span className="text-muted-foreground">{minutesPerDay} 分钟</span>
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
          className="w-full accent-primary"
        />
      </div>

      <Button
        type="button"
        className="w-full gap-2"
        data-testid="onboarding-save"
        onClick={() => onSave({ goal, kanaLevel, romajiMode, minutesPerDay })}
      >
        {initial ? "保存学习设置" : "生成今日计划"} <ArrowRight className="h-4 w-4" />
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
      <div className="flex flex-wrap gap-2">
        {options.map((item) => (
          <button
            key={item.value}
            type="button"
            aria-pressed={value === item.value}
            data-testid={`onboarding-${item.value}`}
            onClick={() => onChange(item.value)}
            className={cn(
              "border-[2px] border-foreground px-3 py-1.5 text-xs font-extrabold transition",
              value === item.value ? "bg-primary text-foreground" : "bg-card text-muted-foreground hover:bg-primary/40"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}
