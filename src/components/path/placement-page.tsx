"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { COURSE_PHASES } from "@/lib/course-phases"
import { STAGE_DESCRIPTIONS } from "@/data/stage-descriptions"
import { STAGE_COVERAGE, STAGE_KANJI_REVISIONS } from "@/data/stage-coverage-index"
import { useStageDiagnostics } from "@/lib/use-stage-diagnostics"
import { summarizeDiagnostic } from "@/lib/stage-diagnostic-model"
import { useKanjiReadings } from "@/lib/use-kanji-readings"
import { isCurrentKanjiQuestion } from "@/lib/kanji-reading-model"

export function PlacementPage() {
  const data = useStageDiagnostics()
  const kanji = useKanjiReadings()
  const currentKanji = Object.values(kanji.store).filter(row => isCurrentKanjiQuestion(row.question))
  return <div className="paper-wrap max-w-4xl py-8 sm:py-12" data-testid="placement-page">
    <Link href="/path" className="text-sm underline underline-offset-4">返回学习路径</Link>
    <h1 className="mt-5 text-3xl font-semibold leading-relaxed sm:text-4xl">找到合适的起点</h1>
    <p className="mt-4 text-base leading-8 text-muted-foreground">已有基础，选自己学过的最高阶段检查。刚开始学日语，可以<Link href="/learn/day-1-a-row-hello" className="font-semibold text-foreground underline underline-offset-4">从第 1 课开始</Link>。</p>
    <nav aria-label="选择诊断阶段" className="mt-4 flex flex-wrap gap-x-6 gap-y-2">{COURSE_PHASES.map(phase => <a key={phase.id} href={`#${phase.id}`} aria-label={phase.label} className="inline-flex min-h-11 items-center text-base font-semibold underline underline-offset-4">{phase.id.toUpperCase()}</a>)}</nav>
    <aside className="my-5 space-y-2 border-y border-border py-4" data-testid="placement-entry">
      <p className="text-lg font-semibold">{!data.loaded ? "正在读取起点…" : data.entryOrder > 1 ? `当前采用：第 ${data.entryOrder} 课` : "当前未采用诊断跳级"}</p>
      {data.entryOrder > 1 && <p className="text-sm leading-7 text-muted-foreground">跳过课程另计，已有成绩和作品保留。下级课程仍可查阅。</p>}
      {data.entryOrder > 1 && <Button variant="outline" disabled={data.pending || data.error} onClick={() => void data.dispatch({ type: "reset-entry" })}>撤销诊断定位，恢复按基础推荐</Button>}
      {(data.error || data.saveError) && <p role="alert" className="text-sm text-destructive">诊断记录无法读取或保存。原数据保留，请到<Link href="/settings" className="underline">设置</Link>检查备份与存储。</p>}
    </aside>
    <p className="text-sm leading-7 text-muted-foreground">每阶段 16 题，可中途离开并恢复。结果用于本站学习安排，不认证 JLPT 等级、口语或手写能力。</p>
    <div className="mt-6 space-y-8">{COURSE_PHASES.map(phase => {
      const description = STAGE_DESCRIPTIONS[phase.id]
      const coverage = STAGE_COVERAGE[phase.id]
      const attempts = Object.values(data.store.attempts).filter(item => item.phase === phase.id).sort((a, b) => b.createdAt - a.createdAt)
      const latest = attempts[0]
      const result = latest ? summarizeDiagnostic(latest) : null
      return <section key={phase.id} id={phase.id} className="scroll-mt-24 border-t-2 border-foreground/70 pt-6" aria-labelledby={`coverage-${phase.id}`}>
        <p className="eyebrow">{phase.range}</p><h2 id={`coverage-${phase.id}`} className="mt-2 text-2xl font-semibold">{phase.label}</h2>
        <p className="mt-3 text-base leading-8">{description.entry}</p>
        <div className="mt-4 flex flex-wrap gap-3"><Button asChild><Link href={`/placement/${phase.id}`}>{latest && result?.current && !result.complete ? "继续诊断" : "进入阶段诊断"}</Link></Button><Button asChild variant="outline"><Link href={`/checkpoints/${phase.id}/kanji`}>汉字读音练习</Link></Button></div>
        <p className="mt-3 text-sm leading-7">最近一轮诊断：{!data.loaded ? "读取中" : data.error ? "记录不可读" : !latest ? "尚未检查" : !result?.current ? "历史材料，需重新检查" : !result.complete ? `进行中 ${Object.keys(latest.answers).length}/16 题` : `${result.correct}/16 独立答对 · ${result.passed ? "达到本套定位条件" : "仍有分项需要补练"}`}</p>
        <details className="mt-4 border-t border-border/50 pt-3" data-testid={`placement-coverage-${phase.id}`}><summary className="cursor-pointer text-base font-semibold leading-8">本阶段学什么 · 覆盖与作品</summary>
        <ul className="my-4 list-disc space-y-2 pl-5 text-base leading-8">{description.tasks.map(task => <li key={task}>{task}</li>)}</ul>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 border-y border-border py-5 text-sm sm:grid-cols-4">{[["主线课程", `${coverage.lessons} 课`], ["声明词汇", `${coverage.vocabulary} 条`], ["声明语法", `${coverage.grammar} 项`], ["汉字词条", `${coverage.kanjiWords} 条`], ["阅读选择题", `${coverage.reading} 题`], ["听力评分题", `${coverage.listening} 题`], ["独立输入题", `${coverage.input} 题`], ["课程表达任务", `${coverage.lessons} 个`]].map(([label, value]) => <div key={label}><dt className="text-muted-foreground">{label}</dt><dd className="mt-1 text-lg font-semibold">{value}</dd></div>)}</dl>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">汉字词条共出现 {coverage.uniqueKanji} 个不同汉字，训练的是词中读音。词条与语法在阶段内按 ID 去重，跨阶段可能重复；不是官方考纲总量。独立输入题不包括听写、回忆原句、组句和自查作品。</p>
        <p className="mt-4 text-base leading-8">{description.next}</p><p className="mt-2 text-sm leading-7 text-muted-foreground">{description.limits}</p>
        <Link href={`/checkpoints/${phase.id}`} className="mt-3 inline-flex min-h-11 items-center text-base font-semibold underline underline-offset-4">阶段作品与自查 →</Link>
        </details>
      </section>
    })}</div>
    <section id="kanji" className="mt-10 scroll-mt-24 border-t-2 border-foreground/70 pt-6"><h2 className="text-2xl font-semibold">汉字读音记录</h2><p className="mt-4 text-base leading-8">四阶段共有 {Object.keys(STAGE_KANJI_REVISIONS).length} 个去重汉字词条。{!kanji.loaded ? "正在读取…" : kanji.error ? "记录暂时不可读，原数据保留。" : `当前版本测过 ${currentKanji.length} 个，最近答对 ${currentKanji.filter(row => row.lastCorrect).length} 个，需练 ${currentKanji.filter(row => !row.lastCorrect).length} 个。`}可以从上面任一阶段进入未测、错读或到期集合。</p><p className="mt-3 text-sm leading-7 text-muted-foreground">同一词条在多个阶段共享记录。读错会保留待练，答对安排后续复习。更换词条版本后旧记录留在备份中，当前版本重新检查。</p></section>
    <details className="mt-8 border-t border-border py-4 text-sm leading-7 text-muted-foreground"><summary className="cursor-pointer font-semibold text-foreground">诊断与课程记录有什么区别？</summary><p className="mt-3">完成课程、该课测评达标、阶段独立诊断、自查作品分别展示。诊断定位只调整入口，跳过课程另计；设置中的假名基础仍可用于跳过假名入门课。学习目标与自评不会代替诊断成绩。</p><p className="mt-3">阶段方向参考 <a className="underline" href="https://www.jlpt.jp/about/levelsummary.html" target="_blank" rel="noreferrer">JLPT 等级说明</a>，任务设计参考 <a className="underline" href="https://www.jfstandard.jpf.go.jp/summary/ja/render.do" target="_blank" rel="noreferrer">JF 日本语教育标准</a>。本站的课程分区、题量与定位条件由项目自行定义。</p></details>
  </div>
}
