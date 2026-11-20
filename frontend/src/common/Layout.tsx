import { Outlet } from 'react-router'
import Header from './Header.tsx'
import { useCurrentUser } from './useCurrentUser.ts'

export default function Layout() {
  const { userId } = useCurrentUser()

  return (
    <div className="min-h-screen">
      <Header />
      <main key={userId ?? 'no-user'} className="mx-auto max-w-[1120px] px-6 py-9">
        <Outlet />
      </main>
    </div>
  )
}
