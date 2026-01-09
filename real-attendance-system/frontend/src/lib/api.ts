import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'

// Get API base URL from environment variable
// Default to production URL if not set (fallback for production builds)
// Empty string for development (uses Vite proxy)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.PROD ? 'https://raeservice.mju.ac.th/attendance/api' : '/api')

// Create axios instance with cache-busting headers
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
  },
})

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/attendance/login'
    }
    return Promise.reject(error)
  }
)

// API methods
export const api = {
  // Generic methods
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    apiClient.get<T>(url, config).then((res) => res.data),

  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.post<T>(url, data, config).then((res) => res.data),

  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.put<T>(url, data, config).then((res) => res.data),

  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.patch<T>(url, data, config).then((res) => res.data),

  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    apiClient.delete<T>(url, config).then((res) => res.data),

  // Specific endpoints
  employees: {
    getAll: () => api.get<Employee[]>('/employees'),
    getById: (id: number) => api.get<Employee>(`/employees/${id}`),
  },

  attendance: {
    getAll: (params?: AttendanceParams) => 
      api.get<AttendanceRecord[]>('/attendance', { params }),
    getByDate: (date: string) => 
      api.get<AttendanceRecord[]>('/attendance/daily/' + date),
    getStats: () => api.get<AttendanceStats>('/attendance/stats'),
  },

  leaves: {
    getAll: (params?: LeaveParams) => api.get<LeaveRecord[]>('/leaves', { params }),
    getStats: () => api.get<LeaveStats>('/leaves/stats'),
  },

  health: {
    check: () => api.get<{ status: string }>('/health'),
  },

  meta: {
    getDataFreshness: () => api.get<DataFreshness>('/meta/data-freshness'),
    getServerTime: () => api.get<ServerTime>('/meta/server-time'),
  },
}

// Types
export interface Employee {
  id: number
  employee_id: string
  name: string
  department: string
  position: string
  email?: string
  status: 'active' | 'inactive'
}

export interface AttendanceRecord {
  id: number
  employee_id: string
  employee_name: string
  department: string
  check_in: string
  check_out?: string
  date: string
  status: 'present' | 'late' | 'absent' | 'leave'
}

export interface AttendanceParams {
  date?: string
  start_date?: string
  end_date?: string
  department?: string
  employee_id?: string
}

export interface AttendanceStats {
  total_employees: number
  present_today: number
  late_today: number
  absent_today: number
  on_leave_today: number
}

export interface LeaveRecord {
  id: number
  employee_id: string
  employee_name: string
  leave_type: string
  start_date: string
  end_date: string
  status: 'pending' | 'approved' | 'rejected'
  reason?: string
}

export interface LeaveParams {
  employee_id?: string
  status?: string
  start_date?: string
  end_date?: string
}

export interface LeaveStats {
  pending: number
  approved: number
  rejected: number
  total_days_used: number
}

export interface DataFreshness {
  timestamp: string
  server_time: string
  latest_data_update?: string
  latest_data_update_bangkok?: string
  data_sources: {
    daily_attendance?: {
      latest_date?: string
      latest_created?: string
      latest_updated?: string
      total_records: number
      status: string
    }
    staging_facescan?: {
      latest_scan?: string
      latest_created?: string
      total_records: number
      processed_count: number
      status: string
    }
    staging_leave?: {
      latest_created?: string
      total_records: number
      status: string
    }
    employees?: {
      latest_created?: string
      latest_updated?: string
      total_employees: number
      status: string
    }
  }
  last_sync?: {
    action?: string
    time?: string
    status: string
  }
}

export interface ServerTime {
  utc: string
  bangkok: string
  unix: number
}

export default api
