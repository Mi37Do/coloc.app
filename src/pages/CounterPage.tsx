import { CounterCard } from '@/features/counter'

export function CounterPage() {
  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold tracking-tight">Counter</h1>
      <p>
        State lives in a setup store (<code>stores/counter.store.ts</code>) built from signals,
        so it reads like a Pinia store written with ref() and computed().
      </p>
      <CounterCard />
    </section>
  )
}
