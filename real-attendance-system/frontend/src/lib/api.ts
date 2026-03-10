import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'

// Get API base URL from environment variable
// Default to production URL if not set (fallback for production builds)
// Empty string for development (uses Vite proxy)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.PROD ? 'https://raeservice.mju.ac.th/attendance/api' : '/api')

// Create axios instance with cache-busting headers
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
  },
})

// Request interceptor - use accessToken (canonical key)
apiClient.interceptors.request.use(
  (config) => {
    // Use accessToken (canonical key) instead of token
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // Always include credentials
    config.withCredentials = true
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - handle 401 with SPA navigation
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const token = localStorage.getItem('accessToken')
      
      // Only redirect if no token exists
      if (!token) {
        console.warn('[API Client] 401 - No token, redirecting to login')
        // Use router for SPA navigation
        const router = (window as any).__VUE_ROUTER__
        if (router) {
          router.push('/login')
        } else {
          window.location.href = '/attendance/login'
        }
      } else {
        console.warn('[API Client] 401 - Token exists but request failed')
      }
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
    getByDate: (date: string, scope?: 'all') => {
      const url = '/attendance/daily/' + date
      const params = scope === 'all' ? { scope: 'all' } : {}
      return api.get<AttendanceRecord[]>(url, { params })
    },
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

  facescan: {
    getLatestImport: (date?: string, batchId?: string, limit?: number, offset?: number) => {
      const url = '/facescan-daily/imports/latest'
      const params: any = {}
      if (date) params.date = date
      if (batchId) params.batchId = batchId
      if (limit) params.limit = limit
      if (offset) params.offset = offset
      return api.get<FacescanLatestImportResponse>(url, { params })
    },
  },

  dashboard: {
    getDailySummary: (date?: string) => {
      const url = '/dashboard/daily-summary'
      const params = date ? { date } : {}
      return api.get<{
        date: string
        summary: {
          total_employees: number
          present: number
          late: number
          leave: number
          absent: number
        }
        sample: {
          first_checkin_min: string | null
          first_checkin_max: string | null
          scanned_employees: number
        }
      }>(url, { params })
    },
  },

  sync: {
    syncAttendance: (batchId?: string, date?: string) => {
      const url = '/sync/attendance'
      const params: any = {}
      if (batchId) params.batchId = batchId
      if (date) params.date = date
      return api.post<{ inserted: number; updated: number; total: number }>(url, {}, { params })
    },
    syncLeaves: (startDate?: string, endDate?: string) => {
      const url = '/sync/leaves'
      const params: any = {}
      if (startDate) params.startDate = startDate
      if (endDate) params.endDate = endDate
      return api.post<{ inserted: number; updated: number; totalDates: number; totalLeaves: number }>(url, {}, { params })
    },
    syncAll: (batchId?: string, date?: string, startDate?: string, endDate?: string) => {
      const url = '/sync/all'
      const params: any = {}
      if (batchId) params.batchId = batchId
      if (date) params.date = date
      if (startDate) params.startDate = startDate
      if (endDate) params.endDate = endDate
      return api.post<{ attendance: { inserted: number; updated: number }; leaves: { inserted: number; updated: number } }>(url, {}, { params })
    },
  },

  reports: {
    getOverview: (dept?: string) => {
      const url = '/reports/overview'
      const params = dept ? { dept } : {}
      return api.get<{ data: DashboardOverview }>(url, { params })
    },
    getAttendanceTrend: (days: 7 | 30, scope?: 'all') => {
      const url = `/reports/attendance/trend?days=${days}`
      const params = scope === 'all' ? { scope: 'all' } : {}
      // Add cache-busting timestamp
      const cacheBuster = `_ts=${Date.now()}`
      return api.get<{ data: AttendanceTrendResponse } | AttendanceTrendResponse>(url, { 
        params: { ...params, _ts: Date.now() }
      })
    },
    getLeaveSummary: (date?: string) => {
      if (date) {
        return api.get<{ data: { date: string; leave_count: number } }>(`/reports/leaves/summary?date=${date}`)
      }
      return api.get<{ data: any }>('/reports/leaves/summary')
    },
    getMonthlySummary: (month: number, year: number, employeeId?: string, department?: string) => {
      let url = `/reports/monthly-summary?month=${month}&year=${year}`
      if (employeeId) url += `&employee_id=${employeeId}`
      if (department) url += `&department=${department}`
      return api.get<any[]>(url)
    },
    getDailyReport: (start: string, end: string, employeeId?: string, department?: string) => {
      let url = `/reports/daily?start=${start}&end=${end}`
      if (employeeId) url += `&employee_id=${employeeId}`
      if (department) url += `&department=${department}`
      return api.get<any[]>(url)
    },
    exportMonthlySummaryCSV: (month: number, year: number, employeeId?: string, department?: string) => {
      let url = `/reports/monthly-summary?month=${month}&year=${year}&format=csv`
      if (employeeId) url += `&employee_id=${employeeId}`
      if (department) url += `&department=${department}`
      return apiClient.get(url, { responseType: 'blob' })
    },
    exportDailyReportCSV: (start: string, end: string, employeeId?: string, department?: string) => {
      let url = `/reports/daily?start=${start}&end=${end}&format=csv`
      if (employeeId) url += `&employee_id=${employeeId}`
      if (department) url += `&department=${department}`
      return apiClient.get(url, { responseType: 'blob' })
    },
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
      latest_updated?: string
      total_records: number
      status: string
      latest_leave_start_date?: string
      latest_leave_end_date?: string
      latest_leave_created_at?: string
      latest_leave_update_bangkok?: string
      latest_leave_period_label?: string
      latest_leave_records_count_for_period?: number
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

export interface AttendanceTrendDataPoint {
  date: string
  present: number
  late: number
  absent: number
  leave: number
}

export interface DashboardOverview {
  date: string
  displayDate?: string
  isTodayData?: boolean
  department: string
  cards: {
    totalEmployees: number
    presentToday: number
    lateToday: number
    onLeaveToday: number
  }
  metrics: {
    attendanceRate30d: number
    totalRecordsToday: number
  }
  meta?: {
    dataRange: {
      minDate: string | null
      maxDate: string | null
    }
    displayInfo?: {
      targetDate: string
      isTodayData: boolean
      hasData: boolean
    }
    latestImport: {
      batchId: string
      importedAt: string
      inserted: number
      updated: number
      duplicates: number
      total: number
    } | null
  }
}

export interface AttendanceTrendResponse {
  success: boolean
  range_days: number
  data: AttendanceTrendDataPoint[]
}

export interface FacescanLatestImportResponse {
  success: boolean
  data: {
    snapshot: {
      batchId: string
      fileDate: string
      min_check_time: string | null
      max_check_time: string | null
      totalRows: number
      foundEmployees: number
      duplicates: number
      unmatched: number
      mappedInsertedCount: number
      importedAt: string
      sourceFilename: string
    } | null
    rows: Array<{
      id: string
      employee_name_raw: string | null
      employee_uid: string | null
      employee_id: string | null
      employee_name: string | null
      department: string | null
      check_time: string | null
      work_date: string
      last_out_time: string | null
      facescan_id: string
      employee_ref: string
      status: 'matched' | 'unmatched' | 'unknown'
      reason: string | null
      day_status: string | null
    }>
    pagination: {
      total: number
      limit: number
      offset: number
      hasMore: boolean
    }
  }
  message: string
}

export default api
