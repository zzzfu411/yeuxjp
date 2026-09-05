import { routeMetadata } from "@/lib/site-metadata"

export const metadata = routeMetadata("/review")

import { ReviewPage } from "@/components/review/review-page"

export default function ReviewRoute() {
  return <ReviewPage />
}
