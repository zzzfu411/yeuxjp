"use client"
import { useId } from "react"
import { Button } from "@/components/ui/button"
import { useWrittenWork } from "@/lib/use-written-work"
import { canCompleteWork, WORK_DRAFT_LIMIT, writingKey, type WritingTask } from "@/lib/written-work-model"

export function WrittenWorkEditor({ task }: { task: WritingTask }) {
  return <Editor key={writingKey(task)} task={task} />
}
function Editor({ task }: { task: WritingTask }) {
  const editor = useWrittenWork(task)
  const id = useId()
  return <div className="mt-5 space-y-3" data-testid="written-work" data-work-id={task.id}>
    <label htmlFor={id} className="block text-base font-semibold">我的表达 / 口述笔记</label>
    <textarea id={id} rows={5} maxLength={WORK_DRAFT_LIMIT} disabled={!editor.loaded} value={editor.input.draft}
      onChange={event => editor.save({ ...editor.input, draft: event.target.value, checked: [] })}
      className="w-full resize-y border border-border bg-background p-3 text-base leading-8" placeholder="写下自己的表达；也可以记录口述内容和需要改进的地方。" />
    <p className="text-sm text-muted-foreground" role="status" data-testid="work-save-status">{!editor.loaded ? "正在读取作品…" : editor.pending ? "正在保存…" : editor.error ? "未保存，请先保留当前文字。" : editor.completed ? "已保存 · 已完成自查（本人确认）" : "已保存草稿"}</p>
    {editor.error && <div role="alert" className="space-y-2 text-sm leading-7">
      <p>存储不可用、记录损坏或其他页面已修改这份作品。当前文字仍留在编辑框，请复制保留；系统不会覆盖冲突记录。</p>
      <div className="flex flex-wrap gap-3"><Button variant="outline" disabled={editor.pending} onClick={() => editor.save(editor.input)}>重试保存</Button><Button variant="outline" disabled={editor.pending} onClick={editor.reloadSaved}>已复制文字，读取保存版本</Button></div>
    </div>}
    <fieldset disabled={!editor.loaded || editor.pending || editor.error} className="space-y-3">
      <legend className="mb-3 text-sm font-semibold">逐项自查，按自己实际做到的情况勾选</legend>
      {task.criteria.map((criterion, index) => <label key={criterion} className="flex items-start gap-3 text-sm leading-7"><input type="checkbox" className="mt-1.5 h-4 w-4 shrink-0" checked={editor.input.checked.includes(index)} onChange={event => editor.save({ ...editor.input,
        checked: event.target.checked ? [...editor.input.checked, index] : editor.input.checked.filter(value => value !== index) })} />{criterion}</label>)}
      <label className="flex items-start gap-3 text-sm leading-7"><input type="checkbox" className="mt-1.5 h-4 w-4 shrink-0" checked={editor.input.usedModel} onChange={event => editor.save({ ...editor.input, usedModel: event.target.checked })} />我参考了示范或其他资料（自报）</label>
      <Button variant="outline" disabled={!canCompleteWork(task, editor.input) || editor.completed} onClick={() => editor.save(editor.input, true)} data-testid="work-complete">保存并确认完成自查</Button>
    </fieldset>
    <p className="text-xs leading-6 text-muted-foreground">文字修改会取消之前的自查与完成状态。作品仅保存在当前浏览器，可随学习备份迁移；不自动评价口语、语法正确率或等级。</p>
    {editor.history.length > 0 && <details className="border-t border-border/40 pt-3"><summary className="cursor-pointer text-sm">查看旧版本作品（{editor.history.length}）</summary>{editor.history.map(work => <article key={work.version} className="mt-3 text-sm leading-7"><p>{work.task.title} · {work.completedAt !== undefined ? "曾完成自查" : "草稿"}</p><p>{work.task.prompt}</p><pre className="whitespace-pre-wrap break-words font-sans">{work.draft}</pre></article>)}</details>}
  </div>
}
