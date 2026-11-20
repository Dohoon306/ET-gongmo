import { useEffect, useState, type ReactNode } from 'react'
import { api, ApiError } from '../../api/client.ts'

export type MyAccount = {
  id: number
  name: string
  intro: string | null
  categoryIds: number[]
  nameChangeAvailableAt: string | null
}

type Axis = 'FIELD' | 'ROLE' | 'SKILL' | 'LEVEL' | 'GOAL'
type Category = { id: number; axis: Axis; name: string }

const axes: { axis: Axis; label: string }[] = [
  { axis: 'FIELD', label: '분야' },
  { axis: 'ROLE', label: '직무' },
  { axis: 'SKILL', label: '기술' },
  { axis: 'LEVEL', label: '수준 (하나만)' },
  { axis: 'GOAL', label: '목표' },
]

const smallButton = 'inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40'
const saveButton = `${smallButton} bg-brand text-white hover:bg-brand-strong`
const cancelButton = `${smallButton} border border-line-strong bg-white text-ink hover:bg-subtle`

function messageOf(failure: unknown) {
  return failure instanceof ApiError ? failure.message : '저장하지 못했어요. 잠시 뒤에 다시 시도해 주세요.'
}

function availableText(iso: string) {
  const [date, time] = iso.split('T')
  const [, month, day] = date.split('-').map(Number)
  return `${month}월 ${day}일 ${time.slice(0, 5)}`
}

export function PencilButton({ label, onClick, disabled = false, title }: {
  label: string
  onClick: () => void
  disabled?: boolean
  title?: string
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={title ?? label}
      onClick={onClick}
      disabled={disabled}
      className="inline-grid size-8 shrink-0 place-items-center rounded-md text-muted hover:bg-subtle hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
    >
      <svg aria-hidden viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.8 2.7a1.6 1.6 0 0 1 2.3 2.3L5.6 12.5 2.5 13.5l1-3.1 7.3-7.7Z" />
        <path d="m9.6 4 2.4 2.4" />
      </svg>
    </button>
  )
}

function ErrorLine({ message }: { message: string | null }) {
  return message ? <p role="alert" className="text-sm text-danger">{message}</p> : null
}

export function NameField({ name, own, account, onSaved }: {
  name: string
  own: boolean
  account: MyAccount | null
  onSaved: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(name)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lockedUntil = account?.nameChangeAvailableAt ?? null

  async function save() {
    setSaving(true)
    setError(null)
    try {
      await api('/api/users/me/name', { method: 'PUT', body: { name: value } })
      setEditing(false)
      onSaved()
    } catch (failure) {
      setError(messageOf(failure))
    } finally {
      setSaving(false)
    }
  }

  if (editing) {
    return (
      <form className="space-y-2" onSubmit={(event) => { event.preventDefault(); void save() }}>
        <label className="block text-xs font-semibold text-muted" htmlFor="profile-name">이름</label>
        <input
          id="profile-name"
          value={value}
          maxLength={30}
          autoFocus
          onChange={(event) => setValue(event.target.value)}
          className="h-10 w-full rounded-md border border-line-strong px-3 text-lg font-bold focus:border-brand focus:outline-none"
        />
        <p className="text-xs text-accent">이름은 한 달에 한 번만 바꿀 수 있어요.</p>
        <ErrorLine message={error} />
        <div className="flex gap-1.5">
          <button type="submit" className={saveButton} disabled={saving || value.trim() === '' || value.trim() === name}>{saving ? '저장 중…' : '저장'}</button>
          <button type="button" className={cancelButton} disabled={saving} onClick={() => { setEditing(false); setValue(name); setError(null) }}>취소</button>
        </div>
      </form>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-1">
        <h1 className="min-w-0 break-words text-2xl font-bold leading-[1.3] tracking-[-0.02em]">{name}</h1>
        {own && (
          <PencilButton
            label="이름 변경"
            disabled={account === null || lockedUntil !== null}
            title={lockedUntil ? `${availableText(lockedUntil)}부터 다시 바꿀 수 있어요` : '이름 변경'}
            onClick={() => { setValue(name); setEditing(true) }}
          />
        )}
      </div>
      {own && lockedUntil && (
        <p className="mt-0.5 text-xs text-muted">이름은 한 달에 한 번만 바꿀 수 있어요 · {availableText(lockedUntil)}부터 가능</p>
      )}
    </div>
  )
}

export function IntroField({ intro, own, onSaved }: { intro: string | null; own: boolean; onSaved: () => void }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(intro ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    setSaving(true)
    setError(null)
    try {
      await api('/api/users/me/intro', { method: 'PUT', body: { intro: value } })
      setEditing(false)
      onSaved()
    } catch (failure) {
      setError(messageOf(failure))
    } finally {
      setSaving(false)
    }
  }

  if (!own && !intro) return null

  return (
    <Section title="자기소개" action={own && !editing ? <PencilButton label="자기소개 수정" onClick={() => { setValue(intro ?? ''); setEditing(true) }} /> : null}>
      {editing ? (
        <form className="space-y-2" onSubmit={(event) => { event.preventDefault(); void save() }}>
          <textarea
            aria-label="자기소개"
            value={value}
            maxLength={1000}
            rows={4}
            autoFocus
            onChange={(event) => setValue(event.target.value)}
            className="w-full resize-y rounded-md border border-line-strong px-3 py-2 text-sm leading-[1.6] focus:border-brand focus:outline-none"
          />
          <p className="text-right text-xs tabular-nums text-muted">{value.length} / 1000</p>
          <ErrorLine message={error} />
          <div className="flex gap-1.5">
            <button type="submit" className={saveButton} disabled={saving || value.trim() === ''}>{saving ? '저장 중…' : '저장'}</button>
            <button type="button" className={cancelButton} disabled={saving} onClick={() => { setEditing(false); setError(null) }}>취소</button>
          </div>
        </form>
      ) : (
        <p className="whitespace-pre-line break-words break-keep text-sm leading-[1.6] text-ink-2">{intro || '아직 자기소개가 없어요.'}</p>
      )}
    </Section>
  )
}

export function TagField({ tags, own, account, onSaved }: {
  tags: string[]
  own: boolean
  account: MyAccount | null
  onSaved: () => void
}) {
  const [categories, setCategories] = useState<Category[] | null>(null)
  const [editing, setEditing] = useState(false)
  const [selected, setSelected] = useState<number[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!editing || categories) return
    api<Category[]>('/api/categories').then(setCategories, (failure) => setError(messageOf(failure)))
  }, [editing, categories])

  function toggle(category: Category) {
    setError(null)
    setSelected((current) => {
      if (current.includes(category.id)) return current.filter((id) => id !== category.id)
      if (category.axis !== 'LEVEL' || !categories) return [...current, category.id]
      const levelIds = categories.filter((other) => other.axis === 'LEVEL').map((other) => other.id)
      return [...current.filter((id) => !levelIds.includes(id)), category.id]
    })
  }

  async function save() {
    setSaving(true)
    setError(null)
    try {
      await api('/api/users/me/categories', { method: 'PUT', body: { categoryIds: selected } })
      setEditing(false)
      onSaved()
    } catch (failure) {
      setError(messageOf(failure))
    } finally {
      setSaving(false)
    }
  }

  const action = own && !editing
    ? <PencilButton label="태그 수정" disabled={account === null} onClick={() => { setSelected(account?.categoryIds ?? []); setEditing(true) }} />
    : null

  return (
    <Section title="태그" action={action}>
      {editing ? (
        <div className="space-y-3">
          {categories === null && !error && <p role="status" className="text-sm text-muted">태그 목록을 불러오는 중이에요.</p>}
          {categories && axes.map(({ axis, label }) => (
            <div key={axis} role="group" aria-label={label} className="space-y-1.5">
              <p className="text-xs font-semibold text-muted">{label}</p>
              <div className="flex flex-wrap gap-1.5">
                {categories.filter((category) => category.axis === axis).map((category) => {
                  const on = selected.includes(category.id)
                  return (
                    <button
                      key={category.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggle(category)}
                      className={`inline-flex h-8 items-center rounded-sm border px-2.5 text-[13px] ${on ? 'border-brand bg-brand font-semibold text-white' : 'border-line-strong bg-white font-medium text-ink-2 hover:bg-page'}`}
                    >
                      {category.name}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
          <ErrorLine message={error} />
          <div className="flex items-center gap-1.5">
            <button type="button" className={saveButton} disabled={saving || selected.length === 0} onClick={save}>{saving ? '저장 중…' : `저장 (${selected.length}개)`}</button>
            <button type="button" className={cancelButton} disabled={saving} onClick={() => { setEditing(false); setError(null) }}>취소</button>
          </div>
        </div>
      ) : tags.length > 0 ? (
        <ul aria-label="카테고리" className="flex flex-wrap gap-1.5">
          {tags.map((tag) => <li key={tag} className="inline-flex h-[26px] items-center rounded-sm border border-line px-2 text-[13px] font-medium text-ink-2">{tag}</li>)}
        </ul>
      ) : (
        <p className="text-sm text-muted">아직 태그가 없어요.</p>
      )}
    </Section>
  )
}

function Section({ title, action, children }: { title: string; action: ReactNode; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex min-h-8 items-center gap-1">
        <h2 className="text-sm font-bold">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  )
}
