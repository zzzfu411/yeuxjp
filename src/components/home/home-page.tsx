"use client"

import Image from "next/image"
import Link from "next/link"
import { useMemo, useState } from "react"
import { ArrowRight, BookOpenCheck, CalendarDays, Flame, Headphones, Route, Sparkles, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { OnboardingPanel } from "@/components/home/onboarding-panel"
import { HomeStarterLessons } from "@/components/home/home-starter-lessons"
import { PracticeSaveError } from "@/components/practice/practice-save-error"
import { useLearningProfile } from "@/lib/learning-progress"
import { useLearningRecommendation } from "@/lib/learning-recommendation"
import { useSrsDeck } from "@/lib/srs"
import { STORAGE_KEYS } from "@/lib/storage-keys"
import { MISTAKE_SRS_STORAGE_KEY, useMistakeNotebook } from "@/lib/mistake-notebook"
import { buildHomePageModel } from "@/lib/home-page-model"

export function HomePage() {
  const { profile, saveProfile } = useLearningProfile()
  const [profileSaveError, setProfileSaveError] = useState(false)
  const { learning, recommendedSkill } = useLearningRecommendation()
  const kanaSrs = useSrsDeck(STORAGE_KEYS.SRS_KANA)
  const vocabSrs = useSrsDeck(STORAGE_KEYS.SRS_VOCAB)
  const mistakeSrs = useSrsDeck(MISTAKE_SRS_STORAGE_KEY)
  const mistakes = useMistakeNotebook()

  const homeModel = useMemo(() => {
    return buildHomePageModel({
      completedLessonIds: learning.completedLessonIds,
      items: learning.items,
      skill: recommendedSkill,
      kanaDueIds: kanaSrs.dueIds,
      vocabDueIds: vocabSrs.dueIds,
      mistakeDueIds: mistakeSrs.dueIds,
      mistakeIds: mistakes.byId.keys(),
    })
  }, [kanaSrs.dueIds, learning.completedLessonIds, learning.items, mistakeSrs.dueIds, mistakes.byId, recommendedSkill, vocabSrs.dueIds])
  const { totalDue, nextLesson, learningEntry, completedCount, weakest } = homeModel

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
                <Link href={learningEntry.href} data-testid="home-start-learning">
                  {learningEntry.cta} <ArrowRight className="h-4 w-4" />
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
                  <div className="mt-1 text-lg font-bold">{learningEntry.title}</div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{learningEntry.subtitle}</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <MiniStat icon={<BookOpenCheck className="h-4 w-4" />} label="已完成" value={`${completedCount}/14`} />
                  <MiniStat icon={<Flame className="h-4 w-4" />} label="连续" value={`${learning.streak} 天`} />
                  <MiniStat icon={<Headphones className="h-4 w-4" />} label="到期" value={`${totalDue}`} />
                </div>
              </div>
            ) : (
              <>
                <OnboardingPanel
                  onSave={(input) => {
                    const saved = saveProfile(input)
                    setProfileSaveError(!saved)
                    return saved
                  }}
                />
                <PracticeSaveError show={profileSaveError} />
              </>
            )}
          </div>
        </div>
      </section>

      <section className="container mx-auto grid gap-5 px-4 py-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
        <HomeStarterLessons completedLessonIds={learning.completedLessonIds} activeLessonId={nextLesson?.id} />

        <div className="space-y-5">
          <ActionCard
            icon={<CalendarDays className="h-5 w-5" />}
            title="今日复习流"
            desc={`先处理错题，再复习到期假名和词汇。当前到期 ${totalDue} 项。`}
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
