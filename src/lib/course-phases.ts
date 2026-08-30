import type { Lesson, LessonTrack } from "@/data/lesson-types"
import type { KanaLevel } from "@/lib/learning-progress-model"
import { countSatisfiedLessons, getNextCourseLesson } from "@/lib/lesson-skip"

export type CoursePhaseId = "n5" | "n4" | "n3" | "n2"

export type CoursePhase = {
  id: CoursePhaseId
  track: LessonTrack
  label: string
  short: string
  range: string
}

export const COURSE_PHASES: readonly CoursePhase[] = [
  { id: "n5", track: "starter-45", label: "N5 骨架", short: "假名、助词、生存句", range: "Day 1–45" },
  { id: "n4", track: "n4-core", label: "N4 日常", short: "条件、授受、语态", range: "Day 46–90" },
  { id: "n3", track: "n3-core", label: "N3 说明", short: "わけ/はず、立场、书面连接", range: "Day 91–135" },
  { id: "n2", track: "n2-core", label: "N2 书面", short: "新闻、商务、对照连接", range: "Day 136–175" },
]

const PHASE_BY_TRACK = new Map(COURSE_PHASES.map((phase) => [phase.track, phase]))

export function getCoursePhaseByTrack(track: LessonTrack | null | undefined) {
  if (!track) return COURSE_PHASES[0]
  return PHASE_BY_TRACK.get(track) ?? COURSE_PHASES[0]
}

export function getLessonCoursePhase(lesson: Pick<Lesson, "track">) {
  return getCoursePhaseByTrack(lesson.track)
}

export function getActiveCoursePhase(
  lessons: readonly Pick<Lesson, "id" | "track" | "order" | "prerequisites">[],
  completedLessonIds: ReadonlySet<string>,
  activeLessonId?: string | null,
  kanaLevel?: KanaLevel | null
) {
  const active = (activeLessonId && lessons.find((lesson) => lesson.id === activeLessonId))
    || getNextCourseLesson(lessons, completedLessonIds, kanaLevel)
  if (!active) return COURSE_PHASES[COURSE_PHASES.length - 1]
  return getCoursePhaseByTrack(active.track)
}

export function countPhaseProgress(
  lessons: readonly Pick<Lesson, "id" | "track" | "order">[],
  completedLessonIds: ReadonlySet<string>,
  track: LessonTrack,
  kanaLevel?: KanaLevel | null
) {
  const phaseLessons = lessons.filter((lesson) => lesson.track === track)
  return {
    done: countSatisfiedLessons(phaseLessons, completedLessonIds, kanaLevel),
    total: phaseLessons.length,
  }
}
