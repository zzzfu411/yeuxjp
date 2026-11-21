import { notFound } from "next/navigation"
import { COURSE_PHASES } from "@/lib/course-phases"
import { StageDiagnosticPage } from "@/components/path/stage-diagnostic-page"
import { pageMetadata } from "@/lib/site-metadata"
type Props = { params: Promise<{ phase: string }> }
export const dynamicParams = false
export function generateStaticParams() { return COURSE_PHASES.map(phase => ({ phase: phase.id })) }
export async function generateMetadata({ params }: Props) {
  const id = (await params).phase
  const phase = COURSE_PHASES.find(item => item.id === id)
  if (!phase) notFound()
  return pageMetadata(`/placement/${phase.id}`, `${phase.label} · 学习起点诊断`, "分项检查汉字读音、词汇、语法、阅读和听力，按真实答题结果选择学习入口。")
}
export default async function DiagnosticRoute({ params }: Props) {
  const id = (await params).phase
  const phase = COURSE_PHASES.find(item => item.id === id)
  if (!phase) notFound()
  return <StageDiagnosticPage phase={phase.id} />
}
