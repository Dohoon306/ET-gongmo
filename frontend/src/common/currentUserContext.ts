import { createContext } from 'react'

export type DemoUser = {
  id: number
  name: string
}

export type CurrentUserValue = {
  userId: number | null
  currentUser: DemoUser | null
  users: DemoUser[]
  usersLoadFailed: boolean
  setUserId: (userId: number | null) => void
  reloadUsers: () => Promise<void>
}

export const CurrentUserContext = createContext<CurrentUserValue | null>(null)
