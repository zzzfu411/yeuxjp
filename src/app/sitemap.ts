import type { MetadataRoute } from "next"
import { SITE_ORIGIN, PUBLIC_ROUTES } from "@/lib/site-metadata"
import { STARTER_LESSONS } from "@/data/lesson-catalog"
import { semanticsData } from "@/data/semantics-data"
import { pragmaticsData } from "@/data/pragmatics-data"

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    ...PUBLIC_ROUTES.map(route => route.path),
    ...STARTER_LESSONS.map(lesson => `/learn/${lesson.id}`),
    ...semanticsData.map(point => `/semantics/${point.id}`),
    ...pragmaticsData.map(point => `/pragmatics/${point.id}`),
  ]
  return paths.map(path => ({ url: new URL(path, SITE_ORIGIN).href }))
}
