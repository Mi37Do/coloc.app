// defineStore() with Pinia's setup-store syntax.
//
//   export const useCounterStore = defineStore('counter', () => {
//     const count = signal(0)                        // ref()
//     const double = computed(() => count.value * 2) // computed()
//     function increment() { count.value++ }         // action
//     return { count, double, increment }
//   })
//
// The setup function runs once, on first use, and every caller gets the same store.
// Use it in a component: const counter = useCounterStore(); counter.count.value
export function defineStore<Id extends string, Store extends object>(id: Id, setup: () => Store) {
  let store: (Store & { $id: Id }) | undefined

  return function useStore() {
    return (store ??= { ...setup(), $id: id })
  }
}
