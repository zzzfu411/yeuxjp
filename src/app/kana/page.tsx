import { routeMetadata } from "@/lib/site-metadata"

export const metadata = routeMetadata("/kana")

import { KanaPage } from "@/components/kana/kana-page"

export default function KanaRoute() {
  return (
    <div data-route-shell="kana">
      <KanaPage />
    </div>
  )
}
