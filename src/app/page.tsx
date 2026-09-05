import { routeMetadata } from "@/lib/site-metadata"

export const metadata = routeMetadata("/")

import { HomePage } from "@/components/home/home-page"

export default function HomeRoute() {
  return <HomePage />
}
