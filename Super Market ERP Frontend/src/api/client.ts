import axios, { type AxiosInstance } from 'axios'

let rawApiUrl = import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'development' ? '/api' : 'https://retailsphere-super-market-erp-system-web.onrender.com/api')
if (rawApiUrl.endsWith('/')) rawApiUrl = rawApiUrl.slice(0, -1)
const API_BASE = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('erp_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('erp_token')
      localStorage.removeItem('erp_user')
      window.location.replace('/login')
    }
    return Promise.reject(err)
  }
)
