export type GrammarPracticeTemplate = {
  id: string
  prompt: string
  answer: string
  options?: string[]
}

export type GrammarPracticeSet = {
  grammarId: string
  practiceTemplates: GrammarPracticeTemplate[]
}
