import { useState, useSyncExternalStore } from 'react'
import { getProfileAvatarVersion, subscribeProfileAvatars } from './profileAvatarVersion.ts'

type Props = {
  userId?: number
  name: string
  className: string
  initial?: string
}

export default function ProfileAvatar({ userId, name, className, initial }: Props) {
  const version = useSyncExternalStore(subscribeProfileAvatars, () => getProfileAvatarVersion(userId))
  const src = userId === undefined ? null : `/api/users/${userId}/profile-image${version ? `?v=${version}` : ''}`
  const fallback = initial || Array.from(name.trim().split(/\s+/).at(-1) ?? '')[0] || '?'

  return (
    <span aria-hidden="true" className={`relative inline-grid shrink-0 place-items-center overflow-hidden bg-brand-soft font-bold text-brand ${className}`}>
      {fallback}
      {src && <AvatarImage key={src} src={src} />}
    </span>
  )
}

function AvatarImage({ src }: { src: string }) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'failed'>('loading')
  if (status === 'failed') return null

  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      className={`absolute inset-0 size-full bg-brand-soft object-cover ${status === 'loaded' ? '' : 'opacity-0'}`}
      onLoad={() => setStatus('loaded')}
      onError={() => setStatus('failed')}
    />
  )
}
