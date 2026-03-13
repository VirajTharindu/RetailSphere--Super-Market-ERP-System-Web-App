import { api } from './client'
import type { Product } from '../types'

export interface CreateProductPayload {
  ProductName: string
  CategoryID: number
  ReorderLevel?: number
  UnitPrice: number
}

export interface UpdateProductPayload {
  ProductName?: string
  CategoryID?: number
  ReorderLevel?: number
  UnitPrice?: number
}

export async function getProducts(): Promise<{ success: boolean; products: Product[] }> {
  const { data } = await api.get<{ success: boolean; products: Product[] }>('/products/product-list')
  return data
}

export async function getProductById(id: number): Promise<{ success: boolean; product: Product }> {
  const { data } = await api.get<{ success: boolean; product: Product }>(`/products/product-get/${id}`)
  return data
}

export async function createProduct(payload: CreateProductPayload): Promise<{ success: boolean; product: Product }> {
  const { data } = await api.post<{ success: boolean; product: Product }>('/products/product-add', payload)
  return data
}

export async function updateProduct(
  id: number,
  payload: UpdateProductPayload
): Promise<{ success: boolean; product: Product }> {
  const { data } = await api.put<{ success: boolean; product: Product }>(`/products/product-update/${id}`, payload)
  return data
}

export async function deleteProduct(id: number): Promise<{ success: boolean }> {
  const { data } = await api.delete<{ success: boolean }>(`/products/product-delete/${id}`)
  return data
}
