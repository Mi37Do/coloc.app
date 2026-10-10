import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './api'
import { useAuthStore } from '@/stores'
import type { Chore, CreateChoreInput, Household, Member } from '@/types/api'

export const queryKeys = {
  households: ['households'] as const,
  members: (householdId: string) => ['households', householdId, 'members'] as const,
  chores: (householdId: string) => ['households', householdId, 'chores'] as const,
}

export function useHouseholds() {
  return useQuery({
    queryKey: queryKeys.households,
    queryFn: async () => (await api.get<Household[]>('/households')).data,
  })
}

/**
 * The household the tabs show: the stored choice, or the first one the user
 * belongs to when that choice is unset or no longer valid.
 */
export function useActiveHousehold() {
  const query = useHouseholds()
  const householdId = useAuthStore((state) => state.householdId)
  const setHousehold = useAuthStore((state) => state.setHousehold)
  const households = query.data
  const active = households?.find((h) => h.id === householdId) ?? households?.[0]

  useEffect(() => {
    if (households && active?.id !== householdId) setHousehold(active?.id ?? null)
  }, [households, active, householdId, setHousehold])

  return { ...query, active }
}

export function useCreateHousehold() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { name: string }) => (await api.post<Household>('/households', input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.households }),
  })
}

export function useLeaveHousehold(householdId: string) {
  const queryClient = useQueryClient()
  const setHousehold = useAuthStore((state) => state.setHousehold)
  return useMutation({
    mutationFn: async () => {
      await api.post(`/households/${householdId}/leave`)
    },
    onSuccess: () => {
      setHousehold(null)
      queryClient.removeQueries({ queryKey: ['households', householdId] })
      return queryClient.invalidateQueries({ queryKey: queryKeys.households })
    },
  })
}

export function useMembers(householdId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.members(householdId ?? ''),
    queryFn: async () => (await api.get<Member[]>(`/households/${householdId}/members`)).data,
    enabled: !!householdId,
  })
}

export function useChores(householdId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.chores(householdId ?? ''),
    queryFn: async () => (await api.get<Chore[]>(`/households/${householdId}/chores`)).data,
    enabled: !!householdId,
  })
}

export function useCreateChore(householdId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateChoreInput) =>
      (await api.post<Chore>(`/households/${householdId}/chores`, input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.chores(householdId) }),
  })
}

/** Completes or reopens a chore, updating the list optimistically so the tick feels instant. */
export function useToggleChore(householdId: string) {
  const queryClient = useQueryClient()
  const key = queryKeys.chores(householdId)
  const userId = useAuthStore((state) => state.user?.id ?? null)

  return useMutation({
    mutationFn: async (chore: Chore) => {
      const action = chore.status === 'done' ? 'reopen' : 'complete'
      await api.post(`/households/${householdId}/chores/${chore.id}/${action}`)
    },
    onMutate: async (chore) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<Chore[]>(key)
      const done = chore.status !== 'done'
      queryClient.setQueryData<Chore[]>(key, (list) =>
        list?.map((c) =>
          c.id === chore.id
            ? {
                ...c,
                status: done ? 'done' : 'todo',
                completedAt: done ? new Date().toISOString() : null,
                completedById: done ? userId : null,
              }
            : c,
        ),
      )
      return { previous }
    },
    onError: (_error, _chore, context) => queryClient.setQueryData(key, context?.previous),
    // Completing a recurring chore creates the next occurrence on the server, so refetch.
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  })
}

export function useDeleteChore(householdId: string) {
  const queryClient = useQueryClient()
  const key = queryKeys.chores(householdId)
  return useMutation({
    mutationFn: async (chore: Chore) => {
      await api.delete(`/households/${householdId}/chores/${chore.id}`)
    },
    onMutate: async (chore) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<Chore[]>(key)
      queryClient.setQueryData<Chore[]>(key, (list) => list?.filter((c) => c.id !== chore.id))
      return { previous }
    },
    onError: (_error, _chore, context) => queryClient.setQueryData(key, context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  })
}
