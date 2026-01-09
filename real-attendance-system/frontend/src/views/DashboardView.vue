<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
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
  CheckCircle2
} from 'lucide-vue-next'
import api, { type AttendanceStats, type AttendanceRecord, type DataFreshness } from '@/lib/api'
import { formatBuddhistDate, formatThaiTime } from '@/utils/dateFormatter'

const route = useRoute()

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
  return Math.round((stats.value.present_today / stats.value.total_employees) * 100)
})

const statCards = computed(() => [
  {
    title: 'พนักงานทั้งหมด',
    value: stats.value.total_employees,
    icon: Users,
    color: 'bg-blue-500',
    description: 'จำนวนพนักงานในระบบ',
  },
  {
    title: 'มาทำงานวันนี้',
    value: stats.value.present_today,
    icon: UserCheck,
    color: 'bg-green-500',
    description: `อัตราการมาทำงาน ${attendanceRate.value}%`,
  },
  {
    title: 'มาสาย',
    value: stats.value.late_today,
    icon: Clock,
    color: 'bg-yellow-500',
    description: 'มาสายวันนี้',
  },
  {
    title: 'ลาวันนี้',
    value: stats.value.on_leave_today,
    icon: Calendar,
    color: 'bg-purple-500',
    description: 'ลางานวันนี้',
  },
])

// Methods
const fetchDashboardData = async () => {
  loading.value = true
  error.value = null
  refreshSuccess.value = false

  try {
    // Fetch today's attendance data with cache-busting
    const today = new Date().toISOString().split('T')[0]
    const cacheBuster = `_ts=${Date.now()}`
    
    // Fetch attendance data and data freshness in parallel
    const [attendanceRes, freshnessRes] = await Promise.all([
      api.attendance.getByDate(today),
      api.meta.getDataFreshness().catch(() => null) // Don't fail if freshness endpoint is unavailable
    ])
    
    // Extract data from response
    const attendanceData = attendanceRes.data?.data || attendanceRes.data || attendanceRes
    const records = attendanceData.records || attendanceData
    
    // Calculate stats from records
    const allRecords = Array.isArray(records) ? records : []
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
      check_in: record.check_in || '',
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

onMounted(() => {
  fetchDashboardData()
})

// Watch for route changes to refresh data
watch(() => route.name, (newName) => {
  if (newName === 'Dashboard') {
    console.log('🟢 Dashboard route activated - fetching data')
    fetchDashboardData()
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
        <Button @click="fetchDashboardData" :disabled="loading" class="bg-primary hover:bg-primary/90">
          <RefreshCw :class="['h-4 w-4 mr-2', loading && 'animate-spin']" />
          รีเฟรชข้อมูล
        </Button>
      </div>
    </div>

    <!-- Error Alert -->
    <Card v-if="error" class="border-red-200 bg-red-50">
      <CardContent class="flex items-center gap-3 py-4">
        <AlertCircle class="h-5 w-5 text-red-500" />
        <p class="text-red-700">{{ error }}</p>
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
            <span v-if="loading" class="inline-block h-8 w-16 animate-pulse rounded bg-gray-200" />
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
                <span class="text-sm text-gray-600">มาปกติ: {{ stats.present_today - stats.late_today }} คน</span>
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
            {{ formatBuddhistDate(new Date(), 'long') }}
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
                  {{ formatThaiTime(record.check_in) }}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
