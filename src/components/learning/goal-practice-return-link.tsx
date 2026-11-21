"use client"
import { Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { goalPracticeReturn } from "@/lib/goal-practice-navigation"

export function GoalPracticeReturnLink() {
  return <Suspense fallback={<ReturnLink href="/#daily-study-plan" label="返回今日安排" />}><QueryReturnLink /></Suspense>
}
function QueryReturnLink() {
  const query = useSearchParams()
  return <ReturnLink {...goalPracticeReturn(query.get("source"), query.get("mediaLevel"))} />
}
function ReturnLink({ href, label }: { href: string; label: string }) {
  return <Link href={href} className="text-sm underline underline-offset-4" data-testid="goal-practice-return">{label}</Link>
}
