import { routeMetadata } from "@/lib/site-metadata"

export const metadata = routeMetadata("/semantics")

import { SemanticsReferencePage } from "@/components/reference/semantics-reference-page"

export default function SemanticsPage() {
  return <SemanticsReferencePage enableQueryRedirect />
}
