import { useEffect, useState, type ChangeEvent } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router'
import { api } from '../../api/client.ts'
import { CheckIcon, ChevronRightIcon, StarIcon } from '../../common/icons.tsx'
import { useCurrentUser } from '../../common/useCurrentUser.ts'
import { SendMessageButton } from '../team/ChatBell.tsx'
import MyEvaluationAppeals from '../admin/MyEvaluationAppeals.tsx'

const MAX_PROFILE_IMAGE_BYTES = 2 * 1024 * 1024

type Profile = {
  image?: string | null
  name: string
  categories: string[]
  teams: { id: number; title: string; status: string; memberCount: number }[]
  rating: { avgScore: number | null; evalCount: number }
  comments: { score: number; comment: string }[]
}

export default function ProfilePage() {
  const { userId } = useParams()
  const { userId: currentUserId } = useCurrentUser()
  if (userId === ':userId') {
    return <Navigate replace to="/users/me" />
  }
  if (userId === 'me' && currentUserId === null) {
    return <p>내 프로필을 보려면 현재 사용자를 선택해 주세요.</p>
  }

  const profileUserId = userId === 'me' ? String(currentUserId) : userId
  return profileUserId && /^[1-9][0-9]*$/.test(profileUserId)
    ? <ProfileDetails key={profileUserId} userId={profileUserId} own={String(currentUserId) === profileUserId} />
    : <p role="alert" className="text-danger">유효한 사용자를 선택해 주세요.</p>
}

function ProfileDetails({ userId, own }: { userId: string; own: boolean }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [imageSaving, setImageSaving] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)
  const { state } = useLocation()
  const reviewRoomId = state?.reviewRoomId

  useEffect(() => {
    const request = new AbortController()
    api<Profile>('/api/users/' + userId + '/profile', { signal: request.signal })
      .then(setProfile)
      .catch((failure: Error) => { if (!request.signal.aborted) setError(failure.message) })
    return () => request.abort()
  }, [userId])

  async function changeProfileImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    if (!file || !own || imageSaving) return
    setImageError(null)
    if (file.size > MAX_PROFILE_IMAGE_BYTES) {
      setImageError('2MB 이하의 이미지를 선택해 주세요.')
      return
    }
    if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
      setImageError('JPG 또는 PNG 이미지를 선택해 주세요.')
      return
    }
    setImageSaving(true)
    try {
      const image = await readImageBase64(file)
      const saved = await api<{ image: string }>('/api/users/' + userId + '/profile-image', {
        method: 'PUT',
        body: { image },
      })
      setProfile((current) => current && { ...current, image: saved.image })
    } catch (failure) {
      setImageError(failure instanceof Error ? failure.message : '프로필 이미지를 저장하지 못했어요.')
    } finally {
      setImageSaving(false)
    }
  }

  if (error) return <p role="alert" className="text-danger">{error}</p>
  if (profile === null) return <p role="status">프로필을 불러오는 중이에요.</p>

  const { avgScore, evalCount } = profile.rating
  const initial = profile.name.trim().split(/\s+/).at(-1)?.slice(0, 1)
  return (
    <div className="space-y-5 text-ink">
      {Number.isSafeInteger(reviewRoomId) && reviewRoomId > 0 && (
        <div role="status" className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-brand-soft px-4 py-3 text-sm text-brand">
          <span className="inline-flex items-center gap-2 font-semibold"><CheckIcon className="size-4" />평가가 익명으로 반영됐어요.</span>
          <Link to={'/rooms/' + reviewRoomId + '/review'} className="font-medium underline underline-offset-[3px] hover:text-brand-strong">평가 화면으로</Link>
        </div>
      )}
      <div className="grid items-start gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <section className="min-w-0 space-y-4 rounded-lg border border-line bg-white p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              {profile.image ? (
                <img src={'data:image/png;base64,' + profile.image} alt={profile.name + ' 프로필 이미지'}
                  width={52} height={52} className="size-[52px] shrink-0 rounded-md object-cover" />
              ) : (
                <span aria-hidden="true" className="grid size-[52px] place-items-center rounded-md bg-brand-soft text-xl font-bold text-brand">{initial}</span>
              )}
              {own && (
                <label className="inline-flex min-h-9 cursor-pointer items-center rounded-md border border-line-strong px-3 text-sm font-semibold text-brand hover:bg-brand-soft focus-within:outline-2 focus-within:outline-brand has-disabled:cursor-wait has-disabled:opacity-60">
                  <input type="file" className="sr-only" accept="image/jpeg,image/png" disabled={imageSaving} onChange={changeProfileImage} />
                  {imageSaving ? '이미지 저장 중…' : profile.image ? '이미지 변경' : '이미지 추가'}
                </label>
              )}
            </div>
            {!own && <SendMessageButton userId={Number(userId)} />}
          </div>
          {imageError && <p role="alert" className="text-sm text-danger">{imageError}</p>}
          <div>
            <h1 className="break-words text-2xl font-bold leading-[1.3] tracking-[-0.02em]">{profile.name}</h1>
            <p className="mt-1 text-sm text-muted">함께한 팀 {profile.teams.length}개</p>
          </div>
          {profile.categories.length > 0 && (
            <ul aria-label="카테고리" className="flex flex-wrap gap-1.5">
              {profile.categories.map((name) => <li key={name} className="inline-flex h-[26px] items-center rounded-sm border border-line px-2 text-[13px] font-medium text-ink-2">{name}</li>)}
            </ul>
          )}
          <div className="space-y-2 border-t border-line pt-4">
            <h2 className="text-sm font-bold">함께한 팀</h2>
            {profile.teams.length === 0 ? <p className="text-sm text-muted">아직 함께한 팀이 없어요.</p>
              : <ul className="space-y-3">
                {profile.teams.map((team) => (
                  <li key={team.id} className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="break-words text-sm font-semibold">{team.title}</p>
                      <p className="text-xs text-muted">{team.status === 'CLOSED' ? '종료 · ' : ''}팀원 {team.memberCount}명</p>
                    </div>
                    {own && team.status === 'CLOSED' &&
                      <Link to={'/rooms/' + team.id + '/review'} className="inline-flex min-h-7 items-center gap-0.5 text-[13px] font-semibold text-brand hover:text-brand-strong">팀원 평가<ChevronRightIcon className="size-[13px]" /></Link>}
                  </li>
                ))}
              </ul>}
          </div>
        </section>
        <section className="min-w-0 space-y-4 rounded-lg border border-line bg-white p-6">
          <h2 className="text-lg font-bold tracking-[-0.01em]">받은 평가</h2>
          <div className="flex flex-wrap items-center gap-[18px] rounded-md bg-page px-[18px] py-4">
            {avgScore === null ? <p className="text-sm text-muted">아직 받은 평가가 없어요.</p> : (
              <>
                <p><strong className="text-4xl font-bold leading-[1.1] tracking-[-0.02em] tabular-nums">{avgScore.toFixed(1)}</strong><span className="ml-1 text-sm text-muted">/ 5</span></p>
                <div>
                  <span aria-hidden="true" className="relative inline-flex text-line-strong">
                    <StarRow />
                    <span className="absolute inset-y-0 left-0 flex overflow-hidden text-accent" style={{ width: avgScore / 5 * 100 + '%' }}><StarRow /></span>
                  </span>
                  <p className="mt-1 text-xs tabular-nums text-muted">평가 {evalCount}개</p>
                </div>
              </>
            )}
          </div>
          <p className="text-xs text-muted">평가는 익명이에요. 누가, 어느 팀에서, 언제 남겼는지는 보이지 않아요.</p>
          {profile.comments.length > 0 && (
            <ul className="divide-y divide-line border-t border-line">
              {profile.comments.map(({ score, comment }, index) => (
                <li key={index} className="space-y-2 py-4">
                  <div className="flex justify-between gap-2 text-xs font-semibold">
                    <span>익명의 팀원</span>
                    <span aria-label={score + '점'} className="inline-flex items-center gap-1 tabular-nums text-accent"><StarIcon className="size-[13px]" />{score}</span>
                  </div>
                  <p className="break-words break-keep text-sm text-ink-2">{comment}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      {own && <MyEvaluationAppeals />}
    </div>
  )
}

function readImageBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const data = reader.result
      if (typeof data === 'string') resolve(data.slice(data.indexOf(',') + 1))
      else reject(new Error('이미지를 읽지 못했어요.'))
    }
    reader.onerror = () => reject(new Error('이미지를 읽지 못했어요.'))
    reader.readAsDataURL(file)
  })
}

function StarRow() {
  return <span className="flex gap-0.5">{[1, 2, 3, 4, 5].map((value) => <StarIcon key={value} className="size-5" />)}</span>
}
