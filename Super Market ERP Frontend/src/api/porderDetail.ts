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
): Promise<{ success: boolean }> {
  const { data } = await api.put<{ success: boolean }>(`/porderdetail/podetails-update/${id}`, payload)
  return data
}
