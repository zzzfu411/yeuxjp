import { Button } from "@/components/ui/button"
import type { CourseKanaDirection } from "@/lib/course-kana"

export function CourseKanaPrompt({ direction, glyph, answered, onPlay }: {
  direction: CourseKanaDirection
  glyph: string
  answered: boolean
  onPlay: (text: string) => void
}) {
  return <div className="text-center" data-testid="course-kana-prompt">
    <p className="text-sm text-muted-foreground">{direction === "listening" ? "听音，选择对应假名" : "看假名，选择读音"}</p>
    {direction === "recognition" && <p lang="ja" className="my-5 font-jp text-6xl">{glyph}</p>}
    {(direction === "listening" || answered) && <Button variant="outline" className="mt-4" onClick={() => onPlay(glyph)}>播放发音</Button>}
  </div>
}
