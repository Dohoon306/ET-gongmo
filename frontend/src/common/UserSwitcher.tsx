import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { api, ApiError } from '../api/client.ts'
import type { DemoUser } from './currentUserContext.ts'
import ProfileAvatar from './ProfileAvatar.tsx'
import { forgetSignedUpUser, getSignedUpUserIds } from './signedUpUserStorage.ts'
import { useCurrentUser } from './useCurrentUser.ts'
import checkIcon from './icons/check.svg'
import chevronDownIcon from './icons/chevron-down.svg'
import plusIcon from './icons/plus.svg'

const DEMO_CAST_NAMES = new Set(['관리자', '방장 김'])

export default function UserSwitcher() {
  const { userId, currentUser, users, usersLoadFailed, setUserId, reloadUsers } = useCurrentUser()
  const [open, setOpen] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', closeOnOutsidePointer)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  const toggle = () => {
    if (!open) void reloadUsers()
    setDeleteError(null)
    setOpen(!open)
  }

  const switchTo = (nextUserId: number) => {
    setUserId(nextUserId)
    setOpen(false)
  }

  const signedUpUserIds = getSignedUpUserIds()
  const switchableUsers = users.filter(
    (user) => user.id === userId || DEMO_CAST_NAMES.has(user.name) || signedUpUserIds.includes(user.id),
  )

  const deleteUser = async (user: DemoUser) => {
    if (!window.confirm(`${user.name} 계정을 지울까요? 팀 소속, 참가 요청, 채팅, 평가도 함께 지워지고 되돌릴 수 없어요.`)) return
    setDeleteError(null)
    try {
      await api(`/api/users/${user.id}`, { method: 'DELETE' })
      forgetSignedUpUser(user.id)
      if (user.id === userId) setUserId(null)
      await reloadUsers()
    } catch (failure) {
      setDeleteError(failure instanceof ApiError ? failure.message : '사용자를 지우지 못했어요')
    }
  }

  const buttonLabel = currentUser?.name ?? (userId !== null ? `사용자 ${userId}` : '사용자 선택')

  return (
    <div ref={containerRef} className="relative flex shrink-0 items-center gap-2.5">
      <span className="whitespace-nowrap text-xs text-muted">데모 사용자</span>
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`flex h-10 items-center gap-2 rounded-md border border-line-strong bg-white pr-2.5 hover:bg-page ${currentUser ? 'pl-1.5' : 'pl-3'}`}
      >
        {currentUser && <ProfileAvatar userId={currentUser.id} name={currentUser.name} className="size-7 rounded-sm text-[13px]" />}
        <span className={`whitespace-nowrap text-sm font-semibold text-ink ${currentUser ? '' : 'leading-8'}`}>
          {buttonLabel}
        </span>
        <img src={chevronDownIcon} alt="" width={16} height={16} className="shrink-0" />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="데모 사용자 전환"
          className="absolute right-0 top-full z-20 mt-1 flex w-[300px] flex-col gap-0.5 rounded-lg border border-line bg-white p-2 shadow-[0_12px_32px_rgba(23,33,28,0.14)]"
        >
          <p className="px-2.5 py-2 text-[13px] font-semibold text-muted">데모 사용자 전환</p>

          <div className="flex max-h-[calc(100vh-200px)] flex-col gap-0.5 overflow-y-auto">
            {usersLoadFailed && (
              <p role="alert" className="px-2.5 py-2 text-sm text-danger">사용자 목록을 불러오지 못했어요</p>
            )}
            {deleteError && (
              <p role="alert" className="px-2.5 py-2 text-sm text-danger">{deleteError}</p>
            )}
            {!usersLoadFailed && switchableUsers.length === 0 && (
              <p className="px-2.5 py-2 text-sm text-muted">아직 사용자가 없어요</p>
            )}
            {switchableUsers.map((user) => {
              const selected = user.id === userId
              const deletable = signedUpUserIds.includes(user.id) && !DEMO_CAST_NAMES.has(user.name)
              return (
                <div
                  key={user.id}
                  className={`flex items-center rounded-md ${selected ? 'bg-brand-soft' : 'hover:bg-subtle'}`}
                >
                  <button
                    type="button"
                    role="menuitemradio"
                    aria-checked={selected}
                    onClick={() => switchTo(user.id)}
                    className="flex min-w-0 flex-1 items-center gap-2.5 rounded-md px-2.5 py-2 text-left"
                  >
                    <ProfileAvatar userId={user.id} name={user.name} className="size-7 rounded-sm text-[13px]" />
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{user.name}</span>
                    {selected && <img src={checkIcon} alt="" width={16} height={16} className="shrink-0" />}
                  </button>
                  {deletable && (
                    <button
                      type="button"
                      role="menuitem"
                      aria-label={`${user.name} 삭제`}
                      onClick={() => void deleteUser(user)}
                      className="mr-1 shrink-0 rounded-md px-2 py-1.5 text-[13px] font-semibold text-danger hover:bg-white"
                    >
                      삭제
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          <Link
            to="/signup"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 border-t border-line px-2.5 pb-2 pt-3 text-sm font-semibold text-brand hover:underline"
          >
            <img src={plusIcon} alt="" width={16} height={16} className="shrink-0" />
            새 사용자로 가입하기
          </Link>
        </div>
      )}
    </div>
  )
}
