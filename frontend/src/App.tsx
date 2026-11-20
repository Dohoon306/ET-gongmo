import { Route, Routes } from 'react-router'
import Layout from './common/Layout.tsx'
import HomePage from './common/HomePage.tsx'
import { userRoutes } from './features/user/routes.tsx'
import { contestRoutes } from './features/contest/routes.tsx'
import { teamRoutes } from './features/team/routes.tsx'
import { bookmarkRoutes } from './features/bookmark/routes.tsx'
import { profileRoutes } from './features/profile/routes.tsx'

const featureRoutes = [...userRoutes, ...contestRoutes, ...teamRoutes, ...bookmarkRoutes, ...profileRoutes]

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        {featureRoutes.map((r) => (
          <Route key={r.path} path={r.path} element={r.element} />
        ))}
      </Route>
    </Routes>
  )
}
