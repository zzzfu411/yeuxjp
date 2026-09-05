import { routeMetadata } from "@/lib/site-metadata"

export const metadata = routeMetadata("/quiz")

import { QuizPage } from "@/components/quiz/quiz-page"

export default function QuizRoute() {
  return (
    <div data-route-shell="quiz">
      <QuizPage />
    </div>
  )
}
