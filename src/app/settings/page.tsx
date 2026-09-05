import { SettingsPage } from "@/components/settings/settings-page"
import { routeMetadata } from "@/lib/site-metadata"

export const metadata = routeMetadata("/settings")

export default function SettingsRoute() { return <SettingsPage /> }
