import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { api } from '../api/client.ts'
import { CurrentUserContext, type DemoUser } from './currentUserContext.ts'
import { getCurrentUserId, setCurrentUserId } from './currentUserStorage.ts'

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const [userId, setUserIdState] = useState<number | null>(getCurrentUserId)
  const [users, setUsers] = useState<DemoUser[]>([])
  const [usersLoadFailed, setUsersLoadFailed] = useState(false)
  const latestLoad = useRef(0)

  const applyLoadedUsers = useCallback((load: number, loaded: DemoUser[]) => {
    if (load !== latestLoad.current) return

    setUsers(loaded)
    setUsersLoadFailed(false)
    const selectedUserId = getCurrentUserId()
    if (selectedUserId !== null && !loaded.some((user) => user.id === selectedUserId)) {
      setCurrentUserId(null)
      setUserIdState(null)
    }
  }, [])

  const reloadUsers = useCallback(() => {
    const load = ++latestLoad.current
    return api<DemoUser[]>('/api/users').then(
      (loaded) => applyLoadedUsers(load, loaded),
      () => {
        if (load === latestLoad.current) setUsersLoadFailed(true)
      },
    )
  }, [applyLoadedUsers])

  useEffect(() => {
    void reloadUsers()
  }, [reloadUsers])

  const setUserId = useCallback(
    (next: number | null) => {
      setCurrentUserId(next)
      setUserIdState(next)
      if (next !== null && !users.some((user) => user.id === next)) void reloadUsers()
    },
    [users, reloadUsers],
  )

  const currentUser = users.find((user) => user.id === userId) ?? null

  return (
    <CurrentUserContext.Provider value={{ userId, currentUser, users, usersLoadFailed, setUserId, reloadUsers }}>
      {children}
    </CurrentUserContext.Provider>
  )
}
