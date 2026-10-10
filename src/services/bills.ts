import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './api'
import type { Balances, Bill, CreateBillInput } from '@/types/api'

const base = (householdId: string) => `/households/${householdId}/bills`

export const billKeys = {
  all: (householdId: string) => ['households', householdId, 'bills'] as const,
  list: (householdId: string) => ['households', householdId, 'bills', 'list'] as const,
  balances: (householdId: string) => ['households', householdId, 'bills', 'balances'] as const,
  one: (householdId: string, id: string) => ['households', householdId, 'bills', id] as const,
}

export function useBills(householdId: string | undefined) {
  return useQuery({
    queryKey: billKeys.list(householdId ?? ''),
    queryFn: async () => (await api.get<Bill[]>(base(householdId!))).data,
    enabled: !!householdId,
  })
}

export function useBalances(householdId: string | undefined) {
  return useQuery({
    queryKey: billKeys.balances(householdId ?? ''),
    queryFn: async () => (await api.get<Balances>(`${base(householdId!)}/balances`)).data,
    enabled: !!householdId,
  })
}

/** Full bill, with each share's user */
export function useBill(householdId: string, id: string | undefined) {
  return useQuery({
    queryKey: billKeys.one(householdId, id ?? ''),
    queryFn: async () => (await api.get<Bill>(`${base(householdId)}/${id}`)).data,
    enabled: !!id,
  })
}

const useInvalidateBills = (householdId: string) => {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: billKeys.all(householdId) })
}

export function useCreateBill(householdId: string) {
  const invalidate = useInvalidateBills(householdId)
  return useMutation({
    mutationFn: async (input: CreateBillInput) => (await api.post<Bill>(base(householdId), input)).data,
    onSuccess: invalidate,
  })
}

export function useDeleteBill(householdId: string) {
  const invalidate = useInvalidateBills(householdId)
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`${base(householdId)}/${id}`)
    },
    onSuccess: invalidate,
  })
}

/** Marks one person's share as paid back, or undoes it */
export function useSettleShare(householdId: string) {
  const invalidate = useInvalidateBills(householdId)
  return useMutation({
    mutationFn: async ({ billId, userId, settled }: { billId: string; userId: string; settled: boolean }) => {
      const url = `${base(householdId)}/${billId}/shares/${userId}/settle`
      if (settled) await api.post(url)
      else await api.delete(url)
    },
    onSuccess: invalidate,
  })
}
