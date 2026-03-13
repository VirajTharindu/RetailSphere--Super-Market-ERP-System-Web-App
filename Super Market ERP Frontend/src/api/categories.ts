import { api } from './client'
import type { Category } from '../types'

export interface CreateCategoryPayload {
  CategoryName: string
  Description?: string
}

export interface UpdateCategoryPayload {
  CategoryName?: string
  Description?: string
}

export async function getCategories(): Promise<{ success: boolean; categories?: Category[] }> {
  const { data } = await api.get<{ success: boolean; categories?: Category[] }>('/inventory/categories-get-list')
  return data
}

export async function getCategoryById(id: number): Promise<{ success: boolean; category: Category }> {
  const { data } = await api.get<{ success: boolean; category: Category }>(`/inventory/categories-get/${id}`)
  return data
}

export async function createCategory(payload: CreateCategoryPayload): Promise<{ success: boolean; category: Category }> {
  const { data } = await api.post<{ success: boolean; category: Category }>('/inventory/categories-add', payload)
  return data
}

export async function updateCategory(
  id: number,
  payload: UpdateCategoryPayload
): Promise<{ success: boolean; category: Category }> {
  const { data } = await api.put<{ success: boolean; category: Category }>(
    `/inventory/categories-update/${id}`,
    payload
  )
  return data
}

export async function deleteCategory(id: number): Promise<{ success: boolean }> {
  const { data } = await api.delete<{ success: boolean }>(`/inventory/categories-delete/${id}`)
  return data
}
