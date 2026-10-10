import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './api'
import { useAuthStore } from '@/stores'
import type { ShoppingItem, ShoppingItemInput, ShoppingList } from '@/types/api'

const base = (householdId: string) => `/households/${householdId}/shopping-lists`

export const shoppingKeys = {
  lists: (householdId: string) => ['households', householdId, 'shopping'] as const,
  list: (householdId: string, listId: string) => ['households', householdId, 'shopping', listId] as const,
}

export function useShoppingLists(householdId: string | undefined) {
  return useQuery({
    queryKey: shoppingKeys.lists(householdId ?? ''),
    queryFn: async () => (await api.get<ShoppingList[]>(base(householdId!))).data,
    enabled: !!householdId,
  })
}

export function useShoppingList(householdId: string, listId: string) {
  return useQuery({
    queryKey: shoppingKeys.list(householdId, listId),
    queryFn: async () => (await api.get<ShoppingList>(`${base(householdId)}/${listId}`)).data,
  })
}

export function useCreateList(householdId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (name: string) => (await api.post<ShoppingList>(base(householdId), { name })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: shoppingKeys.lists(householdId) }),
  })
}

export function useUpdateList(householdId: string, listId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (patch: { name?: string; archived?: boolean }) =>
      (await api.patch<ShoppingList>(`${base(householdId)}/${listId}`, patch)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: shoppingKeys.lists(householdId) }),
  })
}

export function useDeleteList(householdId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (listId: string) => {
      await api.delete(`${base(householdId)}/${listId}`)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: shoppingKeys.lists(householdId) }),
  })
}

/** Item mutations update the open list instantly, then refetch it and the list overview. */
export function useItemActions(householdId: string, listId: string) {
  const queryClient = useQueryClient()
  const me = useAuthStore((state) => state.user)
  const key = shoppingKeys.list(householdId, listId)
  const url = `${base(householdId)}/${listId}/items`

  const optimistic = (edit: (items: ShoppingItem[]) => ShoppingItem[]) => async () => {
    await queryClient.cancelQueries({ queryKey: key })
    const previous = queryClient.getQueryData<ShoppingList>(key)
    queryClient.setQueryData<ShoppingList>(key, (list) => list && { ...list, items: edit(list.items ?? []) })
    return { previous }
  }
  const common = {
    onError: (_e: unknown, _v: unknown, context?: { previous?: ShoppingList }) =>
      queryClient.setQueryData(key, context?.previous),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: key }),
        queryClient.invalidateQueries({ queryKey: shoppingKeys.lists(householdId), exact: true }),
      ]),
  }

  const add = useMutation({
    mutationFn: async (input: ShoppingItemInput) => (await api.post<ShoppingItem>(url, input)).data,
    ...common,
  })

  const toggle = useMutation({
    mutationFn: async (item: ShoppingItem) => {
      if (item.checkedAt) await api.delete(`${url}/${item.id}/check`)
      else await api.post(`${url}/${item.id}/check`)
    },
    onMutate: (item: ShoppingItem) =>
      optimistic((items) =>
        items.map((i) =>
          i.id === item.id
            ? { ...i, checkedAt: i.checkedAt ? null : new Date().toISOString(), checkedBy: i.checkedAt ? null : me }
            : i,
        ),
      )(),
    ...common,
  })

  const update = useMutation({
    mutationFn: async ({ id, ...patch }: ShoppingItemInput & { id: string }) =>
      (await api.patch<ShoppingItem>(`${url}/${id}`, patch)).data,
    onMutate: ({ id, ...patch }) => optimistic((items) => items.map((i) => (i.id === id ? { ...i, ...patch } : i)))(),
    ...common,
  })

  const remove = useMutation({
    mutationFn: async (item: ShoppingItem) => {
      await api.delete(`${url}/${item.id}`)
    },
    onMutate: (item: ShoppingItem) => optimistic((items) => items.filter((i) => i.id !== item.id))(),
    ...common,
  })

  const clearChecked = useMutation({
    mutationFn: async () => {
      await api.post(`${base(householdId)}/${listId}/clear-checked`)
    },
    onMutate: optimistic((items) => items.filter((i) => !i.checkedAt)),
    ...common,
  })

  return { add, toggle, update, remove, clearChecked }
}
