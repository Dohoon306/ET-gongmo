import { createContext } from 'react'

export type CurrentUserValue = {
  userId: number | null
  setUserId: (userId: number | null) => void
}

export const CurrentUserContext = createContext<CurrentUserValue | null>(null)
