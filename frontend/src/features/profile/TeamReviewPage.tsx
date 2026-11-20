import { CheckIcon, StarIcon } from '../../common/icons.tsx'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import { api, ApiError } from '../../api/client.ts'
import { useCurrentUser } from '../../common/useCurrentUser.ts'

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
    <div className="space-y-4 text-ink">
      <header>
        <h1 className="text-[26px] font-bold leading-[1.3] tracking-[-0.02em]">팀원 평가</h1>
        <p className="mt-1.5 mb-1.5 text-[15px] text-muted">평가는 익명으로 남아요.</p>
      </header>
      {roomId && /^[1-9][0-9]*$/.test(roomId) ? (
        userId === null ? <p>평가하려면 현재 사용자를 선택해 주세요.</p>
          : <ReviewForm key={roomId + ':' + userId} roomId={roomId} userId={userId} />
      ) : <p role="alert" className="text-danger">유효한 팀을 선택해 주세요.</p>}
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

  if (!team) return error ? <p role="alert" className="text-danger">{error}</p>
    : <p role="status">팀원 정보를 불러오는 중이에요.</p>

  return (
    <>
      <div className="flex flex-wrap items-center gap-2.5 rounded-md border border-line bg-page px-4 py-3 text-sm">
        <span className="inline-flex h-6 items-center rounded-sm bg-subtle px-2 text-xs font-semibold text-muted">종료된 팀</span>
        <strong>{team.title}</strong>
        <span className="text-muted">팀원 {team.targets.length + 1}명</span>
      </div>
      <p className="break-keep rounded-md bg-brand-soft px-4 py-3 text-sm text-brand">
        <strong>평가는 익명으로 남아요.</strong> 상대방의 프로필에 평가한 사람이 표시되지 않아요.
      </p>
      {submitted !== null && (
        <div role="status" className="flex flex-wrap justify-between gap-2 rounded-md bg-brand-soft px-4 py-3 text-sm text-brand">
          <strong className="inline-flex items-center gap-2 font-semibold"><CheckIcon className="size-4" />{submitted.edited ? '팀원 평가를 수정했어요.' : '팀원 평가를 남겼어요.'}</strong>
          <Link to={'/users/' + submitted.targetId} state={{ reviewRoomId: Number(roomId) }} className="font-medium underline underline-offset-[3px] hover:text-brand-strong">프로필 보기</Link>
        </div>
      )}
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      {team.targets.length === 0 && <p className="text-muted">평가할 팀원이 없어요.</p>}
      <ul className="space-y-3.5">
        {team.targets.map((item) => {
          const expanded = target?.id === item.id
          return (
            <li key={item.id} className={'space-y-4 rounded-lg border bg-white px-5 py-[18px] ' + (expanded ? 'border-brand' : 'border-line')}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-md bg-brand-soft font-bold text-brand">{item.name.trim().split(/\s+/).at(-1)?.slice(0, 1)}</span>
                  <div className="min-w-0 space-y-1">
                    <Link to={'/users/' + item.id} className="break-words font-semibold hover:text-brand hover:underline">{item.name}</Link>
                    {expanded && item.categories.length > 0 ? (
                      <ul aria-label="카테고리" className="flex flex-wrap gap-1.5">
                        {item.categories.map((category) => <li key={category} className="inline-flex h-[22px] items-center rounded-sm border border-line px-[7px] text-xs font-medium text-ink-2">{category}</li>)}
                      </ul>
                    ) : !expanded && <p className="text-xs text-muted">{item.reviewed ? '평가를 남겼어요.' : '아직 평가하지 않았어요.'}</p>}
                  </div>
                </div>
                {item.reviewed ? (
                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                    <span className="inline-flex h-6 items-center gap-1 rounded-sm bg-brand-soft px-2 text-xs font-semibold text-brand"><CheckIcon className="size-[11px]" />평가 완료</span>
                    <button type="button" disabled={saving || loadingTarget !== null || expanded} aria-expanded={expanded}
                      onClick={() => { void choose(item) }}
                      className="inline-flex h-10 items-center rounded-md border border-line-strong bg-white px-3.5 text-sm font-semibold hover:bg-subtle disabled:opacity-50">
                      {loadingTarget === item.id ? '불러오는 중' : '수정'}
                    </button>
                  </div>
                ) : !expanded && <button type="button" disabled={saving || loadingTarget !== null} onClick={() => { void choose(item) }}
                    className="inline-flex h-11 shrink-0 items-center rounded-md border border-line-strong bg-white px-4 text-sm font-semibold hover:bg-subtle">평가하기</button>}
              </div>
              {expanded && (
                <form className="space-y-4 border-t border-line pt-4" onSubmit={(event) => { void submit(event) }}>
                  <fieldset disabled={saving}>
                    <legend className="mb-2 text-sm font-semibold">별점</legend>
                    <div className="flex flex-wrap items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((value) => {
                        const filled = value <= (score ?? 0)
                        return (
                          <label key={value} className="flex size-11 cursor-pointer items-center justify-center rounded-md">
                            <input className="peer sr-only" type="radio" name="score" value={value} checked={score === value}
                              onChange={() => setScore(value)} aria-label={value + '점'} required />
                            <span aria-hidden="true" className={'block rounded-sm peer-focus-visible:outline-2 peer-focus-visible:outline-brand ' + (filled ? 'text-accent' : 'text-muted')}>
                              <StarIcon className="size-7" filled={filled} />
                            </span>
                          </label>
                        )
                      })}
                      {score !== null && <span className="ml-2 text-sm tabular-nums text-muted">{score} / 5</span>}
                    </div>
                  </fieldset>
                  <label className="block space-y-2 text-sm font-semibold">
                    <span>한 줄 코멘트 <span className="font-normal text-muted">(선택)</span></span>
                    <textarea value={comment} maxLength={200} rows={2} disabled={saving} onChange={(event) => setComment(event.target.value)}
                      className="w-full resize-y rounded-md border border-line-strong px-3.5 py-2.5 text-[15px] leading-relaxed font-normal" />
                  </label>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-muted">남긴 평가는 팀원의 프로필에 익명으로 표시돼요.</p>
                    <div className="ml-auto flex gap-2">
                      {item.reviewed && <button type="button" disabled={saving} onClick={cancelEdit}
                        className="inline-flex h-11 items-center rounded-md border border-line-strong bg-white px-4 text-[15px] font-semibold hover:bg-subtle disabled:opacity-50">취소</button>}
                      <button type="submit" disabled={saving || score === null}
                        className="inline-flex h-11 items-center rounded-md bg-brand px-4 text-[15px] font-semibold text-white hover:bg-brand-strong disabled:opacity-50">
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
