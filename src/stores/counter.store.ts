import { computed, signal } from '@/lib/signals'
import { defineStore } from '@/lib/define-store'

// Pinia setup store: state is ref(), getters are computed(), actions are functions.
export const useCounterStore = defineStore('counter', () => {
  const count = signal(0)
  const double = computed(() => count.value * 2)

  function increment() {
    count.value++
  }
  function decrement() {
    count.value--
  }
  function reset() {
    count.value = 0
  }

  return { count, double, increment, decrement, reset }
})
