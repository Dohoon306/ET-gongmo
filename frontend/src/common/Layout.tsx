import { useEffect, useState } from 'react'
import { Link, Outlet } from 'react-router'
import { api } from '../api/client.ts'
import { useCurrentUser } from './useCurrentUser.ts'

type Health = { status: string; db: string }

export default function Layout() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}

function Header() {
  const { userId } = useCurrentUser()

  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="text-lg font-bold text-brand">
          E.T 공모전
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <ServerStatus />
          <span className="text-gray-500">현재 사용자: {userId ?? '없음'}</span>
        </div>
      </div>
    </header>
  )
}

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
    <span className={`flex items-center gap-1.5 ${ok ? 'text-green-700' : 'text-red-600'}`}>
      <span className={`h-2 w-2 rounded-full ${ok ? 'bg-green-500' : 'bg-red-500'}`} />
      {label}
    </span>
  )
}
