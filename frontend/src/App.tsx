import { Navigate, Route, Routes } from 'react-router'
import Layout from './common/Layout.tsx'
import HomePage from './common/HomePage.tsx'
import { useCurrentUser } from './common/useCurrentUser.ts'
import { userRoutes } from './features/user/routes.tsx'
import { contestRoutes } from './features/contest/routes.tsx'
import { teamRoutes } from './features/team/routes.tsx'
import { bookmarkRoutes } from './features/bookmark/routes.tsx'
import { profileRoutes } from './features/profile/routes.tsx'

const featureRoutes = [...userRoutes, ...contestRoutes, ...teamRoutes, ...bookmarkRoutes, ...profileRoutes]

function StartPage() {
  const { userId } = useCurrentUser()
  return <Navigate to={userId === null ? '/signup' : '/contests'} replace />
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<StartPage />} />
        <Route path="/dev" element={<HomePage />} />
        {featureRoutes.map((r) => (
          <Route key={r.path} path={r.path} element={r.element} />
        ))}
      </Route>
    </Routes>
  )
}
