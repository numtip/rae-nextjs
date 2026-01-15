<template>
  <div class="p-6 bg-white rounded-lg shadow">
    <!-- Debug Info (DEV only) -->
    <div v-if="isDev" class="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
      <h3 class="font-bold text-blue-900 mb-2">🔍 Debug Info:</h3>
      <p class="text-sm text-blue-800">Component Mounted: {{ componentMounted ? '✅ YES' : '❌ NO' }}</p>
      <p class="text-sm text-blue-800">Loading: {{ isLoading ? '⏳ YES' : '✅ NO' }}</p>
      <p class="text-sm text-blue-800">Employees Count: {{ employees.length }}</p>
      <p class="text-sm text-blue-800">Current Route: {{ currentRoute }}</p>
      <p class="text-sm text-blue-800 mt-2">
        <button @click="manualFetch" class="px-3 py-1 bg-blue-600 text-white rounded text-xs">
          🔄 Manual Fetch
        </button>
      </p>
    </div>

    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">รายชื่อพนักงาน</h1>
      <p class="text-sm text-gray-600 mt-1">ทั้งหมด {{ employees.length }} คน</p>
    </div>

    <!-- Search -->
    <div class="mb-4">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="ค้นหาชื่อพนักงาน..."
        class="w-full px-4 py-2 border rounded-lg"
      />
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="text-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-mju-green mx-auto mb-4"></div>
      <p class="text-gray-600">กำลังโหลดข้อมูล...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
      <p class="text-red-800 font-medium">❌ เกิดข้อผิดพลาด</p>
      <p class="text-red-600 text-sm mt-1">{{ error }}</p>
      <button @click="manualFetch" class="mt-3 px-4 py-2 bg-red-600 text-white rounded text-sm">
        ลองอีกครั้ง
      </button>
    </div>

    <!-- Employee List -->
    <div v-else-if="employees.length > 0" class="space-y-3">
      <div 
        v-for="emp in displayEmployees" 
        :key="emp.employee_uid || emp.id || Math.random()"
        class="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
      >
        <div class="flex items-center gap-4">
          <div class="h-12 w-12 rounded-full bg-mju-green text-white flex items-center justify-center font-bold">
            {{ getInitials(emp.first_name_th, emp.last_name_th) }}
          </div>
          <div class="flex-1">
            <p class="font-medium text-gray-900">
              {{ emp.first_name_th || '-' }} {{ emp.last_name_th || '-' }}
            </p>
            <p class="text-sm text-gray-600">
              {{ emp.employee_id || '-' }} | {{ emp.position || emp.position_name_th || '-' }}
            </p>
            <p class="text-xs text-gray-500">{{ emp.email || '-' }}</p>
          </div>
          <div>
            <span class="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full">
              {{ emp.status === 'active' ? 'ปกติ' : 'ไม่ปกติ' }}
            </span>
          </div>
        </div>
      </div>

      <div v-if="displayEmployees.length < filteredEmployees.length" class="text-center text-sm text-gray-500">
        แสดง {{ displayEmployees.length }} คนแรกจากทั้งหมด {{ filteredEmployees.length }} คน
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12">
      <div class="max-w-md mx-auto">
        <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <p class="text-gray-500 font-medium mb-2">ยังไม่มีข้อมูลพนักงาน</p>
        <p class="text-sm text-gray-400 mb-4">
          ข้อมูลพนักงานจะแสดงที่นี่เมื่อมีการเพิ่มข้อมูลในระบบ<br>
          หากคุณเป็นผู้ดูแลระบบ สามารถนำเข้าข้อมูลผ่านหน้า "จัดการ CSV"
        </p>
        <button @click="manualFetch" class="px-4 py-2 bg-mju-green text-white rounded hover:bg-green-700 transition-colors">
          โหลดข้อมูลอีกครั้ง
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onErrorCaptured } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'

console.log('🔵 EmployeesView: Script Setup Running')

const route = useRoute()
const componentMounted = ref(false)
const employees = ref([])
const searchQuery = ref('')
const isLoading = ref(false)
const error = ref(null)
const isDev = import.meta.env.DEV

// Safe computed for current route
const currentRoute = computed(() => {
  try {
    return route?.path || '/unknown'
  } catch (err) {
    console.error('🔴 Error getting route:', err)
    return '/error'
  }
})

// Safe computed for filtered employees
const filteredEmployees = computed(() => {
  try {
    if (!Array.isArray(employees.value)) {
      console.warn('⚠️ Employees is not array:', employees.value)
      return []
    }

    if (!searchQuery.value || !searchQuery.value.trim()) {
      return employees.value
    }
    
    const query = searchQuery.value.toLowerCase()
    return employees.value.filter(emp => {
      if (!emp) return false
      
      const firstName = emp.first_name_th?.toLowerCase() || ''
      const lastName = emp.last_name_th?.toLowerCase() || ''
      const empId = emp.employee_id?.toLowerCase() || ''
      
      return firstName.includes(query) || 
             lastName.includes(query) || 
             empId.includes(query)
    })
  } catch (err) {
    console.error('🔴 Error filtering employees:', err)
    return []
  }
})

// Display only first 10
const displayEmployees = computed(() => {
  try {
    return filteredEmployees.value.slice(0, 10)
  } catch (err) {
    console.error('🔴 Error displaying employees:', err)
    return []
  }
})

const getInitials = (firstName, lastName) => {
  try {
    const first = firstName?.[0] || ''
    const last = lastName?.[0] || ''
    return (first + last) || '?'
  } catch (err) {
    console.error('🔴 Error getting initials:', err)
    return '?'
  }
}

const fetchEmployees = async () => {
  console.log('🟢 fetchEmployees: START')
  isLoading.value = true
  error.value = null
  
  try {
    console.log('🟡 fetchEmployees: Calling API...')
    
    // Call API directly
    const res = await api.get('/employees')
    console.log('🟢 fetchEmployees: API Response:', res.data)
    
    // Extract employees from response
    let employeeData = []
    
    if (res.data?.data) {
      // Check different possible structures
      if (Array.isArray(res.data.data)) {
        employeeData = res.data.data
      } else if (res.data.data.employees && Array.isArray(res.data.data.employees)) {
        employeeData = res.data.data.employees
      } else {
        console.warn('⚠️ Unexpected data structure:', res.data)
        employeeData = []
      }
    }
    
    employees.value = employeeData
    console.log('🟢 fetchEmployees: Employees loaded:', employees.value.length)
    
  } catch (err) {
    console.error('🔴 fetchEmployees: ERROR:', err)
    console.error('🔴 Error details:', {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status
    })
    
    error.value = err.response?.data?.error?.message || 
                  err.response?.data?.message || 
                  err.message || 
                  'ไม่สามารถโหลดข้อมูลได้'
    
    employees.value = []
  } finally {
    isLoading.value = false
    console.log('🟢 fetchEmployees: COMPLETE')
  }
}

const manualFetch = () => {
  console.log('🔵 Manual Fetch Triggered')
  fetchEmployees()
}

// Error boundary
onErrorCaptured((err, instance, info) => {
  console.error('🔴 Component Error Captured:', err)
  console.error('🔴 Error info:', info)
  console.error('🔴 Instance:', instance)
  
  error.value = `Component error: ${err.message}`
  return false // Prevent error from propagating
})

// Component Mounted
onMounted(() => {
  try {
    console.log('🟣 EmployeesView: onMounted() CALLED')
    console.log('🟣 Current Route:', route.path)
    componentMounted.value = true
    fetchEmployees()
  } catch (err) {
    console.error('🔴 Error in onMounted:', err)
    error.value = `Mount error: ${err.message}`
  }
})

// Watch Route Changes
watch(() => route.name, (newName, oldName) => {
  try {
    console.log('🟡 Route Changed:', oldName, '→', newName)
    if (newName === 'Employees') {
      console.log('🟢 Reloading employees data...')
      fetchEmployees()
    }
  } catch (err) {
    console.error('🔴 Error in route watch:', err)
  }
})

console.log('🔵 EmployeesView: Script Setup Complete')
</script>
