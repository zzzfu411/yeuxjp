"use client"

import Image from "next/image"
import Link from "next/link"
import { useMemo } from "react"
import { ArrowRight, BookOpenCheck, CalendarDays, Flame, Headphones, Route, Sparkles, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useLearningProfile, useLearningProgress } from "@/lib/learning-progress"
import { useSrsDeck } from "@/lib/srs"
import { STORAGE_KEYS } from "@/lib/storage-keys"
import { MISTAKE_SRS_STORAGE_KEY, useMistakeNotebook } from "@/lib/mistake-notebook"
import { getNextLesson, STARTER_LESSONS } from "@/data/lessons"
import { OnboardingPanel } from "@/components/home/onboarding-panel"

export default function Home() {
  const { profile, saveProfile } = useLearningProfile()
  const learning = useLearningProgress()
  const kanaSrs = useSrsDeck(STORAGE_KEYS.SRS_KANA)
  const vocabSrs = useSrsDeck(STORAGE_KEYS.SRS_VOCAB)
  const mistakeSrs = useSrsDeck(MISTAKE_SRS_STORAGE_KEY)
  const mistakes = useMistakeNotebook()

  const dueMistakeIds = useMemo(() => mistakeSrs.dueIds.filter((id) => mistakes.byId.has(id)), [mistakeSrs.dueIds, mistakes.byId])
  const totalDue = kanaSrs.dueIds.length + vocabSrs.dueIds.length + dueMistakeIds.length
  const nextLesson = useMemo(() => getNextLesson(learning.completedLessonIds), [learning.completedLessonIds])
  const completedCount = learning.completedLessonIds.size

  const weakest = useMemo(() => {
    const entries = Object.values(learning.items)
    if (!entries.length) return null
    return entries
      .map((item) => ({
        id: item.itemId,
        label: item.itemType === "kana" ? "假名" : item.itemType === "grammar" ? "语法" : item.itemType === "sentence" ? "造句" : "词汇",
        score: Math.round((item.recognition + item.listening + item.meaning + item.recall + item.production) / 5),
      }))
      .sort((a, b) => a.score - b.score)[0]
  }, [learning.items])

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[radial-gradient(circle_at_15%_0%,hsl(var(--primary)/0.22),transparent_32rem),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.28))]">
      <section className="relative overflow-hidden border-b">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-75">
          <Image
            src="/assets/hero/hero-watercolor.webp"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-right dark:hidden"
          />
          <Image
            src="/assets/hero/hero-watercolor-dark.webp"
            alt=""
            fill
            priority
            sizes="100vw"
            className="hidden object-cover object-right dark:block"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/30" />
        </div>

        <div className="relative container mx-auto grid gap-8 px-4 py-10 md:grid-cols-[minmax(0,1.1fr)_360px] md:py-14">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border bg-card/80 px-4 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              今日 10-15 分钟 · 学一点 · 练会用 · 明天记得住
            </div>
            <div className="max-w-3xl space-y-4">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">今天日语学什么，一眼就知道。</h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                Yasashi Japanese 现在会先安排复习，再带你完成一节短微课，并把听辨、回忆、造句写入掌握度。
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="gap-2 rounded-full px-7">
                <Link href={nextLesson ? `/learn/${nextLesson.id}` : "/review"} data-testid="home-start-learning">
                  开始今日学习 <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="gap-2 rounded-full">
                <Link href="/review">先复习 {totalDue} 项</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-3xl border bg-card/90 p-5 shadow-sm backdrop-blur">
            {profile ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold tracking-wider text-muted-foreground">今日计划</div>
                    <div className="mt-1 text-xl font-bold">{profile.minutesPerDay} 分钟学习</div>
                  </div>
                  <div className="rounded-2xl border bg-primary/10 p-3">
                    <Target className="h-5 w-5" />
                  </div>
                </div>
                <div className="rounded-2xl border bg-background/70 p-4">
                  <div className="text-sm font-semibold">下一课</div>
                  <div className="mt-1 text-lg font-bold">{nextLesson?.title ?? "Starter 已完成"}</div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{nextLesson?.subtitle ?? "可以进入复习页巩固并继续扩展词汇。"}</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <MiniStat icon={<BookOpenCheck className="h-4 w-4" />} label="已完成" value={`${completedCount}/14`} />
                  <MiniStat icon={<Flame className="h-4 w-4" />} label="连续" value={`${learning.streak} 天`} />
                  <MiniStat icon={<Headphones className="h-4 w-4" />} label="到期" value={`${totalDue}`} />
                </div>
              </div>
            ) : (
              <OnboardingPanel onSave={saveProfile} />
            )}
          </div>
        </div>
      </section>

      <section className="container mx-auto grid gap-5 px-4 py-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
        <div className="rounded-3xl border bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold tracking-wider text-muted-foreground">Starter 14</div>
              <h2 className="mt-1 text-2xl font-bold">14 天入门路线</h2>
            </div>
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/path">查看技能树</Link>
            </Button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {STARTER_LESSONS.slice(0, 6).map((lesson) => {
              const done = learning.completedLessonIds.has(lesson.id)
              const active = nextLesson?.id === lesson.id
              return (
                <Link
                  key={lesson.id}
                  href={`/learn/${lesson.id}`}
                  className={cn(
                    "rounded-2xl border bg-background/70 p-4 transition hover:border-primary/50 hover:bg-primary/5",
                    done && "border-green-200 bg-green-50/70 dark:border-green-900/40 dark:bg-green-900/10",
                    active && "border-primary/60 bg-primary/10"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground">Day {lesson.order}</div>
                      <div className="mt-1 font-bold leading-snug">{lesson.title.replace(/^Day \d+：/, "")}</div>
                    </div>
                    {done ? <BookOpenCheck className="h-4 w-4 text-green-600" /> : active ? <ArrowRight className="h-4 w-4 text-primary" /> : null}
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{lesson.subtitle}</p>
                </Link>
              )
            })}
          </div>
        </div>

        <div className="space-y-5">
          <ActionCard
            icon={<CalendarDays className="h-5 w-5" />}
            title="今日复习流"
            desc={`假名、词汇和错题会按到期顺序集中处理。当前到期 ${totalDue} 项。`}
            href="/review"
            cta="开始复习"
          />
          <ActionCard
            icon={<Route className="h-5 w-5" />}
            title="薄弱项"
            desc={weakest ? `${weakest.label}「${weakest.id}」平均掌握度 ${weakest.score}，建议在复习流里优先巩固。` : "完成几道课程练习后，这里会显示最需要补强的能力维度。"}
            href="/quiz"
            cta="做专项练习"
          />
        </div>
      </section>
    </div>
  )
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-background/70 p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <div className="mt-1 text-lg font-bold">{value}</div>
    </div>
  )
}

function ActionCard({ icon, title, desc, href, cta }: { icon: React.ReactNode; title: string; desc: string; href: string; cta: string }) {
  return (
    <div className="rounded-3xl border bg-card p-5 shadow-sm">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl border bg-primary/10">{icon}</div>
      <div className="text-lg font-bold">{title}</div>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
      <Button asChild variant="outline" className="mt-4 rounded-full">
        <Link href={href}>{cta}</Link>
      </Button>
    </div>
  )
}
