import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { api, ApiError } from '../../api/client.ts'
import { useCurrentUser } from '../../common/useCurrentUser.ts'
import sparkleIcon from './icons/sparkle-brand.svg'

type Axis = 'FIELD' | 'ROLE' | 'SKILL' | 'LEVEL' | 'GOAL'
type Category = { id: number; axis: Axis; code: string; name: string; sortOrder: number }
type Suggestion = { name: string; intro: string | null; categoryIds: number[] }
type Loaded = { categories: Category[]; suggestion: Suggestion }

export default function SignupTagsPage() {
  const { userId } = useCurrentUser()
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (userId === null) return
    let ignored = false
    Promise.all([api<Category[]>('/api/categories'), api<Suggestion>('/api/users/me/category-suggestion')]).then(
      ([categories, suggestion]) => {
        if (ignored) return
        setLoaded({ categories, suggestion })
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

  return (
    <div className="flex flex-col gap-7 pb-12">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-brand">2단계 · 태그 확인</p>
        <h1 className="text-[32px] leading-[1.35] font-bold tracking-[-0.64px]">AI가 이렇게 정리했어요</h1>
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
            <p className="text-sm leading-[1.6] text-gray-600">AI가 고른 태그가 없어요.</p>
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
    </div>
  )
}
