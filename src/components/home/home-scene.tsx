import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { LearningEntry } from "@/lib/learning-entry"
import { WordCorridor } from "@/components/home/word-corridor"

export function HomeScene({ entry }: { entry: LearningEntry }) {
  return (
    <section className="word-corridor" aria-labelledby="home-cover-title">
      <div className="corridor-heading">
        <h1 id="home-cover-title" lang="ja">優しい<br />日本語<span>。</span></h1>
        <p>穿过字句，<br />走进喜欢的世界。</p>
      </div>
      <WordCorridor />
      <div className="corridor-lesson">
        <p className="vn-lesson-label">{entry.kind === "consolidation" ? "先巩固这一课" : entry.kind === "lesson" ? "今日课程" : "今日练习"}</p>
        <h2>{entry.title}</h2>
        <p className="vn-lesson-description">{entry.subtitle}</p>
        <Link href={entry.href} data-testid="home-start-learning" aria-label={entry.cta} className="anime-button anime-button-primary manga-impact vn-start-button">
          {entry.cta}<ArrowRight size={21} aria-hidden="true" />
        </Link>
      </div>
    </section>
  )
}
