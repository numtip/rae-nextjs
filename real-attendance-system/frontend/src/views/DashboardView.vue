<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  UserCheck, 
  Clock, 
  Calendar,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  BarChart3,
  Upload,
  FileText,
  Download
} from 'lucide-vue-next'
import api, { type AttendanceStats, type AttendanceRecord, type DataFreshness, type AttendanceTrendDataPoint, type FacescanLatestImportResponse } from '@/lib/api'
import { formatBuddhistDate, formatThaiTime, toBuddhistYear, thaiMonthsShort } from '@/utils/dateFormatter'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions
} from 'chart.js'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// Computed: Check if user is admin
const isAdmin = computed(() => {
  return authStore.user?.role === 'admin' || authStore.user?.employmentType === 'admin'
})

// State
const loading = ref(true)
const error = ref<string | null>(null)
const lastUpdated = ref<Date | null>(null)
const dataFreshness = ref<DataFreshness | null>(null)
const refreshSuccess = ref(false)
const stats = ref<AttendanceStats>({
  total_employees: 0,
  present_today: 0,
  late_today: 0,
  absent_today: 0,
  on_leave_today: 0,
})
const recentAttendance = ref<AttendanceRecord[]>([])

// Latest available date state (for fallback when today has no data)
const latestAvailableDate = ref<string | null>(null)
const displayDate = ref<string>(new Date().toISOString().split('T')[0])
const displayDateLabel = ref<string>('')

// Trend chart state
const trendDays = ref<7 | 30>(7)
const trendLoading = ref(false)
const trendData = ref<AttendanceTrendDataPoint[]>([])
const trendError = ref<string | null>(null)

// Overview metadata state
const overviewMeta = ref<{
  dataRange: { minDate: string | null; maxDate: string | null } | null
  latestImport: {
    batchId: string
    importedAt: string
    inserted: number
    updated: number
    duplicates: number
    total: number
  } | null
} | null>(null)

// RAW/OFFICIAL mode state
const viewMode = ref<'RAW' | 'OFFICIAL'>('RAW') // Default to RAW
const selectedDate = ref<string>(new Date().toISOString().split('T')[0])
const selectedBatchId = ref<string | null>(null)

// RAW mode data state
const rawDataLoading = ref(false)
const rawDataError = ref<string | null>(null)
const rawDataSnapshot = ref<FacescanLatestImportResponse['data']['snapshot'] | null>(null)
const rawDataRows = ref<FacescanLatestImportResponse['data']['rows']>([])
const rawDataPagination = ref<{ total: number; limit: number; offset: number; hasMore: boolean }>({
  total: 0,
  limit: 50,
  offset: 0,
  hasMore: false
})

// Computed: Format last updated time for display
const lastUpdatedDisplay = computed(() => {
  if (!lastUpdated.value) return null
  return lastUpdated.value.toLocaleString('th-TH', {
    timeZone: 'Asia/Bangkok',
    dateStyle: 'short',
    timeStyle: 'medium'
  })
})

// Computed
const attendanceRate = computed(() => {
  if (stats.value.total_employees === 0) return 0
  // Include present + late + leave in attendance rate
  const attended = stats.value.present_today + stats.value.late_today + stats.value.on_leave_today
  return Math.round((attended / stats.value.total_employees) * 100)
})

// State for daily summary sample data (for banner display)
const dailySummarySample = ref<{
  scanned_employees: number
  first_checkin_min: string | null
  first_checkin_max: string | null
} | null>(null)

const statCards = computed(() => {
  const modeLabel = viewMode.value === 'RAW' ? ' (RAW/From Import)' : ' (Official)'
  return [
    {
      title: 'พนักงานทั้งหมด' + modeLabel,
      value: stats.value.total_employees,
      icon: Users,
      color: 'bg-blue-500',
      description: viewMode.value === 'RAW' ? 'จำนวนพนักงานในระบบ' : 'จำนวนพนักงานในระบบ',
    },
    {
      title: 'มาทำงานวันนี้' + modeLabel,
      value: stats.value.present_today,
      icon: UserCheck,
      color: 'bg-green-500',
      description: viewMode.value === 'RAW' 
        ? `มาทำงานปกติ ${stats.value.present_today} คน` 
        : `อัตราการมาทำงาน ${attendanceRate.value}%`,
    },
    {
      title: 'มาสาย' + modeLabel,
      value: stats.value.late_today,
      icon: Clock,
      color: 'bg-yellow-500',
      description: viewMode.value === 'RAW' ? `มาสาย ${stats.value.late_today} คน` : 'มาสายวันนี้',
    },
    {
      title: viewMode.value === 'RAW' ? 'ขาดงาน' + modeLabel : 'ลาวันนี้' + modeLabel,
      value: viewMode.value === 'RAW' ? stats.value.absent_today : stats.value.on_leave_today,
      icon: Calendar,
      color: 'bg-purple-500',
      description: viewMode.value === 'RAW' ? `ขาดงาน ${stats.value.absent_today} คน` : leaveDescription.value,
    },
  ]
})

// Leave fallback state
const leaveDescription = ref<string>('ลางานวันนี้')
const leaveFallbackLabel = ref<string>('')
const leaveTodayCount = ref<number>(0)

// Methods
const fetchTrendData = async (useAdminScope = false) => {
  trendLoading.value = true
  trendError.value = null

  try {
    const scopeParam = useAdminScope ? 'all' : undefined
    const response = await api.reports.getAttendanceTrend(trendDays.value, scopeParam)
    
    // Debug logging
    console.log('[Dashboard] Trend API response:', {
      response,
      hasData: !!(response as any)?.data,
      hasDataData: !!(response as any)?.data?.data,
      responseType: typeof response,
      keys: Object.keys(response || {})
    })
    
    // Handle API response structure: { success: true, data: { range_days, data: [...] }, message: ... }
    // Or: { data: { range_days, data: [...] } }
    let trendArray = null
    
    if (Array.isArray(response)) {
      // Direct array response
      trendArray = response
    } else if ((response as any)?.data) {
      const responseData = (response as any).data
      
      if (Array.isArray(responseData)) {
        // data is array
        trendArray = responseData
      } else if (responseData?.data && Array.isArray(responseData.data)) {
        // data.data is array
        trendArray = responseData.data
      } else if (responseData?.range_days && responseData?.data && Array.isArray(responseData.data)) {
        // { data: { range_days, data: [...] } }
        trendArray = responseData.data
      }
    }
    
    if (trendArray && Array.isArray(trendArray) && trendArray.length > 0) {
      trendData.value = trendArray
      console.log('[Dashboard] Trend data loaded:', trendArray.length, 'days')
    } else {
      trendData.value = []
      console.warn('[Dashboard] No trend data found in response')
    }
  } catch (err: any) {
    console.error('[Dashboard] Failed to fetch trend data:', err)
    trendError.value = err.response?.data?.error?.message || err.message || 'ไม่สามารถโหลดข้อมูลเทรนด์ได้'
    trendData.value = []
  } finally {
    trendLoading.value = false
  }
}

// Fetch daily summary for KPI cards (from staging_facescan_daily)
const fetchDailySummary = async (date: string) => {
  try {
    const summaryRes = await api.dashboard.getDailySummary(date)
    const summaryData = summaryRes.data || summaryRes
    
    if (summaryData?.summary) {
      stats.value = {
        total_employees: summaryData.summary.total_employees || 0,
        present_today: summaryData.summary.present || 0,
        late_today: summaryData.summary.late || 0,
        absent_today: summaryData.summary.absent || 0,
        on_leave_today: summaryData.summary.leave || 0,
      }
      
      // Store sample data for banner display
      if (summaryData.sample) {
        dailySummarySample.value = {
          scanned_employees: summaryData.sample.scanned_employees || 0,
          first_checkin_min: summaryData.sample.first_checkin_min || null,
          first_checkin_max: summaryData.sample.first_checkin_max || null,
        }
      }
      
      console.log('[Dashboard] Daily summary loaded:', {
        date: summaryData.date,
        summary: summaryData.summary,
        sample: summaryData.sample
      })
    }
  } catch (err: any) {
    console.error('[Dashboard] Failed to fetch daily summary:', err)
    // Don't set error - just log it, fallback to zero stats
    stats.value = {
      total_employees: 0,
      present_today: 0,
      late_today: 0,
      absent_today: 0,
      on_leave_today: 0,
    }
    dailySummarySample.value = null
  }
}

// Fetch RAW mode data
const fetchRawData = async () => {
  rawDataLoading.value = true
  rawDataError.value = null
  rawDataSnapshot.value = null
  rawDataRows.value = []

  try {
    // Fetch RAW table data (unchanged)
    const response = await api.facescan.getLatestImport(
      selectedDate.value,
      selectedBatchId.value || undefined,
      rawDataPagination.value.limit,
      rawDataPagination.value.offset
    )

    // API returns { success: true, data: { snapshot, rows, pagination }, message }
    // api client extracts .data, so response is { success: true, data: {...}, message }
    const responseData = (response as any).data || response

    if (responseData) {
      rawDataSnapshot.value = responseData.snapshot
      rawDataRows.value = responseData.rows || []
      rawDataPagination.value = responseData.pagination || {
        total: 0,
        limit: rawDataPagination.value.limit,
        offset: rawDataPagination.value.offset,
        hasMore: false
      }

      // Format recent attendance from RAW rows (for table display only)
      recentAttendance.value = rawDataRows.value.slice(0, 10).map((row) => ({
        id: row.id,
        employee_name: row.employee_name || row.employee_name_raw || 'ไม่พบชื่อ',
        department: row.department || '',
        check_in: row.check_time || '',
        status: row.status === 'matched' ? 'present' : 'absent'
      }))
    } else {
      recentAttendance.value = []
    }

    // Fetch KPI cards from daily-summary endpoint (NEW)
    await fetchDailySummary(selectedDate.value)
    
  } catch (err: any) {
    console.error('Failed to fetch RAW data:', err)
    
    // Handle authentication errors specifically
    if (err.response?.status === 401) {
      rawDataError.value = '⚠️ Session หมดอายุ - กรุณา Login ใหม่หรือสลับไปใช้โหมด OFFICIAL'
      
      // Auto-switch to OFFICIAL mode after 3 seconds
      setTimeout(() => {
        if (viewMode.value === 'RAW') {
          console.log('[RAW Mode] Auto-switching to OFFICIAL mode due to auth error')
          viewMode.value = 'OFFICIAL'
          rawDataError.value = null // Clear error when switching
        }
      }, 3000)
    } else {
      // Other errors
      const errorMsg = err.response?.data?.error?.message || err.message || 'ไม่สามารถโหลดข้อมูล RAW ได้'
      rawDataError.value = errorMsg
    }
    
    // Reset stats on error
    stats.value = {
      total_employees: 0,
      present_today: 0,
      late_today: 0,
      absent_today: 0,
      on_leave_today: 0,
    }
    recentAttendance.value = []
  } finally {
    rawDataLoading.value = false
  }
}

const fetchDashboardData = async (forceRefresh = false) => {
  // If RAW mode, fetch RAW data instead
  if (viewMode.value === 'RAW') {
    await fetchRawData()
    lastUpdated.value = new Date()
    refreshSuccess.value = true
    setTimeout(() => {
      refreshSuccess.value = false
    }, 2000)
    return
  }

  // OFFICIAL mode: use existing logic
  loading.value = true
  error.value = null
  refreshSuccess.value = false

  try {
    // Fetch today's attendance data with cache-busting
    const today = new Date().toISOString().split('T')[0]
    const cacheBuster = forceRefresh ? `_ts=${Date.now()}` : ''
    
    // Determine if admin scope should be used
    const useAdminScope = isAdmin.value
    const scopeParam = useAdminScope ? 'all' : undefined
    
    console.log('[Dashboard] Fetching data...', {
      today,
      useAdminScope,
      scopeParam,
      forceRefresh,
      timestamp: new Date().toISOString()
    })
    
    // Fetch attendance data, data freshness, today's leave count, and overview in parallel
    const [attendanceRes, freshnessRes, leaveTodayRes, overviewRes] = await Promise.all([
      api.attendance.getByDate(today, scopeParam),
      api.meta.getDataFreshness().catch(() => null), // Don't fail if freshness endpoint is unavailable
      api.reports.getLeaveSummary(today).catch(() => null), // Fetch today's leave count
      api.reports.getOverview().catch(() => null) // Fetch overview metadata
    ])
    
    console.log('[Dashboard] API responses received:', {
      attendance: attendanceRes?.data ? 'OK' : 'EMPTY',
      freshness: freshnessRes?.data ? 'OK' : 'EMPTY',
      leave: leaveTodayRes?.data ? 'OK' : 'EMPTY',
      overview: overviewRes?.data ? 'OK' : 'EMPTY'
    })
    
    // Extract overview metadata and use overview cards data
    const overviewData = overviewRes?.data?.data || overviewRes?.data || overviewRes
    if (overviewData?.meta) {
      overviewMeta.value = overviewData.meta
    }
    
    // Use overview cards data if available (from database, not just today)
    if (overviewData?.cards) {
      stats.value = {
        total_employees: overviewData.cards.totalEmployees || 0,
        present_today: overviewData.cards.presentToday || 0,
        late_today: overviewData.cards.lateToday || 0,
        absent_today: 0, // Calculate from total - present
        on_leave_today: overviewData.cards.onLeaveToday || 0,
      }
      
      // Update display date if overview has date info
      if (overviewData.displayDate || overviewData.date) {
        displayDate.value = overviewData.displayDate || overviewData.date
      }
      
      // Set display label if not today's data
      if (overviewData.isTodayData === false || (overviewData.displayDate && overviewData.displayDate !== today)) {
        const displayDateObj = new Date(overviewData.displayDate || overviewData.date)
        displayDateLabel.value = `ข้อมูลล่าสุดวันที่ ${formatBuddhistDate(displayDateObj, 'long')} (ไม่มีข้อมูลของวันนี้)`
      } else {
        displayDateLabel.value = ''
      }
    }
    
    // Fetch trend data separately (non-blocking) with admin scope if admin
    fetchTrendData(useAdminScope).catch(err => {
      console.error('Failed to fetch trend data during refresh:', err)
    })
    
    // Process leave fallback logic
    const leaveTodayData = leaveTodayRes?.data?.data || leaveTodayRes?.data || leaveTodayRes
    leaveTodayCount.value = leaveTodayData?.leave_count || 0
    
    // Check if we need to show leave fallback
    if (leaveTodayCount.value === 0 && freshnessRes?.data) {
      const leaveInfo = freshnessRes.data.data_sources?.staging_leave
      if (leaveInfo?.latest_leave_start_date && leaveInfo?.latest_leave_end_date) {
        // Format dates in Thai (Buddhist calendar)
        const startDate = new Date(leaveInfo.latest_leave_start_date)
        const endDate = new Date(leaveInfo.latest_leave_end_date)
        
        let periodLabel = ''
        if (leaveInfo.latest_leave_start_date === leaveInfo.latest_leave_end_date) {
          // Single date
          periodLabel = formatBuddhistDate(startDate, 'medium')
        } else {
          // Date range - compact format
          const startDay = startDate.getDate()
          const startMonth = startDate.getMonth()
          const endDay = endDate.getDate()
          const endMonth = endDate.getMonth()
          const year = toBuddhistYear(startDate.getFullYear())
          
          if (startMonth === endMonth) {
            // Same month: "8–9 ม.ค. 2569"
            periodLabel = `${startDay}–${endDay} ${thaiMonthsShort[startMonth]} ${year}`
          } else {
            // Different months: "8 ม.ค.–9 ก.พ. 2569"
            periodLabel = `${startDay} ${thaiMonthsShort[startMonth]}–${endDay} ${thaiMonthsShort[endMonth]} ${year}`
          }
        }
        
        leaveFallbackLabel.value = `วันนี้ไม่มีข้อมูลลา • แสดงข้อมูลลาล่าสุด: ${periodLabel}`
        leaveDescription.value = leaveFallbackLabel.value
        
        // Optionally show record count if available
        if (leaveInfo.latest_leave_records_count_for_period && leaveInfo.latest_leave_records_count_for_period > 0) {
          leaveDescription.value += ` (${leaveInfo.latest_leave_records_count_for_period} รายการ)`
        }
      } else if (leaveInfo?.total_records === 0) {
        // No leave data at all
        leaveDescription.value = 'ยังไม่มีข้อมูลลา'
        leaveFallbackLabel.value = ''
      } else {
        // Has leave data but no period info
        leaveDescription.value = 'ลางานวันนี้'
        leaveFallbackLabel.value = ''
      }
    } else {
      // Today has leave data or no leave info available
      leaveDescription.value = 'ลางานวันนี้'
      leaveFallbackLabel.value = ''
    }
    
    // Extract data from response
    const attendanceData = attendanceRes.data?.data || attendanceRes.data || attendanceRes
    const records = attendanceData.records || attendanceData
    
    // Check if today has no data and get latest available date
    const allRecords = Array.isArray(records) ? records : []
    const hasTodayData = allRecords.length > 0
    
    if (!hasTodayData && freshnessRes?.data) {
      // Get latest available date from freshness data
      const latestDate = freshnessRes.data.latest_available_attendance_date || 
                        freshnessRes.data.data_sources?.daily_attendance?.latest_date
      
      if (latestDate && latestDate !== today) {
        latestAvailableDate.value = latestDate
        displayDate.value = latestDate
        
        // Fetch data for latest available date (with admin scope if admin)
        try {
          const latestScopeParam = isAdmin.value ? 'all' : undefined
          const latestAttendanceRes = await api.attendance.getByDate(latestDate, latestScopeParam)
          const latestAttendanceData = latestAttendanceRes.data?.data || latestAttendanceRes.data || latestAttendanceRes
          const latestRecords = latestAttendanceData.records || latestAttendanceData
          
          // Use latest date data
          const allLatestRecords = Array.isArray(latestRecords) ? latestRecords : []
          const latestSummary = latestAttendanceData.summary || {}
          
          stats.value = {
            total_employees: latestSummary.total || allLatestRecords.length,
            present_today: latestSummary.present || allLatestRecords.filter((r: any) => r.status === 'present').length,
            late_today: latestSummary.late || allLatestRecords.filter((r: any) => r.status === 'late').length,
            absent_today: latestSummary.absent || allLatestRecords.filter((r: any) => r.status === 'absent').length,
            on_leave_today: latestSummary.leave || allLatestRecords.filter((r: any) => r.status === 'leave').length,
          }
          
          // Format recent attendance records
          recentAttendance.value = allLatestRecords.slice(0, 10).map((record: any) => ({
            id: record.attendance_id || record.id,
            employee_name: record.employee_name || `${record.first_name_th || ''} ${record.last_name_th || ''}`.trim(),
            department: record.department || '',
            check_in: record.check_in_iso || record.check_in || '',
            status: record.status || 'absent'
          }))
          
          // Set display label
          const latestDateObj = new Date(latestDate)
          displayDateLabel.value = `ข้อมูลล่าสุดวันที่ ${formatBuddhistDate(latestDateObj, 'long')} (ไม่มีข้อมูลของวันนี้)`
          
          // Update timestamps
          lastUpdated.value = new Date()
          if (freshnessRes?.data) {
            dataFreshness.value = freshnessRes.data
          }
          
          // Show success indicator briefly
          refreshSuccess.value = true
          setTimeout(() => {
            refreshSuccess.value = false
          }, 2000)
          
          return // Exit early since we've handled the fallback
        } catch (err: any) {
          console.error('Failed to fetch latest available date data:', err)
          // Fall through to empty state handling
        }
      }
    }
    
    // Normal flow: use today's data (or empty if no data)
    displayDate.value = today
    displayDateLabel.value = hasTodayData ? '' : 'ยังไม่มีข้อมูลการลงเวลาวันนี้'
    
    // Calculate stats from records (reuse allRecords from above)
    const summary = attendanceData.summary || {}
    
    stats.value = {
      total_employees: summary.total || allRecords.length,
      present_today: summary.present || allRecords.filter((r: any) => r.status === 'present').length,
      late_today: summary.late || allRecords.filter((r: any) => r.status === 'late').length,
      absent_today: summary.absent || allRecords.filter((r: any) => r.status === 'absent').length,
      on_leave_today: summary.leave || allRecords.filter((r: any) => r.status === 'leave').length,
    }

    // Format recent attendance records
    recentAttendance.value = allRecords.slice(0, 10).map((record: any) => ({
      id: record.attendance_id || record.id,
      employee_name: record.employee_name || `${record.first_name_th || ''} ${record.last_name_th || ''}`.trim(),
      department: record.department || '',
      check_in: record.check_in_iso || record.check_in || '',
      status: record.status || 'absent'
    }))
    
    // Update timestamps
    lastUpdated.value = new Date()
    if (freshnessRes?.data) {
      dataFreshness.value = freshnessRes.data
    }
    
    // Show success indicator briefly
    refreshSuccess.value = true
    setTimeout(() => {
      refreshSuccess.value = false
    }, 2000)
    
  } catch (err: any) {
    console.error('Failed to fetch dashboard data:', err)
    error.value = err.response?.data?.error?.message || err.message || 'ไม่สามารถโหลดข้อมูลได้'
    
    // Reset stats on error - don't use mock data
    stats.value = {
      total_employees: 0,
      present_today: 0,
      late_today: 0,
      absent_today: 0,
      on_leave_today: 0,
    }
    recentAttendance.value = []
  } finally {
    loading.value = false
  }
}

const switchTrendDays = async (days: 7 | 30) => {
  if (trendDays.value === days || trendLoading.value) return
  trendDays.value = days
  await fetchTrendData(isAdmin.value)
}

// Download unmatched CSV
const downloadUnmatched = async () => {
  if (!rawDataSnapshot.value?.batchId) return
  
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL || '/api'}/facescan-daily/imports/${rawDataSnapshot.value.batchId}/unmatched-csv`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        credentials: 'include'
      }
    )
    
    if (!response.ok) throw new Error('Download failed')
    
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `unmatched-${rawDataSnapshot.value.batchId}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  } catch (err: any) {
    console.error('Failed to download unmatched CSV:', err)
    error.value = 'ไม่สามารถดาวน์โหลดไฟล์ได้'
  }
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'present':
      return { label: 'ปกติ', variant: 'success' as const }
    case 'late':
      return { label: 'มาสาย', variant: 'warning' as const }
    case 'absent':
      return { label: 'ขาดงาน', variant: 'destructive' as const }
    case 'leave':
      return { label: 'ลา', variant: 'secondary' as const }
    default:
      return { label: status, variant: 'outline' as const }
  }
}

// Chart data computed
const chartData = computed<ChartData<'bar'>>(() => {
  if (!trendData.value || trendData.value.length === 0) {
    return {
      labels: [],
      datasets: []
    }
  }

  // Format dates for display (Thai format)
  const labels = trendData.value.map(item => {
    const date = new Date(item.date)
    return formatBuddhistDate(date, 'short')
  })

  return {
    labels,
    datasets: [
      {
        label: 'มาปกติ',
        data: trendData.value.map(item => item.present),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1,
      },
      {
        label: 'มาสาย',
        data: trendData.value.map(item => item.late),
        backgroundColor: 'rgba(245, 158, 11, 0.8)',
        borderColor: 'rgba(245, 158, 11, 1)',
        borderWidth: 1,
      },
      {
        label: 'ขาดงาน',
        data: trendData.value.map(item => item.absent),
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 1,
      },
      {
        label: 'ลา',
        data: trendData.value.map(item => item.leave),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  }
})

const chartOptions = computed<ChartOptions<'bar'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        usePointStyle: true,
        padding: 15,
        font: {
          size: 12,
        },
      },
    },
    tooltip: {
      mode: 'index',
      intersect: false,
    },
    title: {
      display: false,
    },
  },
  scales: {
    x: {
      stacked: true,
      ticks: {
        maxRotation: 45,
        minRotation: 45,
        font: {
          size: 10,
        },
      },
      grid: {
        display: false,
      },
    },
    y: {
      stacked: true,
      beginAtZero: true,
      ticks: {
        stepSize: 1,
        font: {
          size: 11,
        },
      },
      title: {
        display: true,
        text: 'จำนวนพนักงาน',
        font: {
          size: 12,
        },
      },
    },
  },
}))

// Watch for mode/date changes
watch([viewMode, selectedDate, selectedBatchId], () => {
  fetchDashboardData(true) // Force refresh when mode/date changes
})

// Auto-refresh interval (every 30 seconds when on dashboard)
let refreshInterval: ReturnType<typeof setInterval> | null = null

// Watch for route changes to refresh data and manage auto-refresh
watch(() => route.name, (newName) => {
  if (newName === 'Dashboard') {
    // Start auto-refresh when on dashboard
    if (refreshInterval) {
      clearInterval(refreshInterval)
    }
    refreshInterval = setInterval(() => {
      if (!loading.value && !rawDataLoading.value) {
        console.log('[Dashboard] Auto-refresh triggered')
        fetchDashboardData(true) // Force refresh with cache-busting
      }
    }, 30000) // Refresh every 30 seconds
    
    // Initial fetch with force refresh
    fetchDashboardData(true)
  } else {
    // Stop auto-refresh when leaving dashboard
    if (refreshInterval) {
      clearInterval(refreshInterval)
      refreshInterval = null
    }
  }
}, { immediate: true })

onMounted(() => {
  fetchDashboardData()
})

// Cleanup on unmount
onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">แดชบอร์ด</h1>
        <p class="text-gray-500">
          ภาพรวมการลงเวลาและการลาประจำวัน
        </p>
        <!-- Last Updated Timestamp -->
        <div v-if="lastUpdatedDisplay" class="flex items-center gap-2 mt-2 text-sm">
          <span class="text-gray-400">อัพเดทล่าสุด:</span>
          <span class="text-gray-600 font-medium">{{ lastUpdatedDisplay }}</span>
          <CheckCircle2 v-if="refreshSuccess" class="h-4 w-4 text-green-500 animate-pulse" />
        </div>
      </div>
      <div class="flex items-center gap-3">
        <!-- Refresh Success Indicator -->
        <span v-if="refreshSuccess" class="text-sm text-green-600 flex items-center gap-1">
          <CheckCircle2 class="h-4 w-4" />
          โหลดข้อมูลสำเร็จ
        </span>
        <!-- CSV Upload Button (Admin only) -->
        <Button 
          v-if="isAdmin"
          @click="router.push('/app/admin/csv')" 
          variant="outline"
          class="border-green-600 text-green-700 hover:bg-green-50"
        >
          <Upload class="h-4 w-4 mr-2" />
          นำเข้า CSV
        </Button>
        <Button @click="fetchDashboardData(true)" :disabled="loading || rawDataLoading" class="bg-primary hover:bg-primary/90">
          <RefreshCw :class="['h-4 w-4 mr-2', (loading || rawDataLoading) && 'animate-spin']" />
          รีเฟรชข้อมูล
        </Button>
      </div>
    </div>

    <!-- Mode Switch and Date Picker -->
    <Card class="bg-white">
      <CardContent class="py-4">
        <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <!-- Mode Switch -->
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium text-gray-700">โหมดแสดงผล:</span>
            <div class="flex gap-1 bg-gray-100 rounded-lg p-1">
              <Button
                @click="viewMode = 'RAW'"
                :variant="viewMode === 'RAW' ? 'default' : 'ghost'"
                size="sm"
                class="text-xs"
              >
                RAW: จากไฟล์ล่าสุด
              </Button>
              <Button
                @click="viewMode = 'OFFICIAL'"
                :variant="viewMode === 'OFFICIAL' ? 'default' : 'ghost'"
                size="sm"
                class="text-xs"
              >
                OFFICIAL: ข้อมูลทางการ
              </Button>
            </div>
          </div>

          <!-- Date Picker and Batch Selector (RAW mode only) -->
          <div v-if="viewMode === 'RAW'" class="flex items-center gap-3">
            <div class="flex items-center gap-2">
              <label class="text-sm font-medium text-gray-700">วันที่:</label>
              <input
                type="date"
                v-model="selectedDate"
                class="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div v-if="rawDataSnapshot" class="text-xs text-gray-500">
              Batch: {{ rawDataSnapshot.batchId.substring(0, 8) }}...
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- RAW Mode: No Data Message -->
    <Card v-if="viewMode === 'RAW' && !rawDataLoading && (!rawDataSnapshot || (rawDataSnapshot && rawDataSnapshot.totalRows === 0)) && !rawDataError" class="border-yellow-200 bg-yellow-50">
      <CardContent class="py-4">
        <div class="flex items-center gap-3">
          <AlertCircle class="h-5 w-5 text-yellow-600" />
          <div>
            <p class="text-yellow-900 font-medium">ยังไม่มีข้อมูลการนำเข้า</p>
            <p class="text-sm text-yellow-700">กรุณานำเข้าไฟล์ CSV เพื่อดูข้อมูลในโหมด RAW</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- RAW Mode: Loading -->
    <Card v-if="viewMode === 'RAW' && rawDataLoading" class="border-gray-200 bg-gray-50">
      <CardContent class="py-8">
        <div class="flex flex-col items-center justify-center gap-3">
          <RefreshCw class="h-8 w-8 text-gray-400 animate-spin" />
          <p class="text-sm text-gray-600">กำลังโหลดข้อมูล RAW...</p>
        </div>
      </CardContent>
    </Card>

    <!-- Latest Import Snapshot Card (RAW mode only) -->
    <Card v-if="viewMode === 'RAW' && rawDataSnapshot" class="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle class="flex items-center gap-2 text-blue-900">
          <FileText class="h-5 w-5" />
          Latest Import Snapshot
        </CardTitle>
        <CardDescription class="text-blue-700">
          ข้อมูลจากไฟล์ล่าสุด: {{ rawDataSnapshot.sourceFilename }}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <p class="text-xs text-blue-600">Total Rows</p>
            <p class="text-lg font-bold text-blue-900">{{ rawDataSnapshot.totalRows.toLocaleString() }}</p>
          </div>
          <div>
            <p class="text-xs text-blue-600">Found Employees</p>
            <p class="text-lg font-bold text-blue-900">{{ rawDataSnapshot.foundEmployees.toLocaleString() }}</p>
          </div>
          <div>
            <p class="text-xs text-blue-600">Duplicates</p>
            <p class="text-lg font-bold text-blue-900">{{ rawDataSnapshot.duplicates.toLocaleString() }}</p>
          </div>
          <div>
            <p class="text-xs text-blue-600">Unmatched</p>
            <p class="text-lg font-bold text-blue-900">{{ rawDataSnapshot.unmatched.toLocaleString() }}</p>
          </div>
        </div>
        <div class="flex flex-wrap gap-2">
          <Button
            @click="router.push(`/app/admin/csv?batchId=${rawDataSnapshot.batchId}`)"
            variant="outline"
            size="sm"
            class="border-blue-600 text-blue-700 hover:bg-blue-100"
          >
            <FileText class="h-4 w-4 mr-2" />
            ดูรายการจากไฟล์นี้
          </Button>
          <Button
            v-if="isAdmin"
            @click="router.push('/app/admin/csv?type=facescan')"
            variant="outline"
            size="sm"
            class="border-green-600 text-green-700 hover:bg-green-100"
          >
            <Upload class="h-4 w-4 mr-2" />
            ไปหน้า Import
          </Button>
          <Button
            v-if="isAdmin && rawDataSnapshot.unmatched > 0"
            @click="downloadUnmatched"
            variant="outline"
            size="sm"
            class="border-orange-600 text-orange-700 hover:bg-orange-100"
          >
            <Download class="h-4 w-4 mr-2" />
            ดาวน์โหลด unmatched
          </Button>
        </div>
        <div v-if="rawDataSnapshot.min_check_time && rawDataSnapshot.max_check_time" class="mt-3 text-xs text-blue-600">
          <p>ช่วงเวลา: {{ formatBuddhistDate(new Date(rawDataSnapshot.min_check_time), 'short') }} - {{ formatBuddhistDate(new Date(rawDataSnapshot.max_check_time), 'short') }}</p>
          <p>นำเข้าล่าสุด: {{ formatThaiTime(new Date(rawDataSnapshot.importedAt)) }}</p>
        </div>
      </CardContent>
    </Card>

    <!-- Data Freshness Banner -->
    <Card 
      v-if="overviewMeta?.latestImport && 
            overviewMeta.latestImport.duplicates === overviewMeta.latestImport.total && 
            overviewMeta.latestImport.inserted === 0 && 
            overviewMeta.latestImport.updated === 0"
      class="border-blue-200 bg-blue-50"
    >
      <CardContent class="py-4">
        <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div class="flex items-start gap-3">
            <AlertCircle class="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p class="text-blue-900 font-medium">ไฟล์นำเข้าซ้ำทั้งหมด (ไม่มีข้อมูลใหม่)</p>
              <div class="text-sm text-blue-700 mt-1 space-y-1">
                <p v-if="overviewMeta.dataRange?.maxDate">
                  ข้อมูลล่าสุด: {{ formatBuddhistDate(new Date(overviewMeta.dataRange.maxDate), 'medium') }}
                </p>
                <p v-if="overviewMeta.latestImport.importedAt">
                  นำเข้าล่าสุด: {{ formatThaiTime(new Date(overviewMeta.latestImport.importedAt)) }}
                </p>
              </div>
            </div>
          </div>
          <div class="flex gap-2 flex-shrink-0">
            <Button 
              v-if="overviewMeta.dataRange?.maxDate"
              @click="router.push(`/app/attendance?date=${overviewMeta.dataRange.maxDate}`)"
              variant="outline"
              size="sm"
              class="border-blue-600 text-blue-700 hover:bg-blue-100"
            >
              <Calendar class="h-4 w-4 mr-2" />
              ดูข้อมูลย้อนหลัง
            </Button>
            <Button 
              v-if="isAdmin"
              @click="router.push('/app/admin/csv?type=facescan')"
              variant="outline"
              size="sm"
              class="border-green-600 text-green-700 hover:bg-green-100"
            >
              <Upload class="h-4 w-4 mr-2" />
              นำเข้าข้อมูลลงเวลา
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Banner: No daily processing (RAW only) -->
    <Card 
      v-if="viewMode === 'RAW' && stats.total_employees > 0 && dailySummarySample && dailySummarySample.scanned_employees === 0"
      class="border-yellow-200 bg-yellow-50"
    >
      <CardContent class="py-4">
        <div class="flex items-center gap-3">
          <AlertCircle class="h-5 w-5 text-yellow-600" />
          <div>
            <p class="text-yellow-900 font-medium">ยังไม่มีการประมวลผลรายวัน (RAW only)</p>
            <p class="text-sm text-yellow-700">ข้อมูลแสดงเฉพาะตาราง RAW ด้านล่าง</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Error Alert -->
    <Card v-if="error || rawDataError" class="border-red-200 bg-red-50">
      <CardContent class="flex items-center gap-3 py-4">
        <AlertCircle class="h-5 w-5 text-red-500" />
        <p class="text-red-700">{{ error || rawDataError }}</p>
      </CardContent>
    </Card>

    <!-- Stats Cards -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card v-for="card in statCards" :key="card.title" class="bg-white">
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium text-gray-500">
            {{ card.title }}
          </CardTitle>
          <div :class="['rounded-full p-2', card.color]">
            <component :is="card.icon" class="h-4 w-4 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div class="text-3xl font-bold text-gray-900">
            <span v-if="loading || rawDataLoading" class="inline-block h-8 w-16 animate-pulse rounded bg-gray-200" />
            <span v-else>{{ card.value.toLocaleString() }}</span>
          </div>
          <p class="text-xs text-gray-500 mt-1">
            {{ card.description }}
          </p>
        </CardContent>
      </Card>
    </div>

    <!-- Attendance Rate Card -->
    <div class="grid gap-4 md:grid-cols-2">
      <Card class="bg-white">
        <CardHeader>
          <CardTitle class="flex items-center gap-2 text-gray-900">
            <TrendingUp class="h-5 w-5 text-primary" />
            อัตราการมาทำงาน
          </CardTitle>
          <CardDescription>สถิติการมาทำงานวันนี้</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="flex items-center gap-4">
            <div class="relative h-24 w-24">
              <svg class="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  stroke-width="10"
                  fill="none"
                  class="text-gray-200"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  stroke-width="10"
                  fill="none"
                  class="text-primary"
                  :stroke-dasharray="`${attendanceRate * 2.51} 251`"
                />
              </svg>
              <div class="absolute inset-0 flex items-center justify-center">
                <span class="text-2xl font-bold text-gray-900">{{ attendanceRate }}%</span>
              </div>
            </div>
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <div class="h-3 w-3 rounded-full bg-green-500" />
                <span class="text-sm text-gray-600">มาปกติ: {{ stats.present_today }} คน</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="h-3 w-3 rounded-full bg-yellow-500" />
                <span class="text-sm text-gray-600">มาสาย: {{ stats.late_today }} คน</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="h-3 w-3 rounded-full bg-red-500" />
                <span class="text-sm text-gray-600">ขาดงาน: {{ stats.absent_today }} คน</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="h-3 w-3 rounded-full bg-purple-500" />
                <span class="text-sm text-gray-600">ลา: {{ stats.on_leave_today }} คน</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Recent Attendance -->
      <Card class="bg-white">
        <CardHeader>
          <CardTitle class="text-gray-900">การลงเวลาล่าสุด</CardTitle>
          <CardDescription>
            <span v-if="displayDateLabel">{{ displayDateLabel }}</span>
            <span v-else>{{ formatBuddhistDate(new Date(displayDate), 'long') }}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div v-if="loading" class="space-y-3">
            <div v-for="i in 5" :key="i" class="flex items-center gap-3">
              <div class="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
              <div class="flex-1 space-y-1">
                <div class="h-4 w-24 animate-pulse rounded bg-gray-200" />
                <div class="h-3 w-16 animate-pulse rounded bg-gray-200" />
              </div>
            </div>
          </div>
          <div v-else-if="recentAttendance.length === 0" class="py-8 text-center text-gray-500">
            ยังไม่มีข้อมูลการลงเวลาวันนี้
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="record in recentAttendance"
              :key="record.id"
              class="flex items-center justify-between rounded-lg border border-gray-200 p-3"
            >
              <div class="flex items-center gap-3">
                <div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                  {{ record.employee_name?.slice(0, 2) || 'NA' }}
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900">{{ record.employee_name }}</p>
                  <p class="text-xs text-gray-500">{{ record.department }}</p>
                </div>
              </div>
              <div class="text-right">
                <Badge :variant="getStatusBadge(record.status).variant">
                  {{ getStatusBadge(record.status).label }}
                </Badge>
                <p class="mt-1 text-xs text-gray-500">
                  {{ record.check_in ? (formatThaiTime(record.check_in) || '-') : '-' }}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Attendance Trend Chart -->
    <Card class="bg-white">
      <CardHeader>
        <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle class="flex items-center gap-2 text-gray-900">
              <BarChart3 class="h-5 w-5 text-primary" />
              แนวโน้มการมาทำงาน
            </CardTitle>
            <CardDescription>สถิติการมาทำงานย้อนหลัง {{ trendDays }} วัน</CardDescription>
          </div>
          <div class="flex items-center gap-2">
            <Button
              @click="switchTrendDays(7)"
              :disabled="trendLoading"
              :variant="trendDays === 7 ? 'default' : 'outline'"
              size="sm"
            >
              7 วัน
            </Button>
            <Button
              @click="switchTrendDays(30)"
              :disabled="trendLoading"
              :variant="trendDays === 30 ? 'default' : 'outline'"
              size="sm"
            >
              30 วัน
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div v-if="trendLoading" class="flex items-center justify-center h-64">
          <div class="flex flex-col items-center gap-3">
            <RefreshCw class="h-8 w-8 text-gray-400 animate-spin" />
            <p class="text-sm text-gray-500">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
        <div v-else-if="trendError" class="flex items-center justify-center h-64">
          <div class="flex flex-col items-center gap-3 text-center">
            <AlertCircle class="h-8 w-8 text-red-500" />
            <p class="text-sm text-red-600">{{ trendError }}</p>
          </div>
        </div>
        <div v-else-if="!trendData || trendData.length === 0" class="flex items-center justify-center h-64">
          <p class="text-sm text-gray-500">ยังไม่มีข้อมูลในช่วงเวลานี้</p>
        </div>
        <div v-else class="h-64">
          <Bar :data="chartData" :options="chartOptions" />
        </div>
      </CardContent>
    </Card>
  </div>
</template>
