import { useEffect, useState } from 'react'
import { onlineManager } from '@tanstack/react-query'
import { watchNetwork } from './native'

/** Connectivity, from the native Network plugin in the app. Also keeps React Query's online state in sync, so it refetches on reconnect. */
export function useOnline() {
  const [online, setOnline] = useState(true)
  useEffect(
    () =>
      watchNetwork((isOnline) => {
        setOnline(isOnline)
        onlineManager.setOnline(isOnline)
      }),
    [],
  )
  return online
}
