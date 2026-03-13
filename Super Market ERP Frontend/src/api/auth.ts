import { api } from './client'
import type { User } from '../types'

export interface LoginPayload {
  username: string
  password: string
}

export interface LoginResponse {
  success: boolean
  token?: string
  user?: { id: number; username: string; role: string }
  message?: string
}

export interface RegisterPayload {
  username: string
  password: string
  fullName?: string
  userRole?: 'Admin' | 'Manager' | 'Staff'
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login', payload)
  return data
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout')
}

export async function getProfile(): Promise<{ success: boolean; user: User }> {
  const { data } = await api.get<{ success: boolean; user: User }>('/auth/profile')
  return data
}

export async function register(payload: RegisterPayload): Promise<{ success: boolean; user: User; message?: string }> {
  const { data } = await api.post('/auth/register', payload)
  return data
}

export async function listUsers(): Promise<{ success: boolean; users: User[] }> {
  const { data } = await api.get<{ success: boolean; users: User[] }>('/auth/users-list')
  return data
}

export async function deleteUser(id: number): Promise<{ success: boolean }> {
  const { data } = await api.delete<{ success: boolean }>(`/auth/user-delete/${id}`)
  return data
}

export interface UpdateProfilePayload {
  username?: string
  fullName?: string
  password?: string
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<{ success: boolean; message: string }> {
  const { data } = await api.put<{ success: boolean; message: string }>('/auth/profile-update', payload)
  return data
}
