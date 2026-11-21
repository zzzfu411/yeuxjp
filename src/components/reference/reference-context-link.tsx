"use client"

import Link from "next/link"
import { createContext, useContext, type ComponentProps } from "react"
import { referenceContextHref, type ReferenceCatalogState } from "@/lib/reference-catalog-model"

export const ReferenceContext = createContext<ReferenceCatalogState>({ query: "", page: 1 })

export function ReferenceContextLink({ href, ...props }: Omit<ComponentProps<typeof Link>, "href"> & { href: string }) {
  const context = useContext(ReferenceContext)
  return <Link {...props} href={referenceContextHref(href, context)} />
}
