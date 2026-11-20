import { useContext } from 'react'
import { CurrentUserContext } from './currentUserContext.ts'

export function useCurrentUser() {
  const value = useContext(CurrentUserContext)
  if (!value) throw new Error('CurrentUserProvider 안에서만 쓸 수 있습니다')
  return value
}
