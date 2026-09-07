import { api } from './client'
import type { POrderDetail, PODetailStatus } from '../types'

export interface UpdatePODetailPayload {
  Status?: PODetailStatus
  QuantityReceived?: number
  CostPriceofPOD?: number
  ExpiryDate?: string | null
}

export interface ListPODetailsParams {
  Status?: PODetailStatus
  ProductID?: string
  PO_ID?: string
}

/** Returns array of { PO_ID, PODetails } */
export async function getPODetails(
  params?: ListPODetailsParams
): Promise<Array<{ PO_ID: number; PODetails: POrderDetail[] }>> {
  const { data } = await api.get<Array<{ PO_ID: number; PODetails: POrderDetail[] }>>(
    '/porderdetail/podetails-get-list',
    { params }
  )
  return Array.isArray(data) ? data : []
}

export async function getPODetailById(id: number): Promise<{ success: boolean; podetail: POrderDetail }> {
  const { data } = await api.get<{ success: boolean; podetail: POrderDetail }>(`/porderdetail/podetails-get/${id}`)
  return data
}

export async function updatePODetail(
  id: number,
  payload: UpdatePODetailPayload
): Promise<{ success: boolean; podetail?: POrderDetail }> {
  const { data } = await api.put<{ success: boolean; podetail?: POrderDetail }>(`/porderdetail/podetails-update/${id}`, payload)
  return data
}

export async function acceptPODetail(
  id: number,
  payload?: { QuantityReceived?: number; CostPriceofPOD?: number; ExpiryDate?: string | null }
): Promise<{ success: boolean; message: string; podetail?: POrderDetail }> {
  const { data } = await api.put<{ success: boolean; message: string; podetail?: POrderDetail }>(
    `/porderdetail/podetails-accept/${id}`,
    payload || {}
  )
  return data
}

export async function refusePODetail(
  id: number
): Promise<{ success: boolean; message: string; podetail?: POrderDetail }> {
  const { data } = await api.put<{ success: boolean; message: string; podetail?: POrderDetail }>(
    `/porderdetail/podetails-refuse/${id}`
  )
  return data
}

export async function acceptPurchaseOrder(
  poId: number
): Promise<{ success: boolean; message: string }> {
  const { data } = await api.put<{ success: boolean; message: string }>(
    `/procurement/purchaseorder-accept/${poId}`
  )
  return data
}

export async function refusePurchaseOrder(
  poId: number
): Promise<{ success: boolean; message: string }> {
  const { data } = await api.put<{ success: boolean; message: string }>(
    `/procurement/purchaseorder-refuse/${poId}`
  )
  return data
}

