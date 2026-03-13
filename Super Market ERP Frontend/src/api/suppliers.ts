import { api } from './client'
import type { Supplier } from '../types'

export interface CreateSupplierPayload {
  SupplierName: string
  ContactPerson: string
  Email: string
  Phone: string
  Address?: string
}

export interface UpdateSupplierPayload {
  SupplierName?: string
  ContactPerson?: string
  Email?: string
  Phone?: string
  Address?: string
}

export async function getSuppliers(): Promise<{ success: boolean; suppliers?: Supplier[] }> {
  const { data } = await api.get<{ success: boolean; suppliers?: Supplier[] }>('/procurement/suppliers-list')
  return data
}

export async function getSupplierById(id: number): Promise<{ success: boolean; supplier: Supplier }> {
  const { data } = await api.get<{ success: boolean; supplier: Supplier }>(`/procurement/supplier-get/${id}`)
  return data
}

export async function createSupplier(payload: CreateSupplierPayload): Promise<{ success: boolean; supplier: Supplier }> {
  const { data } = await api.post<{ success: boolean; supplier: Supplier }>('/procurement/supplier-add', payload)
  return data
}

export async function updateSupplier(
  id: number,
  payload: UpdateSupplierPayload
): Promise<{ success: boolean; supplier: Supplier }> {
  const { data } = await api.put<{ success: boolean; supplier: Supplier }>(
    `/procurement/supplier-update/${id}`,
    payload
  )
  return data
}

export async function deleteSupplier(id: number): Promise<{ success: boolean }> {
  const { data } = await api.delete<{ success: boolean }>(`/procurement/supplier-delete/${id}`)
  return data
}
