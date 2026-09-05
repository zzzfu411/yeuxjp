import { pageMetadata } from "@/lib/site-metadata"
import { notFound } from "next/navigation"
import { LessonRunner } from "@/components/lesson/lesson-runner"
import { STARTER_LESSONS, getLessonById } from "@/data/lessons"

interface LessonPageProps {
  params: Promise<{ lessonId: string }>
}

export async function generateMetadata({ params }: LessonPageProps) {
  const { lessonId } = await params
  const lesson = getLessonById(lessonId)
  if (!lesson) notFound()
  return pageMetadata(`/learn/${lesson.id}`, lesson.title, lesson.subtitle)
}

export const dynamicParams = false

export function generateStaticParams() {
  return STARTER_LESSONS.map((lesson) => ({ lessonId: lesson.id }))
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { lessonId } = await params
  const lesson = getLessonById(lessonId)

  if (!lesson) {
    notFound()
  }

  return <LessonRunner lesson={lesson} />
}
