import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { api, ApiError } from '../../api/client.ts'
import { useCurrentUser } from '../../common/useCurrentUser.ts'
import checkIcon from './icons/check-on-brand.svg'
import chevronLeftIcon from './icons/chevron-left.svg'
import sparkleIcon from './icons/sparkle-brand.svg'

type Axis = 'FIELD' | 'ROLE' | 'SKILL' | 'LEVEL' | 'GOAL'
type Category = { id: number; axis: Axis; code: string; name: string; sortOrder: number }
type Suggestion = { name: string; intro: string | null; categoryIds: number[] }
type Loaded = { categories: Category[]; suggestion: Suggestion }

const axes: { axis: Axis; label: string; hint: string }[] = [
  { axis: 'FIELD', label: '분야', hint: '공모전 분야' },
  { axis: 'ROLE', label: '직무', hint: '맡고 싶은 역할' },
  { axis: 'SKILL', label: '기술', hint: '써 봤거나 쓸 기술' },
  { axis: 'LEVEL', label: '수준', hint: '하나만 골라요' },
  { axis: 'GOAL', label: '목표', hint: '이번 공모전에서' },
]

const SINGLE_CHOICE_AXIS: Axis = 'LEVEL'

export default function SignupTagsPage() {
  const { userId } = useCurrentUser()
  const navigate = useNavigate()
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (userId === null) return
    let ignored = false
    Promise.all([api<Category[]>('/api/categories'), api<Suggestion>('/api/users/me/category-suggestion')]).then(
      ([categories, suggestion]) => {
        if (ignored) return
        setLoaded({ categories, suggestion })
        setSelectedIds(suggestion.categoryIds)
      },
      (failure) => {
        if (ignored) return
        setLoadError(failure instanceof ApiError ? failure.message : '태그를 불러오지 못했어요. 잠시 뒤에 다시 시도해 주세요.')
      },
    )
    return () => {
      ignored = true
    }
  }, [userId])

  if (userId === null) {
    return (
      <div className="rounded-2xl border border-line bg-white p-8 text-center">
        <p className="text-gray-600">태그를 정리하려면 먼저 자기소개를 써 주세요.</p>
        <Link to="/signup" className="mt-3 inline-block text-sm font-semibold text-brand hover:underline">
          자기소개 쓰러 가기
        </Link>
      </div>
    )
  }

  if (loadError !== null) {
    return (
      <p role="alert" className="rounded-2xl border border-line bg-white p-8 text-center text-red-700">
        {loadError}
      </p>
    )
  }

  if (loaded === null) {
    return <p className="p-8 text-center text-gray-600">AI가 자기소개를 읽고 있어요</p>
  }

  const { categories, suggestion } = loaded
  const suggested = categories.filter((category) => suggestion.categoryIds.includes(category.id))

  function toggle(category: Category) {
    setSaveError(null)
    setSelectedIds((current) => {
      if (current.includes(category.id)) return current.filter((id) => id !== category.id)
      if (category.axis !== SINGLE_CHOICE_AXIS) return [...current, category.id]
      const sameAxisIds = categories.filter((other) => other.axis === category.axis).map((other) => other.id)
      return [...current.filter((id) => !sameAxisIds.includes(id)), category.id]
    })
  }

  async function confirm() {
    if (selectedIds.length === 0 || saving) return
    setSaving(true)
    setSaveError(null)
    try {
      await api('/api/users/me/categories', { method: 'PUT', body: { categoryIds: selectedIds } })
      navigate('/contests')
    } catch (failure) {
      setSaveError(failure instanceof ApiError ? failure.message : '저장하지 못했어요. 잠시 뒤에 다시 시도해 주세요.')
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-7 pb-12">
      <Link
        to="/signup"
        state={{ name: suggestion.name, intro: suggestion.intro ?? '' }}
        className="flex h-11 items-center gap-1.5 self-start text-sm font-medium text-brand hover:underline"
      >
        <img src={chevronLeftIcon} alt="" />
        자기소개 고치기
      </Link>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-brand">2단계 · 태그 확인</p>
        <h1 className="text-[32px] leading-[1.35] font-bold tracking-[-0.64px]">AI가 이렇게 정리했어요</h1>
        <p className="leading-[1.7] text-gray-600">
          맞지 않는 태그는 빼고, 빠진 태그는 눌러서 더해 주세요. 확정한 태그로 공모전과 팀을 찾아요.
        </p>
      </div>

      <section className="flex flex-col gap-5 rounded-2xl border border-line bg-white p-6 sm:flex-row sm:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <h2 className="text-[13px] font-semibold text-gray-600">내가 쓴 자기소개</h2>
          <p className="leading-[1.7] break-words">
            {suggestion.intro ? `“${suggestion.intro}”` : '아직 자기소개를 쓰지 않았어요.'}
          </p>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
          <h2 className="flex items-center gap-1.5 text-[13px] font-semibold text-brand">
            <img src={sparkleIcon} alt="" />
            AI가 고른 태그
          </h2>
          {suggested.length === 0 ? (
            <p className="text-sm leading-[1.6] text-gray-600">AI가 고른 태그가 없어요. 아래에서 직접 골라 주세요.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {suggested.map((category) => (
                <li
                  key={category.id}
                  className="flex h-7 items-center rounded-full bg-brand-soft px-2.5 text-[13px] font-semibold text-brand"
                >
                  {category.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="flex flex-col rounded-2xl border border-line bg-white px-6 pt-6 pb-2">
        <h2 className="pb-3 text-lg font-bold">태그 고르기</h2>
        {axes.map(({ axis, label, hint }) => (
          <div key={axis} role="group" aria-label={label} className="flex flex-col gap-3 border-t border-gray-100 py-4 sm:flex-row sm:gap-6">
            <div className="flex w-[120px] shrink-0 flex-col gap-0.5">
              <p className="text-[15px] font-semibold">{label}</p>
              <p className="text-xs text-gray-600">{hint}</p>
            </div>
            <div className="flex min-w-0 flex-1 flex-wrap gap-2">
              {categories
                .filter((category) => category.axis === axis)
                .map((category) => {
                  const selected = selectedIds.includes(category.id)
                  return (
                    <button
                      key={category.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggle(category)}
                      className={`flex h-10 items-center rounded-full border px-3.5 text-sm ${
                        selected
                          ? 'gap-1.5 border-brand bg-brand font-semibold text-white'
                          : 'border-gray-300 bg-white font-medium text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {selected && <img src={checkIcon} alt="" />}
                      {category.name}
                    </button>
                  )
                })}
            </div>
          </div>
        ))}
      </section>

      <p className="text-[13px] leading-[1.6] text-gray-600">
        태그는 정해진 목록 안에서만 골라요. 그래야 공모전, 모집 방과 정확히 비교할 수 있어요.
      </p>

      {saveError !== null && (
        <p role="alert" className="text-sm text-red-700">
          {saveError}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
        <p className="flex items-center gap-1.5 text-[15px]">
          선택한 태그
          <span className="font-semibold text-brand">{selectedIds.length}개</span>
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setSelectedIds(suggestion.categoryIds)}
            className="flex h-12 items-center justify-center rounded-xl border border-gray-300 bg-white px-6 text-[15px] font-semibold hover:bg-gray-50"
          >
            AI 제안으로 되돌리기
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={selectedIds.length === 0 || saving}
            className="flex h-12 items-center justify-center rounded-xl bg-brand px-6 text-[15px] font-semibold text-white hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100"
          >
            {saving ? '저장하는 중이에요' : '이대로 확정하기'}
          </button>
        </div>
      </div>
    </div>
  )
}
