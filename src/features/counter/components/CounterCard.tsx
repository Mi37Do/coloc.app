import { Minus, Plus, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useCounterStore } from '@/stores'

export function CounterCard() {
  // Like <script setup>: const counter = useCounterStore()
  const counter = useCounterStore()

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-5xl font-bold" data-testid="count">
        {counter.count.value}
      </p>
      <p>Double: {counter.double.value}</p>
      <div className="flex gap-2">
        <Button aria-label="Decrement" variant="secondary" onClick={counter.decrement}>
          <Minus size={16} />
        </Button>
        <Button aria-label="Increment" onClick={counter.increment}>
          <Plus size={16} />
        </Button>
        <Button aria-label="Reset" variant="secondary" onClick={counter.reset}>
          <RotateCcw size={16} />
        </Button>
      </div>
    </div>
  )
}
