import { Outlet } from 'react-router'
import Header from './Header.tsx'
import { useCurrentUser } from './useCurrentUser.ts'

export default function Layout() {
  const { userId } = useCurrentUser()

  return (
    <div className="min-h-screen">
      <Header />
      <main key={userId ?? 'no-user'} className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
