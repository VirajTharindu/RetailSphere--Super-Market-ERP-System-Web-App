import { api } from './client'
import type { AnalyticsOverview, SalesTrendPoint } from '../types'

export interface OverviewResponse {
  success: boolean
  data: AnalyticsOverview
}

export interface SalesTrendResponse {
  success: boolean
  data: SalesTrendPoint[]
}

export interface TopProductsResponse {
  success: boolean
  data: Array<{ ProductID: number; ProductName: string; totalQuantity: number; totalRevenue: number }>
}

export interface LowStockResponse {
  success: boolean
  data: Array<{ ProductID: number; ProductName: string; totalStock: number; ReorderLevel: number }>
}

export interface TopCustomersResponse {
  success: boolean
  data: Array<{ customerId: number; customerName: string | null; amount: number; orders: number }>
}

export async function getOverview(params?: { from?: string; to?: string }): Promise<OverviewResponse> {
  const { data } = await api.get<OverviewResponse>('/analytics/overview', { params })
  return data
}

export async function getSalesTrend(params?: {
  from?: string
  to?: string
  period?: 'day' | 'month'
}): Promise<SalesTrendResponse> {
  const { data } = await api.get<SalesTrendResponse>('/analytics/sales-trend', { params })
  return data
}

export async function getTopProducts(params?: {
  from?: string
  to?: string
  limit?: number
}): Promise<TopProductsResponse> {
  const { data } = await api.get<TopProductsResponse>('/analytics/top-products', { params })
  return data
}

export async function getLowStock(params?: {
  threshold?: number
  limit?: number
}): Promise<LowStockResponse> {
  const { data } = await api.get<LowStockResponse>('/analytics/low-stock', { params })
  return data
}

export async function getTopCustomers(params?: {
  from?: string
  to?: string
  limit?: number
}): Promise<TopCustomersResponse> {
  const { data } = await api.get<TopCustomersResponse>('/analytics/top-customers', { params })
  return data
}

export async function getInventoryValuation(): Promise<{ success: boolean; data: unknown }> {
  const { data } = await api.get<{ success: boolean; data: unknown }>('/analytics/inventory-valuation')
  return data
}

export async function getExpiryForecast(params?: { days?: number }): Promise<{ success: boolean; data: unknown }> {
  const { data } = await api.get<{ success: boolean; data: unknown }>('/analytics/expiry-forecast', { params })
  return data
}
