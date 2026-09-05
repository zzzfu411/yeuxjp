import { routeMetadata } from "@/lib/site-metadata"

export const metadata = routeMetadata("/path")

import { SkillTreePage } from "@/components/path/skill-tree-page"

export default function PathPage() {
  return <SkillTreePage />
}
