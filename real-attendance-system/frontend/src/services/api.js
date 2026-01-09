import axios from 'axios'

// Get API base URL from environment variable
// Default to production URL if not set (fallback for production builds)
// Empty string for development (uses Vite proxy)
// Production API is at: https://raeservice.mju.ac.th/attendance/api
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.PROD ? 'https://raeservice.mju.ac.th/attendance/api' : '')

// Log API configuration on initialization
console.log('🔧 API Service Initialized:', {
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  PROD: import.meta.env.PROD,
  MODE: import.meta.env.MODE,
  API_BASE_URL: API_BASE_URL || '/api',
  finalBaseURL: API_BASE_URL || '/api'
})

const api = axios.create({
  baseURL: API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache'
  }
})

// Request interceptor - add token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Log API requests for debugging
    console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.baseURL || ''}${config.url}`, {
      baseURL: config.baseURL,
      url: config.url,
      fullURL: `${config.baseURL || ''}${config.url}`,
      hasToken: !!token
    })
    
    return config
  },
  error => {
    console.error('❌ Request Interceptor Error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor - handle 401
api.interceptors.response.use(
  response => {
    // Log successful API responses
    console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
      status: response.status,
      data: response.data
    })
    return response
  },
  async error => {
    // Log API errors
    console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      data: error.response?.data
    })
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) {
        try {
          const refreshUrl = API_BASE_URL ? `${API_BASE_URL}/auth/refresh` : '/api/auth/refresh'
          const res = await axios.post(refreshUrl, { refreshToken })
          const { accessToken, refreshToken: newRefreshToken } = res.data.data
          
          localStorage.setItem('accessToken', accessToken)
          localStorage.setItem('refreshToken', newRefreshToken)
          
          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          return api.request(originalRequest)
        } catch (refreshError) {
          // Refresh failed, logout
          localStorage.clear()
          window.location.href = '/attendance/login'
          return Promise.reject(refreshError)
        }
      } else {
        // No refresh token, logout
        localStorage.clear()
        window.location.href = '/attendance/login'
      }
    }

    return Promise.reject(error)
  }
)

/**
 * API Service Layer
 */
export const authAPI = {
  /**
   * Login
   * @param {string} email - อีเมล
   * @param {string} password - รหัสผ่าน
   */
  login: (email, password) => api.post('/auth/login', { email, password }),

  /**
   * Logout
   * @param {string} refreshToken - Refresh token
   */
  logout: (refreshToken) => api.post('/auth/logout', { refreshToken }),

  /**
   * Refresh token
   * @param {string} refreshToken - Refresh token
   */
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),

  /**
   * Get current user info
   */
  me: () => api.get('/auth/me'),

  /**
   * Get active sessions
   */
  sessions: () => api.get('/auth/sessions')
}

export const employeeAPI = {
  /**
   * Get all employees
   * @param {Object} params - Query parameters (page, limit, search)
   */
  getAll: (params) => api.get('/employees', { params }),

  /**
   * Get employee by UID
   * @param {string} uid - Employee UID
   */
  getByUid: (uid) => api.get(`/employees/${uid}`)
}

export const attendanceAPI = {
  /**
   * Get daily attendance
   * @param {string} date - Date (YYYY-MM-DD)
   * @param {Object} params - Query parameters (status, search)
   */
  getDaily: (date, params) => api.get(`/attendance/daily/${date}`, { params }),

  /**
   * Get monthly summary
   * @param {string} uid - Employee UID
   * @param {number} year - Year (พ.ศ.)
   * @param {number} month - Month (1-12)
   */
  getMonthlySummary: (uid, year, month) => 
    api.get(`/attendance/monthly/${uid}/${year}/${month}`),

  /**
   * Get attendance records in date range
   * @param {string} uid - Employee UID
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   */
  getRange: (uid, startDate, endDate) => 
    api.get(`/attendance/${uid}`, { params: { startDate, endDate } })
}

export const leaveAPI = {
  /**
   * Get leave balance
   * @param {string} uid - Employee UID
   */
  getBalance: (uid) => api.get(`/leave/balance/${uid}`),

  /**
   * Get leave history
   * @param {string} uid - Employee UID
   * @param {Object} params - Query parameters
   */
  getHistory: (uid, params) => api.get(`/leave/history/${uid}`, { params })
}

export default api

