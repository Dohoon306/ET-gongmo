import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import { api, ApiError } from '../../api/client.ts'
import { useCurrentUser } from '../../common/useCurrentUser.ts'
import './team-review.css'

type ReviewTarget = { id: number; name: string; reviewed: boolean; categories: string[] }
type ReviewRoom = { title: string; targets: ReviewTarget[] }
type ReviewContent = { score: number; comment: string | null }

export default function TeamReviewPage() {
  const { roomId } = useParams()
  const { userId } = useCurrentUser()
  if (import.meta.env.DEV && roomId === ':roomId') {
    return <Navigate replace to="/rooms/5/review" />
  }
  return (
    <div className="team-review-page mx-auto max-w-[1056px] space-y-5 text-[#18211B]">
      <header>
        <h1 className="text-2xl font-bold">팀원 평가</h1>
        <p className="mt-2 text-sm text-gray-600">평가는 익명으로 남아요.</p>
      </header>
      {roomId && /^[1-9][0-9]*$/.test(roomId) ? (
        userId === null ? <p>평가하려면 현재 사용자를 선택해 주세요.</p>
          : <ReviewForm key={roomId + ':' + userId} roomId={roomId} userId={userId} />
      ) : <p role="alert" className="text-red-700">유효한 팀을 선택해 주세요.</p>}
    </div>
  )
}

function ReviewForm({ roomId, userId }: { roomId: string; userId: number }) {
  const [team, setTeam] = useState<ReviewRoom | null>(null)
  const [target, selectTarget] = useState<ReviewTarget | null>(null)
  const [score, setScore] = useState<number | null>(null)
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [loadingTarget, setLoadingTarget] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState<{ targetId: number; edited: boolean } | null>(null)
  const path = '/api/rooms/' + roomId + '/reviews'

  useEffect(() => {
    const request = new AbortController()
    api<ReviewRoom>(path, { signal: request.signal, headers: { 'X-User-Id': String(userId) } })
      .then(setTeam)
      .catch((failure: Error) => { if (!request.signal.aborted) setError(failure.message) })
    return () => request.abort()
  }, [path, userId])

  async function choose(next: ReviewTarget) {
    selectTarget(null)
    setError(null)
    setSubmitted(null)
    if (!next.reviewed) {
      setScore(null)
      setComment('')
      selectTarget(next)
      return
    }

    setLoadingTarget(next.id)
    try {
      const review = await api<ReviewContent>(path + '/' + next.id, {
        headers: { 'X-User-Id': String(userId) },
      })
      setScore(review.score)
      setComment(review.comment ?? '')
      selectTarget(next)
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : '기존 평가를 불러오지 못했어요.')
    } finally {
      setLoadingTarget(null)
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving || target === null || score === null) return
    setSaving(true)
    setError(null)
    try {
      const content = { score, comment: comment.trim() || null }
      await api(target.reviewed ? path + '/' + target.id : path, {
        method: target.reviewed ? 'PATCH' : 'POST',
        headers: { 'X-User-Id': String(userId) },
        body: target.reviewed ? content : { targetId: target.id, ...content },
      })
      setTeam((current) => current && {
        ...current,
        targets: current.targets.map((item) => item.id === target.id ? { ...item, reviewed: true } : item),
      })
      selectTarget(null)
      setSubmitted({ targetId: target.id, edited: target.reviewed })
    } catch (failure) {
      if (!target.reviewed && failure instanceof ApiError && failure.status === 409 && failure.message === '이미 평가했어요.') {
        setTeam((current) => current && {
          ...current,
          targets: current.targets.map((item) => item.id === target.id ? { ...item, reviewed: true } : item),
        })
        selectTarget(null)
      }
      setError(failure instanceof Error ? failure.message : '평가를 저장하지 못했어요.')
    } finally {
      setSaving(false)
    }
  }

  function cancelEdit() {
    selectTarget(null)
    setError(null)
  }

  if (!team) return error ? <p role="alert" className="text-red-700">{error}</p>
    : <p role="status">팀원 정보를 불러오는 중이에요.</p>

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#DCE2DA] bg-white px-4 py-3 text-sm">
        <span className="rounded-md bg-[#EEF1EC] px-2 py-1 font-semibold">종료된 팀</span>
        <strong>{team.title}</strong>
        <span className="text-[#56635B]">팀원 {team.targets.length + 1}명</span>
      </div>
      <p className="rounded-xl bg-[#E5F0E8] px-4 py-3 text-sm text-[#1D6A43]">
        <strong>평가는 익명으로 남아요.</strong> 상대방의 프로필에 평가한 사람이 표시되지 않아요.
      </p>
      {submitted !== null && (
        <div role="status" className="flex flex-wrap justify-between gap-2 rounded-xl bg-[#E5F0E8] px-4 py-3 text-sm text-[#1D6A43]">
          <strong>{submitted.edited ? '✓ 팀원 평가를 수정했어요.' : '✓ 팀원 평가를 남겼어요.'}</strong>
          <Link to={'/users/' + submitted.targetId} state={{ reviewRoomId: Number(roomId) }} className="hover:underline">프로필 보기 ›</Link>
        </div>
      )}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {team.targets.length === 0 && <p className="text-[#56635B]">평가할 팀원이 없어요.</p>}
      <ul className="space-y-4">
        {team.targets.map((item) => {
          const expanded = target?.id === item.id
          return (
            <li key={item.id} className={'space-y-4 rounded-2xl border bg-white px-5 py-4 ' + (expanded ? 'border-[#1D6A43]' : 'border-[#DCE2DA]')}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-[#E5F0E8] font-bold text-[#1D6A43]">{item.name.trim().split(/\s+/).at(-1)?.slice(0, 1)}</span>
                  <div className="min-w-0 space-y-1">
                    <Link to={'/users/' + item.id} className="break-words font-semibold hover:text-[#1D6A43] hover:underline">{item.name}</Link>
                    {expanded && item.categories.length > 0 ? (
                      <ul aria-label="카테고리" className="flex flex-wrap gap-1.5">
                        {item.categories.map((category) => <li key={category} className="rounded-full bg-[#EEF1EC] px-2 py-0.5 text-xs text-[#3B4840]">{category}</li>)}
                      </ul>
                    ) : !expanded && <p className="text-xs text-[#56635B]">{item.reviewed ? '평가를 남겼어요.' : '아직 평가하지 않았어요.'}</p>}
                  </div>
                </div>
                {item.reviewed ? (
                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                    <span className="rounded-full bg-[#E5F0E8] px-3 py-1 text-xs font-semibold text-[#1D6A43]">✓ 평가 완료</span>
                    <button type="button" disabled={saving || loadingTarget !== null || expanded} aria-expanded={expanded}
                      onClick={() => { void choose(item) }}
                      className="rounded-lg border border-[#C9D1C6] px-3 py-1.5 text-sm font-semibold hover:bg-[#E5F0E8] disabled:opacity-50">
                      {loadingTarget === item.id ? '불러오는 중' : '수정'}
                    </button>
                  </div>
                ) : !expanded && <button type="button" disabled={saving || loadingTarget !== null} onClick={() => { void choose(item) }}
                    className="shrink-0 rounded-lg border border-[#C9D1C6] px-3.5 py-2 text-sm font-semibold hover:bg-[#E5F0E8]">평가하기</button>}
              </div>
              {expanded && (
                <form className="space-y-4" onSubmit={(event) => { void submit(event) }}>
                  <fieldset disabled={saving}>
                    <legend className="mb-2 text-sm font-semibold">별점</legend>
                    <div className="flex flex-wrap items-center gap-1">
                      {[1, 2, 3, 4, 5].map((value) => {
                        const filled = value <= (score ?? 0)
                        return (
                          <label key={value} className="cursor-pointer rounded-md px-1">
                            <input className="peer sr-only" type="radio" name="score" value={value} checked={score === value}
                              onChange={() => setScore(value)} aria-label={value + '점'} required />
                            <span aria-hidden="true" className={'block rounded-sm text-2xl peer-focus-visible:outline-2 peer-focus-visible:outline-[#1D6A43] ' + (filled ? 'text-[#9A4508]' : 'text-[#56635B]')}>
                              {filled ? '★' : '☆'}
                            </span>
                          </label>
                        )
                      })}
                      {score !== null && <span className="ml-2 text-sm text-[#56635B]">{score} / 5</span>}
                    </div>
                  </fieldset>
                  <label className="block space-y-2 text-sm font-semibold">
                    <span>한 줄 코멘트 <span className="font-normal text-[#56635B]">(선택)</span></span>
                    <textarea value={comment} maxLength={200} rows={2} disabled={saving} onChange={(event) => setComment(event.target.value)}
                      className="w-full resize-y rounded-lg border border-[#C9D1C6] px-3 py-2 font-normal" />
                  </label>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-[#56635B]">남긴 평가는 팀원의 프로필에 익명으로 표시돼요.</p>
                    <div className="ml-auto flex gap-2">
                      {item.reviewed && <button type="button" disabled={saving} onClick={cancelEdit}
                        className="rounded-lg border border-[#C9D1C6] px-4 py-2.5 text-sm font-semibold hover:bg-[#E5F0E8] disabled:opacity-50">취소</button>}
                      <button type="submit" disabled={saving || score === null}
                        className="rounded-lg bg-[#1D6A43] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#175536] disabled:opacity-50">
                        {saving ? '저장 중' : item.reviewed ? '저장' : '평가 남기기'}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </li>
          )
        })}
      </ul>
    </>
  )
}
