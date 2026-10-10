import { isRouteErrorResponse, Link, useRouteError } from 'react-router'

// Shown instead of React Router's developer screen when a page throws.
export function RouteErrorPage() {
  const error = useRouteError()
  const notFound = isRouteErrorResponse(error) && error.status === 404
  if (import.meta.env.DEV) console.error(error)

  return (
    <div className="canvas">
      <section className="panel panel--blush flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <span className="text-6xl" aria-hidden>
          {notFound ? '🧦' : '🫧'}
        </span>
        <h1 className="font-display text-[32px] leading-tight">{notFound ? 'Lost sock' : 'Something slipped'}</h1>
        <p className="muted max-w-72 font-medium">
          {notFound ? "This page doesn't exist." : 'This screen hit an error. Reloading usually fixes it.'}
        </p>
        {import.meta.env.DEV && error instanceof Error && (
          <pre className="max-w-full overflow-x-auto rounded-2xl bg-paper/70 p-3 text-left text-xs">{error.message}</pre>
        )}
        <div className="mt-2 flex gap-2">
          <button className="pill" onClick={() => location.reload()}>
            Reload
          </button>
          <Link className="pill pill--light" to="/">
            Home
          </Link>
        </div>
      </section>
    </div>
  )
}
