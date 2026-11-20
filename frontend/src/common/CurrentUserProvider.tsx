import { useState, type ReactNode } from 'react'
import { CurrentUserContext } from './currentUserContext.ts'
import { getStoredUserId, storeUserId } from './currentUserStorage.ts'

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const [userId, setUserIdState] = useState<number | null>(getStoredUserId)

  const setUserId = (next: number | null) => {
    storeUserId(next)
    setUserIdState(next)
  }

  return (
    <CurrentUserContext.Provider value={{ userId, setUserId }}>
      {children}
    </CurrentUserContext.Provider>
  )
}
