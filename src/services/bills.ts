import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './api'
import type { Bill, CreateBillInput } from '@/types/api'

const base = (householdId: string) => `/households/${householdId}/bills`

export const billKeys = {
  all: (householdId: string) => ['households', householdId, 'bills'] as const,
  list: (householdId: string) => ['households', householdId, 'bills', 'list'] as const,
}

export function useBills(householdId: string | undefined) {
  return useQuery({
    queryKey: billKeys.list(householdId ?? ''),
    queryFn: async () => (await api.get<Bill[]>(base(householdId!))).data,
    enabled: !!householdId,
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
