import { shuffleList } from "@/lib/question-options"
import { isQuestionAnswerCorrect, type Question } from "@/lib/questions"

export const SENTENCE_ASSEMBLY_INSTRUCTION = "每个词块使用一次，按题目语境组成句子。本题按已收录的表达判定；不收录的排列不一定都是语法错误。"
export const SENTENCE_ASSEMBLY_MISMATCH = "这次排列未匹配本题收录的表达。请对照示例检查助词、接续和句意；这不等于其他所有语序都不成立。"

/** Keep repeated tiles distinct, and avoid exposing any accepted answer in the tray. */
export function shuffleSentenceChunks(chunks: readonly string[], question: Pick<Question, "correctAnswer" | "acceptedAnswers">, random: () => number) {
  const shuffled = shuffleList(chunks.map((chunk, idx) => ({ chunk, idx })), random)
  const revealsAnswer = (tiles: typeof shuffled) => isQuestionAnswerCorrect(question, tiles.map(tile => tile.chunk).join(""))
  if (!revealsAnswer(shuffled)) return shuffled
  for (let left = 0; left < shuffled.length; left++) {
    for (let right = left + 1; right < shuffled.length; right++) {
      const candidate = [...shuffled]
      ;[candidate[left], candidate[right]] = [candidate[right], candidate[left]]
      if (!revealsAnswer(candidate)) return candidate
    }
  }
  return shuffled
}
