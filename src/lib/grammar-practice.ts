import type { GrammarPoint, GrammarPracticeTemplate } from "@/data/grammar-data"
import type { Question } from "@/lib/questions"
import { shuffleList } from "@/lib/question-options"
import { createSeededRandom } from "@/lib/seeded-random"
import { getQuestionContentVersion } from "@/lib/question-content-version"

function normalizedOptions(template: GrammarPracticeTemplate) {
  const seen = new Set<string>()
  const options: string[] = []

  for (const candidate of template.options ?? []) {
    const value = candidate.trim()
    if (!value || seen.has(value)) continue
    seen.add(value)
    options.push(value)
  }

  return options
}

function buildExplanation(point: GrammarPoint) {
  const explanation = point.plainExplanation?.trim() || point.explanation.trim()
  return `${point.title}：${explanation} 结构：${point.structure}`
}

export function grammarPracticeTemplateToQuestion(
  point: GrammarPoint,
  template: GrammarPracticeTemplate
): Question | null {
  const id = template.id.trim()
  const prompt = template.prompt.trim()
  const answer = template.answer.trim()
  const options = normalizedOptions(template)

  if (!id || !prompt || !answer || options.length < 2 || !options.includes(answer)) return null

  const question: Question = {
    type: "grammar-practice",
    itemId: point.id,
    itemType: "grammar",
    mode: "recognition",
    mistakeId: `grammar-practice:${point.id}:${id}`,
    questionText: prompt,
    correctAnswer: answer,
    correctDisplay: answer,
    explanation: buildExplanation(point),
    options: options.map((value) => ({ value, display: value })),
  }
  return { ...question, questionVersion: getQuestionContentVersion(question) }
}

export function buildGrammarPracticeQuestions(point: GrammarPoint, attemptSeed = "preview"): Question[] {
  return (point.practiceTemplates ?? [])
    .map((template) => grammarPracticeTemplateToQuestion(point, template))
    .filter((question): question is Question => question !== null)
    .map(question => ({ ...question, options: shuffleList(question.options,
      createSeededRandom(`${attemptSeed}:${question.mistakeId}`)) }))
}
