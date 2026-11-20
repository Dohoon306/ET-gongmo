import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { useCurrentUser } from './useCurrentUser.ts'
import checkIcon from './icons/check.svg'
import chevronDownIcon from './icons/chevron-down.svg'
import plusIcon from './icons/plus.svg'

function avatarInitial(name: string) {
  const lastWord = name.trim().split(/\s+/).at(-1) ?? ''
  return lastWord.charAt(0)
}

function Avatar({ name }: { name: string }) {
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand">
      {avatarInitial(name)}
    </span>
  )
}

export default function UserSwitcher() {
  const { userId, currentUser, users, usersLoadFailed, setUserId, reloadUsers } = useCurrentUser()
  const [open, setOpen] = useState(false)
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
    setOpen(!open)
  }

  const switchTo = (nextUserId: number) => {
    setUserId(nextUserId)
    setOpen(false)
  }

  const buttonLabel = currentUser?.name ?? (userId !== null ? `사용자 ${userId}` : '사용자 선택')

  return (
    <div ref={containerRef} className="relative flex shrink-0 items-center gap-2.5">
      <span className="whitespace-nowrap text-xs text-gray-500">데모 사용자</span>
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`flex items-center gap-2 rounded-full border border-gray-300 bg-white py-1.5 pr-3 hover:bg-gray-50 ${currentUser ? 'pl-1.5' : 'pl-3'}`}
      >
        {currentUser && <Avatar name={currentUser.name} />}
        <span className={`whitespace-nowrap text-sm font-semibold text-gray-900 ${currentUser ? '' : 'leading-8'}`}>
          {buttonLabel}
        </span>
        <img src={chevronDownIcon} alt="" width={16} height={16} className="shrink-0" />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="데모 사용자 전환"
          className="absolute right-0 top-full z-20 mt-1 flex w-[300px] flex-col gap-0.5 rounded-[14px] border border-line bg-white p-2 shadow-[0_12px_32px_rgba(23,33,28,0.14)]"
        >
          <p className="px-2.5 py-2 text-[13px] font-semibold text-gray-500">데모 사용자 전환</p>

          <div className="flex max-h-[calc(100vh-200px)] flex-col gap-0.5 overflow-y-auto">
            {usersLoadFailed && (
              <p role="alert" className="px-2.5 py-2 text-sm text-red-600">사용자 목록을 불러오지 못했어요</p>
            )}
            {!usersLoadFailed && users.length === 0 && (
              <p className="px-2.5 py-2 text-sm text-gray-500">아직 사용자가 없어요</p>
            )}
            {users.map((user) => {
              const selected = user.id === userId
              return (
                <button
                  key={user.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={selected}
                  onClick={() => switchTo(user.id)}
                  className={`flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left ${selected ? 'bg-brand-soft' : 'hover:bg-gray-100'}`}
                >
                  <Avatar name={user.name} />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900">{user.name}</span>
                  {selected && <img src={checkIcon} alt="" width={16} height={16} className="shrink-0" />}
                </button>
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
