import { api } from './client'
import type { StockBatch } from '../types'

export interface CreateStockBatchPayload {
  POrderDetailID: number
}

export interface UpdateStockBatchPayload {
  ProductID?: number
  SupplierID?: number
  CostPrice?: number
  ExpiryDate?: string | null
}

export async function getStockBatches(): Promise<{ success: boolean; batches?: StockBatch[] }> {
  const { data } = await api.get<{ success: boolean; batches?: StockBatch[] }>('/stockbatch/stockbatch-list')
  return data
}

export async function getStockBatchById(id: number): Promise<{ success: boolean; stockBatch: StockBatch }> {
  const { data } = await api.get<{ success: boolean; stockBatch: StockBatch }>(`/stockbatch/stockbatch-get/${id}`)
  return data
}

export async function createStockBatch(
  payload: CreateStockBatchPayload
): Promise<{ success: boolean; stockBatch: StockBatch }> {
  const { data } = await api.post<{ success: boolean; stockBatch: StockBatch }>(
    '/stockbatch/stockbatch-add',
    payload
  )
  return data
}

export async function updateStockBatch(
  id: number,
  payload: UpdateStockBatchPayload
): Promise<{ success: boolean; stockBatch: StockBatch }> {
  const { data } = await api.put<{ success: boolean; stockBatch: StockBatch }>(
    `/stockbatch/stockbatch-update/${id}`,
    payload
  )
  return data
}

export async function deleteStockBatch(id: number): Promise<{ success: boolean }> {
  const { data } = await api.delete<{ success: boolean }>(`/stockbatch/stockbatch-delete/${id}`)
  return data
}

export async function reduceStock(id: number, quantity: number): Promise<{ success: boolean }> {
  const { data } = await api.put<{ success: boolean }>(`/stockbatch/stockbatch-reduce/${id}`, { quantity })
  return data
}

export async function getSellableBatches(productId: number): Promise<{ success: boolean; batches?: StockBatch[] }> {
  const { data } = await api.get<{ success: boolean; batches?: StockBatch[] }>(
    `/stockbatch/stockbatch-sellable/${productId}`
  )
  return data
}

export async function getExpiringBatches(): Promise<{ success: boolean; batches?: StockBatch[] }> {
  const { data } = await api.get<{ success: boolean; batches?: StockBatch[] }>('/stockbatch/stockbatch-expiring')
  return data
}

export async function getTotalStock(productId: number): Promise<{ success: boolean; totalStock: number }> {
  const { data } = await api.get<{ success: boolean; totalStock: number }>(`/stockbatch/stockbatch-total/${productId}`)
  return data
}

export async function checkReorder(productId: number): Promise<{ success: boolean; message: string; actionTaken: string }> {
  const { data } = await api.get<{ success: boolean; message: string; actionTaken: string }>(`/stockbatch/stockbatch-check-reorder/${productId}`)
  return data
}

export async function issueStockByProduct(
  productId: number,
  quantity: number
): Promise<{ success: boolean; message: string; quantityIssued: number; remainedQuantity: number; batches: StockBatch[] }> {
  const { data } = await api.put<{ success: boolean; message: string; quantityIssued: number; remainedQuantity: number; batches: StockBatch[] }>(
    `/stockbatch/stockbatches-issue/${productId}`,
    { quantity }
  )
  return data
}
