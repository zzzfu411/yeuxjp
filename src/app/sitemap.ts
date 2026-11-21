import type { MetadataRoute } from "next"
import { SITE_ORIGIN, PUBLIC_ROUTES } from "@/lib/site-metadata"
import { STARTER_LESSONS } from "@/data/lesson-catalog"
import { semanticsData } from "@/data/semantics-data"
import { pragmaticsData } from "@/data/pragmatics-data"
import { COURSE_PHASES } from "@/lib/course-phases"
import { getAllGoalPracticeTasks } from "@/lib/goal-practice"

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    ...PUBLIC_ROUTES.map(route => route.path),
    ...STARTER_LESSONS.map(lesson => `/learn/${lesson.id}`),
    ...COURSE_PHASES.map(phase => `/checkpoints/${phase.id}`),
    ...COURSE_PHASES.flatMap(phase => [`/placement/${phase.id}`, `/checkpoints/${phase.id}/kanji`]),
    ...getAllGoalPracticeTasks().map(task => `/practice/${task.id}`),
    ...semanticsData.map(point => `/semantics/${point.id}`),
    ...pragmaticsData.map(point => `/pragmatics/${point.id}`),
  ]
  return paths.map(path => ({ url: new URL(path, SITE_ORIGIN).href }))
}
