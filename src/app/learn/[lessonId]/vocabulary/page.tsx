import { notFound } from "next/navigation"
import { getLessonById, STARTER_LESSONS } from "@/data/lessons"
import { courseVocabularyHref, getCourseVocabularyIds } from "@/lib/course-vocabulary"
import { pageMetadata } from "@/lib/site-metadata"
import { CourseVocabularyPage } from "@/components/lesson/course-vocabulary-page"

type Props = { params: Promise<{ lessonId: string }> }
export const dynamicParams = false
export function generateStaticParams() { return STARTER_LESSONS.map(lesson => ({ lessonId: lesson.id })) }
export async function generateMetadata({ params }: Props) {
  const lesson = getLessonById((await params).lessonId)
  if (!lesson) notFound()
  return pageMetadata(courseVocabularyHref(lesson), `${lesson.title} · 词汇补练`, "只练本课词汇，查看未测项目并安排间隔复习。")
}
export default async function CourseVocabularyRoute({ params }: Props) {
  const lesson = getLessonById((await params).lessonId)
  if (!lesson) notFound()
  return <CourseVocabularyPage key={lesson.id} lessonId={lesson.id} title={lesson.title} ids={getCourseVocabularyIds(lesson)} />
}
