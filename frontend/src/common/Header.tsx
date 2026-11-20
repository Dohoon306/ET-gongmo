import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { api } from '../api/client.ts'
import { useCurrentUser } from './useCurrentUser.ts'
import UserSwitcher from './UserSwitcher.tsx'
import ChatBell from '../features/team/ChatBell.tsx'
import AdminMenuLink from '../features/admin/AdminMenuLink.tsx'
import sproutIcon from './icons/sprout.svg'

type MenuItem = {
  label: string
  to: string | null
  currentOn: RegExp[]
}

const SIGNUP_PATH = /^\/signup(\/|$)/

function menuFor(userId: number | null): MenuItem[] {
  return [
    { label: '추천 공모전', to: '/contests', currentOn: [/^\/contests(\/|$)/, /^\/rooms\/[^/]+\/join$/] },
    { label: '관심 공고', to: '/bookmarks', currentOn: [/^\/bookmarks(\/|$)/] },
    { label: '내 팀', to: '/my/team', currentOn: [/^\/my\/team$/, /^\/rooms\/[^/]+\/members$/] },
    { label: '받은 요청', to: '/my/requests', currentOn: [/^\/my\/requests$/, /^\/rooms\/[^/]+\/requests$/] },
    {
      label: '프로필',
      to: userId !== null ? `/users/${userId}` : null,
      currentOn: [/^\/users\/[^/]+$/, /^\/rooms\/[^/]+\/review$/],
    },
  ]
}

export default function Header() {
  const { userId } = useCurrentUser()
  const { pathname } = useLocation()
  const menuHidden = SIGNUP_PATH.test(pathname)

  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex min-h-[60px] max-w-[1120px] flex-wrap items-center gap-x-7 px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <img src={sproutIcon} alt="" width={24} height={24} />
          <span className="whitespace-nowrap text-[17px] font-bold tracking-[-0.01em] text-ink">E.T 공모전</span>
        </Link>

        {!menuHidden && (
          <nav className="flex flex-wrap items-center gap-1">
            {menuFor(userId).map((item) => (
              <MenuLink key={item.label} item={item} current={item.currentOn.some((path) => path.test(pathname))} />
            ))}
            <AdminMenuLink />
          </nav>
        )}

        <div className="min-w-0 flex-1" />
        {!menuHidden && <ChatBell />}
        <ServerStatus />
        <UserSwitcher />
      </div>
    </header>
  )
}

function MenuLink({ item, current }: { item: MenuItem; current: boolean }) {
  const shape = 'flex h-11 items-center whitespace-nowrap border-b-2 px-3 text-[15px] md:h-[60px]'

  if (item.to === null) {
    return (
      <span aria-disabled="true" title="사용자를 먼저 선택하세요" className={`${shape} border-transparent font-medium text-muted opacity-60`}>
        {item.label}
      </span>
    )
  }

  return (
    <Link
      to={item.to}
      aria-current={current ? 'page' : undefined}
      className={`${shape} ${current ? 'border-brand font-semibold text-ink' : 'border-transparent font-medium text-muted hover:text-ink'}`}
    >
      {item.label}
    </Link>
  )
}

type Health = { status: string; db: string }

function ServerStatus() {
  const [health, setHealth] = useState<Health | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    api<Health>('/api/health')
      .then(setHealth)
      .catch(() => setFailed(true))
  }, [])

  const label = failed ? '서버 연결 안 됨' : !health ? '확인 중' : health.db === 'UP' ? '서버·DB 연결됨' : 'DB 연결 안 됨'
  const ok = health?.db === 'UP'

  return (
    <span className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs ${ok ? 'text-muted' : 'text-danger'}`}>
      <span className={`size-[7px] rounded-full ${ok ? 'bg-brand' : 'bg-danger'}`} />
      {label}
    </span>
  )
}
