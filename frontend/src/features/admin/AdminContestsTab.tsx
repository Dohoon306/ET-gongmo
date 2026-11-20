import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { api } from '../../api/client.ts'
import { choicesForAxis, withoutCategory } from '../../common/categoryFields.ts'
import { useGet } from '../team/api.ts'
import { Card, ErrorText, primaryButton, secondaryButton } from '../team/ui.tsx'
import type { AdminContest } from './adminApi.ts'

type Category = { id: number; name: string; axis: string; code: string; fieldCodes: string[] }

const AXIS_LABELS: [string, string][] = [
  ['FIELD', '분야'],
  ['ROLE', '직무'],
  ['SKILL', '기술'],
  ['LEVEL', '수준'],
  ['GOAL', '목표'],
]

type Form = {
  title: string
  type: string
  host: string
  startDate: string
  endDate: string
  target: string
  prize: string
  benefit: string
  gongmoaUrl: string
  sourceUrl: string
  categoryIds: number[]
}

const EMPTY: Form = {
  title: '',
  type: '공모전',
  host: '',
  startDate: '',
  endDate: '',
  target: '',
  prize: '',
  benefit: '',
  gongmoaUrl: '',
  sourceUrl: '',
  categoryIds: [],
}

const TEXT_FIELDS: { key: keyof Form; label: string; type?: string }[] = [
  { key: 'title', label: '제목 (필수)' },
  { key: 'type', label: '유형' },
  { key: 'host', label: '주최' },
  { key: 'startDate', label: '접수 시작', type: 'date' },
  { key: 'endDate', label: '마감일', type: 'date' },
  { key: 'target', label: '대상' },
  { key: 'prize', label: '1등 상금' },
  { key: 'benefit', label: '혜택' },
  { key: 'sourceUrl', label: '주최 측 원문 링크' },
  { key: 'gongmoaUrl', label: '공모아뷰 링크' },
]

const toForm = (c: AdminContest): Form => ({
  title: c.title,
  type: c.type ?? '',
  host: c.host ?? '',
  startDate: c.startDate ?? '',
  endDate: c.endDate ?? '',
  target: c.target ?? '',
  prize: c.prize ?? '',
  benefit: c.benefit ?? '',
  gongmoaUrl: c.gongmoaUrl ?? '',
  sourceUrl: c.sourceUrl ?? '',
  categoryIds: c.categoryIds,
})

export default function AdminContestsTab() {
  const { data, error, reload } = useGet<AdminContest[]>('/api/admin/contests')
  const categories = useGet<Category[]>('/api/categories')
  const [editing, setEditing] = useState<number | 'new' | null>(null)
  const [form, setForm] = useState<Form>(EMPTY)
  const [query, setQuery] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)

  const open = (target: AdminContest | 'new') => {
    setActionError(null)
    setEditing(target === 'new' ? 'new' : target.id)
    setForm(target === 'new' ? EMPTY : toForm(target))
  }

  async function save(e: FormEvent) {
    e.preventDefault()
    setActionError(null)
    const body = { ...form, startDate: form.startDate || null, endDate: form.endDate || null }
    try {
      if (editing === 'new') await api('/api/admin/contests', { method: 'POST', body })
      else await api(`/api/admin/contests/${editing}`, { method: 'PUT', body })
      setEditing(null)
      reload()
    } catch (err) {
      setActionError((err as Error).message)
    }
  }

  async function remove(c: AdminContest) {
    if (!window.confirm(`"${c.title}" 공모전을 지울까요? 관심 공고 저장도 같이 지워져요.`)) return
    setActionError(null)
    try {
      await api(`/api/admin/contests/${c.id}`, { method: 'DELETE' })
      reload()
    } catch (err) {
      setActionError((err as Error).message)
    }
  }

  const toggleCategory = (category: Category) =>
    setForm((f) => ({
      ...f,
      categoryIds: f.categoryIds.includes(category.id)
        ? withoutCategory(categories.data ?? [], f.categoryIds, category)
        : [...f.categoryIds, category.id],
    }))

  const shown = data?.filter((c) => c.title.toLowerCase().includes(query.trim().toLowerCase())) ?? []

  return (
    <>
      <ErrorText message={error ?? actionError} />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="공모전 제목 검색"
          aria-label="공모전 제목 검색"
          className="h-10 min-w-0 flex-1 rounded-xl border border-(--color-line-strong) bg-white px-3 text-[15px]"
        />
        <button onClick={() => open('new')} className={primaryButton}>
          공모전 추가
        </button>
      </div>

      {editing !== null && (
        <Card className="mb-5 p-5">
          <form onSubmit={save}>
            <p className="mb-3 text-[15px] font-bold">{editing === 'new' ? '새 공모전' : `공모전 #${editing} 수정`}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {TEXT_FIELDS.map((f) => (
                <label key={f.key} className="block text-sm">
                  <span className="font-semibold">{f.label}</span>
                  <input
                    type={f.type ?? 'text'}
                    value={form[f.key] as string}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    className="mt-1 h-10 w-full rounded-xl border border-(--color-line-strong) px-3 text-[15px]"
                  />
                </label>
              ))}
            </div>
            <fieldset className="mt-4">
              <legend className="text-sm font-semibold">태그 (추천에 쓰여요)</legend>
              <div className="mt-2 space-y-3">
                {AXIS_LABELS.map(([axis, label]) => {
                  const choices = choicesForAxis(categories.data ?? [], axis, form.categoryIds)
                  return (
                    <div key={axis} role="group" aria-label={label} className="flex items-start gap-3">
                      <span className="w-10 shrink-0 pt-1 text-[13px] text-(--color-muted)">{label}</span>
                      {categories.data && choices.length === 0 ? (
                        <p className="pt-1 text-[13px] text-(--color-muted)">분야를 먼저 골라 주세요. 고른 분야에 맞는 태그가 나와요.</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {choices.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              aria-pressed={form.categoryIds.includes(c.id)}
                              onClick={() => toggleCategory(c)}
                              className={`h-7 rounded-full px-3 text-[13px] font-medium ${form.categoryIds.includes(c.id) ? 'bg-brand text-white' : 'bg-(--color-subtle) text-(--color-ink-2)'}`}
                            >
                              {c.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </fieldset>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setEditing(null)} className={secondaryButton}>
                취소
              </button>
              <button type="submit" disabled={!form.title.trim()} className={primaryButton}>
                저장
              </button>
            </div>
          </form>
        </Card>
      )}

      <p className="mb-3 text-[13px] text-(--color-muted)">공모전 {shown.length}개</p>
      <ul className="space-y-2">
        {shown.map((c) => (
          <li key={c.id}>
            <Card className="flex flex-wrap items-center gap-3 px-5 py-3">
              <div className="min-w-0 flex-1">
                <Link to={`/contests/${c.id}`} className="block truncate text-[15px] font-semibold hover:underline">
                  {c.title}
                </Link>
                <p className="text-xs text-(--color-muted)">
                  #{c.id} · {c.type ?? '-'} · {c.host ?? '-'} · 마감 {c.endDate ?? '상시'}
                  {c.gongmoaId < 0 ? ' · 관리자가 추가' : ''}
                </p>
              </div>
              <button onClick={() => open(c)} className={secondaryButton}>
                수정
              </button>
              <button onClick={() => remove(c)} className={`${secondaryButton} text-red-700`}>
                삭제
              </button>
            </Card>
          </li>
        ))}
      </ul>
    </>
  )
}
