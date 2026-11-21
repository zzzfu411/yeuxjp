import type { Lesson } from "@/data/lesson-types"
import type { LessonProgress } from "@/lib/learning-progress-types"
import { consolidationLabel, COURSE_ASSESSMENT_THRESHOLD, getLessonConsolidation } from "@/lib/lesson-consolidation"
import { Button } from "@/components/ui/button"

export function LessonConsolidation({ lesson, progress, onPractice }: {
  lesson: Lesson
  progress?: LessonProgress
  onPractice: () => Promise<void>
}) {
  const assessment = getLessonConsolidation(lesson.id, progress)
  const remaining = new Set(assessment.practiceStepIds)
  if (!assessment.total) return null
  return (
    <section id="lesson-consolidation" data-testid="lesson-consolidation" className="mt-5 scroll-mt-28 border-t border-border/40 pt-5">
      <h3 className="text-lg font-semibold">{consolidationLabel(assessment)}</h3>
      <p className="mt-2 text-sm leading-7 text-muted-foreground">
        当前版本已测 {assessment.measured}/{assessment.total} 题，独立答对 {assessment.independentCorrect}/{assessment.total}。
        {assessment.score !== null ? ` 本课得分 ${assessment.score}%。` : " 尚无有效测评记录。"}
        完成记录与首次成绩保留；全部题目有当前版本作答且独立正确率达到 {COURSE_ASSESSMENT_THRESHOLD}% 才标记“本课测评达标”。这不代表长期掌握或开放表达能力。
      </p>
      {remaining.size > 0 && <>
        <p className="mt-3 text-sm font-semibold">待补测、答错或使用过提示的题</p>
        <ul className="mt-2 list-inside list-disc text-sm leading-7 text-muted-foreground">
          {lesson.steps.filter(step => remaining.has(step.id)).map(step => <li key={step.id}>{step.title}</li>)}
        </ul>
        <Button type="button" variant="outline" className="mt-3" onClick={onPractice} data-testid="lesson-consolidation-start">补练这 {remaining.size} 题</Button>
      </>}
    </section>
  )
}
