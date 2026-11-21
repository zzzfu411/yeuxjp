import Link from "next/link"
import { notFound } from "next/navigation"
import { getAllGoalPracticeTasks } from "@/lib/goal-practice"
import { goalWritingTask } from "@/lib/writing-tasks"
import { WrittenWorkEditor } from "@/components/learning/written-work-editor"
import { pageMetadata } from "@/lib/site-metadata"
import { GoalPracticeReturnLink } from "@/components/learning/goal-practice-return-link"
type Props = { params: Promise<{ taskId: string }> }
export const dynamicParams = false
export function generateStaticParams() { return getAllGoalPracticeTasks().map(task => ({ taskId: task.id })) }
export async function generateMetadata({ params }: Props) {
  const id = (await params).taskId
  const task = getAllGoalPracticeTasks().find(task => task.id === id)
  if (!task) notFound()
  return pageMetadata(`/practice/${task.id}`, task.title, task.instruction)
}
export default async function GoalTaskRoute({ params }: Props) {
  const id = (await params).taskId
  const task = getAllGoalPracticeTasks().find(task => task.id === id)
  if (!task) notFound()
  return <div className="paper-wrap max-w-4xl py-10">
    <GoalPracticeReturnLink />
    <p className="eyebrow mt-6">目标专项 · 可分次完成</p>
    <h1 className="mt-3 text-2xl font-semibold sm:text-3xl">{task.title}</h1>
    <p className="mt-4 whitespace-pre-line text-base leading-8">{task.instruction}</p>
    <p className="mt-3 text-sm leading-7 text-muted-foreground">准备：{task.prerequisite}</p>
    <nav className="my-5 flex flex-wrap gap-4" aria-label="任务资料">{task.resources.map(link => <Link key={link.href} href={link.href} className="py-2 text-sm underline underline-offset-4">{link.title} →</Link>)}</nav>
    <WrittenWorkEditor task={goalWritingTask(task)} />
  </div>
}
