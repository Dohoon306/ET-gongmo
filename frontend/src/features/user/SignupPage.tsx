import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { api, ApiError } from '../../api/client.ts'
import { useCurrentUser } from '../../common/useCurrentUser.ts'
import sparkleIcon from './icons/sparkle.svg'

type CreatedUser = { id: number; name: string }

const NAME_MAX_LENGTH = 30
const INTRO_MAX_LENGTH = 500

const steps = ['자기소개 쓰기', 'AI가 붙인 태그 확인하기', '나에게 맞는 공모전과 팀 찾기']

export default function SignupPage() {
  const { setUserId } = useCurrentUser()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [intro, setIntro] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const trimmedName = name.trim()
  const trimmedIntro = intro.trim()
  const canSubmit = trimmedName !== '' && trimmedIntro !== '' && !submitting

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      const created = await api<CreatedUser>('/api/users', {
        method: 'POST',
        body: { name: trimmedName, intro: trimmedIntro },
      })
      setUserId(created.id)
      navigate('/signup/tags')
    } catch (failure) {
      setError(failure instanceof ApiError ? failure.message : '가입하지 못했어요. 잠시 뒤에 다시 시도해 주세요.')
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-12 pt-8 pb-12 lg:flex-row lg:items-start">
      <section className="flex min-w-0 flex-1 flex-col gap-5 pt-2">
        <p className="text-sm font-semibold text-brand">처음 오셨나요?</p>
        <h1 className="text-[40px] leading-[1.3] font-bold tracking-[-0.8px]">
          공모전이 처음이어도
          <br />
          괜찮아요
        </h1>
        <p className="leading-[1.7] text-gray-600">
          관심 분야와 경험을 편하게 적어 주세요. AI가 내용을 태그로 정리해서, 나와 맞는 공모전과 팀을 먼저 보여 드려요.
        </p>
        <ol className="flex flex-col gap-3.5 pt-4">
          {steps.map((step, index) => (
            <li key={step} className="flex items-center gap-3" aria-current={index === 0 ? 'step' : undefined}>
              <span
                className={`grid size-7 shrink-0 place-items-center rounded-full text-[13px] font-semibold ${
                  index === 0 ? 'bg-brand text-white' : 'border border-gray-300 bg-white text-gray-600'
                }`}
              >
                {index + 1}
              </span>
              <span className={`text-[15px] ${index === 0 ? 'font-semibold' : 'text-gray-600'}`}>{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <form
        onSubmit={handleSubmit}
        className="flex w-full shrink-0 flex-col gap-6 rounded-[20px] border border-line bg-white p-8 lg:w-[560px]"
      >
        <h2 className="text-xl font-bold">나를 소개해 주세요</h2>

        <div className="flex flex-col gap-2">
          <label htmlFor="signup-name" className="text-sm font-semibold">
            이름
          </label>
          <input
            id="signup-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={NAME_MAX_LENGTH}
            autoComplete="off"
            aria-describedby="signup-name-help"
            className="h-12 rounded-[10px] border border-gray-300 bg-white px-3.5 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
          <p id="signup-name-help" className="text-[13px] leading-[1.6] text-gray-600">
            데모에서는 로그인 없이 이름만 입력해요.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="signup-intro" className="text-sm font-semibold">
            관심 분야와 경험
          </label>
          <textarea
            id="signup-intro"
            value={intro}
            onChange={(event) => setIntro(event.target.value)}
            maxLength={INTRO_MAX_LENGTH}
            aria-describedby="signup-intro-help"
            className="min-h-[132px] resize-y rounded-[10px] border border-gray-300 bg-white p-3.5 leading-[1.7] outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
          <div className="flex items-start gap-3 text-[13px] leading-[1.6] text-gray-600">
            <p id="signup-intro-help" className="min-w-0 flex-1">
              써 본 언어, 해 보고 싶은 역할, 공모전 경험을 적으면 좋아요.
            </p>
            <p className="shrink-0 whitespace-nowrap">
              {intro.length} / {INTRO_MAX_LENGTH}
            </p>
          </div>
        </div>

        {error !== null && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="flex h-[52px] items-center justify-center gap-2 rounded-xl bg-brand px-5 text-[15px] font-semibold text-white hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100"
        >
          <img src={sparkleIcon} alt="" />
          {submitting ? '만드는 중이에요' : 'AI로 태그 만들기'}
        </button>
        <p className="text-center text-[13px] leading-[1.6] text-gray-600">입력한 내용은 태그를 만드는 데만 써요.</p>
      </form>
    </div>
  )
}
