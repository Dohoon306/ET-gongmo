import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { api } from '../api/client.ts'
import { CurrentUserContext, type DemoUser } from './currentUserContext.ts'
import { getStoredUserId, storeUserId } from './currentUserStorage.ts'

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const [userId, setUserIdState] = useState<number | null>(getStoredUserId)
  const [users, setUsers] = useState<DemoUser[]>([])
  const latestLoad = useRef(0)

  const applyLoadedUsers = useCallback((load: number, loaded: DemoUser[]) => {
    if (load !== latestLoad.current) return

    setUsers(loaded)
    const storedUserId = getStoredUserId()
    if (storedUserId !== null && !loaded.some((user) => user.id === storedUserId)) {
      storeUserId(null)
      setUserIdState(null)
    }
  }, [])

  const reloadUsers = useCallback(() => {
    const load = ++latestLoad.current
    return api<DemoUser[]>('/api/users').then(
      (loaded) => applyLoadedUsers(load, loaded),
      () => undefined,
    )
  }, [applyLoadedUsers])

  useEffect(() => {
    void reloadUsers()
  }, [reloadUsers])

  const setUserId = useCallback(
    (next: number | null) => {
      storeUserId(next)
      setUserIdState(next)
      if (next !== null && !users.some((user) => user.id === next)) void reloadUsers()
    },
    [users, reloadUsers],
  )

  const currentUser = users.find((user) => user.id === userId) ?? null

  return (
    <CurrentUserContext.Provider value={{ userId, currentUser, users, setUserId, reloadUsers }}>
      {children}
    </CurrentUserContext.Provider>
  )
}
