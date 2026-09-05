import { routeMetadata } from "@/lib/site-metadata"

export const metadata = routeMetadata("/pragmatics")

import { PragmaticsReferencePage } from "@/components/reference/pragmatics-reference-page"

export default function PragmaticsPage() {
  return <PragmaticsReferencePage enableQueryRedirect />
}
