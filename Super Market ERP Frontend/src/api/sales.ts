import { api } from './client'
import type { Sale, CreateSalePayload } from '../types'

export interface SalesListResponse {
  success: boolean
  data?: Sale[]
  message?: string
}

export async function createSale(payload: CreateSalePayload): Promise<{
  success: boolean
  saleId: number
  invoiceNumber: string
  totalAmount: number
  message?: string
}> {
  const { data } = await api.post('/sales/sales-transactions', payload)
  return data
}

export async function getSales(): Promise<SalesListResponse> {
  const { data } = await api.get<SalesListResponse>('/sales/sales-transactions-get-list')
  return data
}

export async function getSaleById(id: number): Promise<{ success: boolean; sale: Sale }> {
  const { data } = await api.get<{ success: boolean; sale: Sale }>(`/sales/sales-transactions-get/${id}`)
  return data
}

export async function updateSale(
  id: number,
  payload: Partial<{ customerId: number; totalAmount: number; paymentMethod: string; status: string }>
): Promise<{ success: boolean }> {
  const { data } = await api.put<{ success: boolean }>(`/sales/sales-transactions-update/${id}`, payload)
  return data
}

export async function deleteSale(id: number): Promise<{ success: boolean }> {
  const { data } = await api.delete<{ success: boolean }>(`/sales/sales-transactions-delete/${id}`)
  return data
}
