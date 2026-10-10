import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold tracking-tight">404</h1>
      <p>This page does not exist.</p>
      <Link className="text-blue-600 underline dark:text-blue-400" to="/">
        Back home
      </Link>
    </section>
  )
}
