import { Link } from 'react-router'
import { useAuthStore } from '@/stores'

export function HomePage() {
  const user = useAuthStore((state) => state.user)

  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold tracking-tight">Home</h1>
      <p>
        A React app laid out like a Vue 3 project: a routes array, guards, Pinia-style stores and
        reactive signals.
      </p>
      {user ? (
        <p>
          Signed in as <strong>{user.name}</strong>. Visit your <Link className="text-blue-600 underline dark:text-blue-400" to="/profile">profile</Link>,
          a route guarded by <code>requireAuth</code>.
        </p>
      ) : (
        <p>
          Try opening <Link className="text-blue-600 underline dark:text-blue-400" to="/profile">/profile</Link> while signed out: the guard sends you to
          the login page and brings you back afterwards.
        </p>
      )}
    </section>
  )
}
