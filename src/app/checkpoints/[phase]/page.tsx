import { notFound } from "next/navigation"
import { COURSE_PHASES } from "@/lib/course-phases"
import { StageWritingPage } from "@/components/path/stage-writing-page"
import { pageMetadata } from "@/lib/site-metadata"
type Props = { params: Promise<{ phase: string }> }
export const dynamicParams = false
export function generateStaticParams() { return COURSE_PHASES.map(phase => ({ phase: phase.id })) }
export async function generateMetadata({ params }: Props) {
  const id = (await params).phase
  const phase = COURSE_PHASES.find(item => item.id === id)
  if (!phase) notFound()
  return pageMetadata(`/checkpoints/${phase.id}`, `${phase.label} · 阶段迁移任务`, "阅读独立新材料，保存阶段表达作品与自查，分开查看课程知识证据。")
}
export default async function StageWritingRoute({ params }: Props) {
  const id = (await params).phase
  const phase = COURSE_PHASES.find(item => item.id === id)
  if (!phase) notFound()
  return <StageWritingPage phase={phase.id} />
}
