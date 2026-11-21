import { normalizeAnswer } from "@/lib/questions"
import { SENTENCE_ASSEMBLY_MISMATCH } from "@/lib/sentence-assembly"

export function SentenceAnswerNotes({ answer, acceptedAnswers = [], wrong }: {
  answer: string
  acceptedAnswers?: string[]
  wrong: boolean
}) {
  const alternatives = acceptedAnswers.filter(value => normalizeAnswer(value) !== normalizeAnswer(answer))
  return <div className="mt-2 space-y-2">
    {alternatives.length ? <details>
      <summary className="cursor-pointer font-medium">也接受的表达（{alternatives.length}）</summary>
      <ul className="mt-2 space-y-1 pl-5 list-disc" lang="ja">{alternatives.map(value => <li key={value}>{value}</li>)}</ul>
    </details> : null}
    {wrong ? <p>{SENTENCE_ASSEMBLY_MISMATCH}</p> : null}
  </div>
}
