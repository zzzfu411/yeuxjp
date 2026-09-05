import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { LearningEntry } from "@/lib/learning-entry"

export function HomeScene({ entry }: { entry: LearningEntry }) {
  return (
    <section className="vn-scene" aria-labelledby="home-cover-title">
      <div className="vn-scene-heading">
        <p className="vn-scene-intro"><span aria-hidden="true">ことばの時間</span>Yasashi Japanese</p>
        <h1 id="home-cover-title" className="vn-title" lang="ja">優しい<span>日本語<span className="vn-title-stop" aria-hidden="true">。</span></span></h1>
        <p className="vn-scene-description">每天一小课，<br className="vn-mobile-break" />把喜欢，读成日常。</p>
      </div>
      <figure className="vn-scene-figure">
        <div className="vn-scene-art" aria-hidden="true">
          <Image src="/assets/visual-novel/megumi-manga.webp" alt="" fill sizes="(max-width: 760px) 640px, (max-width: 1280px) 92vw, 1180px" loading="eager" fetchPriority="high" className="vn-scene-image" />
        </div>
        <figcaption className="vn-speech" lang="ja">今日も、<br />一緒に。</figcaption>
      </figure>
      <div className="vn-scene-lesson">
        <p className="vn-lesson-label"><span aria-hidden="true">TODAY</span>{entry.kind === "lesson" ? "今日课程" : "今日练习"}</p>
        <h2>{entry.title}</h2>
        <p className="vn-lesson-description">{entry.subtitle}</p>
        <Link href={entry.href} data-testid="home-start-learning" aria-label={entry.cta} className="anime-button anime-button-primary vn-start-button">
          {entry.cta}<ArrowRight size={21} aria-hidden="true" />
        </Link>
      </div>
      <p className="vn-cover-note" aria-hidden="true">一頁ずつ、日常が変わる。</p>
    </section>
  )
}
