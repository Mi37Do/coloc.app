import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <section className="panel panel--butter flex flex-1 flex-col items-center justify-center gap-3 text-center">
      <span className="text-6xl" aria-hidden>
        🧦
      </span>
      <h1 className="font-display text-[32px]">Lost sock</h1>
      <p className="muted font-medium">This page doesn't exist.</p>
      <Link className="pill mt-2" to="/">
        Back home
      </Link>
    </section>
  )
}
