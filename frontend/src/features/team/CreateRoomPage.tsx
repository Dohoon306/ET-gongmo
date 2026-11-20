import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { api } from '../../api/client.ts'
import { useCurrentUser } from '../../common/useCurrentUser.ts'
import { idParam, useGet } from './api.ts'
import { Card, ErrorText, MissingId, TeamPage, primaryButton, secondaryButton } from './ui.tsx'

type Category = { id: number; axis: string; name: string }

type ContestOption = { id: number; title: string; type: string | null; endDate: string | null }

const AXIS_LABELS: [string, string][] = [
  ['FIELD', '분야'],
  ['ROLE', '직무'],
  ['SKILL', '기술'],
  ['LEVEL', '수준'],
  ['GOAL', '목표'],
]

const MIN_CAPACITY = 2
const MAX_CAPACITY = 10

function contestLabel(c: ContestOption) {
  return `[${c.type ?? '공고'}] ${c.title} ${c.endDate ? `· ${c.endDate.slice(5).replace('-', '.')} 마감` : '· 상시'}`
}

export default function CreateRoomPage() {
  const params = useParams()
  const [search] = useSearchParams()
  if (params.contestId !== undefined && !idParam(params.contestId)) {
    return <MissingId what="공모전" sample="/teams/new" />
  }
  return <CreateRoomForm initialContestId={idParam(params.contestId ?? search.get('contestId') ?? undefined)} />
}

function CreateRoomForm({ initialContestId }: { initialContestId: number | null }) {
  const navigate = useNavigate()
  const { userId } = useCurrentUser()
  const [contestId, setContestId] = useState(initialContestId)
  const { data: contestOptions } = useGet<ContestOption[]>('/api/rooms/contest-options')
  const { data: categories, error: loadError } = useGet<Category[]>('/api/categories')
  const contest = contestOptions?.find((c) => c.id === contestId)
  const backTo = contestId ? `/contests/${contestId}/rooms` : '/contests'
  const [title, setTitle] = useState('')
  const [intro, setIntro] = useState('')
  const [capacity, setCapacity] = useState(3)
  const [picked, setPicked] = useState<Set<number>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  const toggle = (id: number) =>
    setPicked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const canSubmit = userId !== null && contestId !== null && title.trim() !== '' && picked.size > 0 && !sending

  async function submit(e: FormEvent) {
    e.preventDefault()
    setSending(true)
    setError(null)
    try {
      await api<{ roomId: number }>('/api/rooms', {
        method: 'POST',
        body: { contestId, title: title.trim(), intro: intro.trim(), capacity, categoryIds: [...picked] },
      })
      navigate(`/contests/${contestId}/rooms`)
    } catch (err) {
      setError((err as Error).message)
      setSending(false)
    }
  }

  return (
    <TeamPage>
      <Link to={backTo} className="text-sm text-(--color-muted) hover:text-(--color-ink)">
        ‹ {contestId ? '모집 방 목록' : '추천 공모전'}
      </Link>
      <h1 className="mt-4 text-[28px] font-bold">모집 방 만들기</h1>
      <p className="mt-2 mb-6 text-[15px] text-(--color-muted)">{contest?.title ?? '공모전'}에 함께할 팀원을 모집해요.</p>
      <ErrorText message={loadError ?? error} />
      {userId === null && <ErrorText message="헤더에서 사용자를 먼저 골라 주세요" />}

      <Card className="p-7">
        <form onSubmit={submit} className="space-y-6">
          {initialContestId !== null ? (
            <div>
              <span className="text-sm font-semibold">공모전</span>
              <p className="mt-2 rounded-xl bg-(--color-subtle) px-3 py-3 text-[15px] font-medium">
                {contest ? contestLabel(contest) : contestOptions ? `공모전 ${initialContestId}번 (접수 중인 목록에 없음)` : ' '}
              </p>
            </div>
          ) : (
            <label className="block">
              <span className="text-sm font-semibold">공모전</span>
              <select
                value={contestId ?? ''}
                onChange={(e) => setContestId(e.target.value ? Number(e.target.value) : null)}
                className="mt-2 h-11 w-full rounded-xl border border-(--color-line-strong) px-3 text-[15px]"
              >
                <option value="">공모전을 골라 주세요</option>
                {contestOptions?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {contestLabel(c)}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="block">
            <span className="text-sm font-semibold">방 제목</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              placeholder="예: 초보 환영! 백엔드 같이 배워요"
              className="mt-2 h-11 w-full rounded-xl border border-(--color-line-strong) px-3 text-[15px]"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold">소개</span>
            <textarea
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
              maxLength={1000}
              rows={4}
              placeholder="어떤 팀인지, 어떤 팀원을 찾는지 적어 주세요"
              className="mt-2 w-full rounded-xl border border-(--color-line-strong) px-3 py-2 text-[15px]"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold">정원 (방장 포함)</span>
            <select
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              className="mt-2 h-11 w-32 rounded-xl border border-(--color-line-strong) px-3 text-[15px]"
            >
              {Array.from({ length: MAX_CAPACITY - MIN_CAPACITY + 1 }, (_, i) => MIN_CAPACITY + i).map((n) => (
                <option key={n} value={n}>
                  {n}명
                </option>
              ))}
            </select>
          </label>

          <fieldset>
            <legend className="text-sm font-semibold">원하는 팀원 태그</legend>
            <div className="mt-2 space-y-3">
              {AXIS_LABELS.map(([axis, label]) => (
                <div key={axis} className="flex items-start gap-3">
                  <span className="w-10 shrink-0 pt-1 text-[13px] text-(--color-muted)">{label}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {categories
                      ?.filter((c) => c.axis === axis)
                      .map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          aria-pressed={picked.has(c.id)}
                          onClick={() => toggle(c.id)}
                          className={`h-7 rounded-full px-3 text-[13px] font-medium ${picked.has(c.id) ? 'bg-brand text-white' : 'bg-(--color-subtle) text-(--color-ink-2)'}`}
                        >
                          {picked.has(c.id) && '✓ '}
                          {c.name}
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </fieldset>

          <div className="flex justify-end gap-2">
            <Link to={backTo} className={secondaryButton}>
              취소
            </Link>
            <button type="submit" disabled={!canSubmit} className={primaryButton}>
              {sending ? '만드는 중…' : '방 만들기'}
            </button>
          </div>
        </form>
      </Card>
    </TeamPage>
  )
}
