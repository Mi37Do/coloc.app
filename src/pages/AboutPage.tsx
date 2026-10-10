import { useQuery } from '@tanstack/react-query'

type AppInfo = { name: string; stack: string[] }

// Fake request so the example works without a backend. With a real API:
//   queryFn: () => api.get<AppInfo>('/info').then((response) => response.data)
const fetchAppInfo = () =>
  new Promise<AppInfo>((resolve) =>
    setTimeout(
      () =>
        resolve({
          name: 'coloc.app',
          stack: ['React', 'TypeScript', 'Vite', 'React Router', 'Zustand', 'Preact Signals', 'TanStack Query', 'Tailwind CSS', 'Headless UI'],
        }),
      600,
    ),
  )

export function AboutPage() {
  const { data, isPending, isError } = useQuery({ queryKey: ['app-info'], queryFn: fetchAppInfo })

  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold tracking-tight">About</h1>
      {isPending && <p>Loading...</p>}
      {isError && <p>Something went wrong.</p>}
      {data && (
        <>
          <p>
            <strong>{data.name}</strong> is built with:
          </p>
          <ul className="list-disc pl-6">
            {data.stack.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
