import { routeMetadata } from "@/lib/site-metadata"

export const metadata = routeMetadata("/review")

import { ReviewPage } from "@/components/review/review-page"
import { Suspense } from "react"

export default function ReviewRoute() {
  return <section data-route-shell="review"><Suspense fallback={<p className="paper-wrap py-10" role="status">正在读取复习安排…</p>}><ReviewPage /></Suspense></section>
}
