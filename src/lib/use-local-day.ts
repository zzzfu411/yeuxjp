"use client"
import { useEffect, useState } from "react"
import { millisecondsUntilNextLocalDay } from "@/lib/daily-goal"

export function useLocalDay() {
  const [day, setDay] = useState(() => new Date())
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const schedule = () => {
      timer = setTimeout(() => { setDay(new Date()); schedule() }, millisecondsUntilNextLocalDay())
    }
    const refresh = () => {
      if (document.visibilityState === "visible") setDay(new Date())
    }
    schedule()
    document.addEventListener("visibilitychange", refresh)
    return () => { clearTimeout(timer); document.removeEventListener("visibilitychange", refresh) }
  }, [])
  return day
}
