import { notFound } from "next/navigation"
import { getLessonById, STARTER_LESSONS } from "@/data/lessons"
import { courseKanaHref, getCourseKanaIds } from "@/lib/course-kana"
import { pageMetadata } from "@/lib/site-metadata"
import { CourseKanaPage } from "@/components/lesson/course-kana-page"

type Props = { params: Promise<{ lessonId: string }> }
export const dynamicParams = false
export function generateStaticParams() { return STARTER_LESSONS.map(lesson => ({ lessonId: lesson.id })) }
export async function generateMetadata({ params }: Props) {
  const lesson = getLessonById((await params).lessonId)
  if (!lesson) notFound()
  return pageMetadata(courseKanaHref(lesson), `${lesson.title} · 假名补练`, "逐项补测本课假名的识读和听音，安排间隔复习。")
}
export default async function CourseKanaRoute({ params }: Props) {
  const lesson = getLessonById((await params).lessonId)
  if (!lesson) notFound()
  return <CourseKanaPage key={lesson.id} lessonId={lesson.id} title={lesson.title} ids={getCourseKanaIds(lesson)} />
}
