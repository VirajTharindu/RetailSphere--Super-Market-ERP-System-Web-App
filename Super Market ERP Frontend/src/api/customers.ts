import { api } from './client'
import type { Customer } from '../types'

export interface CreateCustomerPayload {
  fName: string
  lName: string
  phone: string
}

export interface UpdateCustomerPayload {
  fName?: string
  lName?: string
  phone?: string
}

export async function getCustomers(): Promise<{ success: boolean; customers?: Customer[] }> {
  const { data } = await api.get<{ success: boolean; customers?: Customer[] }>('/crm/customers-get-list')
  return data
}

export async function getCustomerById(id: number): Promise<{ success: boolean; customer: Customer }> {
  const { data } = await api.get<{ success: boolean; customer: Customer }>(`/crm/customers-get/${id}`)
  return data
}

export async function createCustomer(payload: CreateCustomerPayload): Promise<{ success: boolean; customer: Customer }> {
  const { data } = await api.post<{ success: boolean; customer: Customer }>('/crm/customers-add', payload)
  return data
}

export async function updateCustomer(
  id: number,
  payload: UpdateCustomerPayload
): Promise<{ success: boolean; customer: Customer }> {
  const { data } = await api.put<{ success: boolean; customer: Customer }>(
    `/crm/customers-update/${id}`,
    payload
  )
  return data
}

export async function deleteCustomer(id: number): Promise<{ success: boolean }> {
  const { data } = await api.delete<{ success: boolean }>(`/crm/customers-delete/${id}`)
  return data
}
