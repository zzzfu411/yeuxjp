import { notFound } from "next/navigation"
import { COURSE_PHASES } from "@/lib/course-phases"
import { STAGE_KANJI } from "@/data/stage-kanji"
import { StageKanjiPage } from "@/components/path/stage-kanji-page"
import { pageMetadata } from "@/lib/site-metadata"
type Props = { params: Promise<{ phase: string }> }
export const dynamicParams = false
export function generateStaticParams() { return COURSE_PHASES.map(phase => ({ phase: phase.id })) }
export async function generateMetadata({ params }: Props) {
  const id = (await params).phase
  const phase = COURSE_PHASES.find(item => item.id === id)
  if (!phase) notFound()
  return pageMetadata(`/checkpoints/${phase.id}/kanji`, `${phase.label} · 汉字读音练习`, "按词义输入完整假名读音，区分未测与错读，安排读音专项复习。")
}
export default async function KanjiRoute({ params }: Props) {
  const id = (await params).phase
  const phase = COURSE_PHASES.find(item => item.id === id)
  if (!phase) notFound()
  return <StageKanjiPage phase={phase.id} questions={STAGE_KANJI[phase.id]} />
}
