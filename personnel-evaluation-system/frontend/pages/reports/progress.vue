<!-- pages/reports/progress.vue -->
<template>
  <div>
    <v-card class="mb-4">
      <v-card-title class="text-h5">
        <v-icon class="mr-2">mdi-progress-check</v-icon>
        Progress Report
      </v-card-title>
      <v-card-subtitle>ความคืบหน้าการประเมินตามแผนก (% = submitted/total * 100)</v-card-subtitle>
    </v-card>

    <v-card class="mb-4">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <v-select
              v-model="filterPeriod"
              label="รอบการประเมิน"
              :items="periods"
              item-title="name_th"
              item-value="id"
              density="comfortable"
            />
          </v-col>
          <v-col cols="12" md="6" class="d-flex align-center gap-2">
            <v-btn color="primary" prepend-icon="mdi-refresh" @click="loadData">
              โหลดข้อมูล
            </v-btn>
            <v-btn color="success" prepend-icon="mdi-file-excel" @click="exportExcel">
              Excel
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-row class="mb-4">
      <v-col cols="12" md="3">
        <v-card color="primary" dark>
          <v-card-text>
            <div class="text-h3">{{ summary.total }}</div>
            <div>การมอบหมายทั้งหมด</div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="3">
        <v-card color="success" dark>
          <v-card-text>
            <div class="text-h3">{{ summary.submitted }}</div>
            <div>ส่งแล้ว</div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="3">
        <v-card color="warning" dark>
          <v-card-text>
            <div class="text-h3">{{ summary.draft }}</div>
            <div>แบบร่าง</div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="3">
        <v-card color="info" dark>
          <v-card-text>
            <div class="text-h3">{{ summary.percent }}%</div>
            <div>เสร็จสมบูรณ์</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-card>
      <v-card-title>ความคืบหน้าตามแผนก</v-card-title>
      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="progressData"
          :loading="loading"
          :items-per-page="10"
        >
          <template #item.progress="{ item }">
            <v-progress-linear
              :model-value="item.percent"
              :color="item.percent >= 80 ? 'success' : item.percent >= 50 ? 'warning' : 'error'"
              height="25"
            >
              <strong>{{ item.percent }}%</strong>
            </v-progress-linear>
          </template>
          
          <template #item.status="{ item }">
            <v-chip 
              :color="item.percent >= 80 ? 'success' : item.percent >= 50 ? 'warning' : 'error'"
              size="small"
            >
              {{ item.percent >= 80 ? 'ดีมาก' : item.percent >= 50 ? 'ปานกลาง' : 'ต้องเร่ง' }}
            </v-chip>
          </template>
          
          <template #item.actions="{ item }">
            <v-btn size="small" variant="text" icon="mdi-eye" @click="viewDetails(item)" />
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

import { ref, computed, onMounted, watch } from 'vue'

const { $axios } = useNuxtApp()

const loading = ref(false)
const filterPeriod = ref(null)

const periods = ref([])

const headers = [
  { title: 'แผนก', key: 'department', sortable: true },
  { title: 'ส่งแล้ว', key: 'submitted', sortable: true },
  { title: 'ทั้งหมด', key: 'total', sortable: true },
  { title: 'เปอร์เซ็นต์', key: 'percent', sortable: true },
  { title: 'ความคืบหน้า', key: 'progress', sortable: false },
  { title: 'สถานะ', key: 'status', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false }
]

const progressData = ref([])

const summary = computed(() => {
  const total = progressData.value.reduce((sum, item) => sum + (item.total || 0), 0)
  const submitted = progressData.value.reduce((sum, item) => sum + (item.submitted || 0), 0)
  const draft = total - submitted
  const percent = total > 0 ? Math.round((submitted / total) * 100) : 0
  
  return { total, submitted, draft, percent }
})

async function loadPeriods() {
  try {
    const res = await $axios.get('/api/periods')
    periods.value = res.data?.data || res.data || []
    
    // Select active period
    const active = periods.value.find(p => p.is_active)
    if (active) filterPeriod.value = active.id
    else if (periods.value.length) filterPeriod.value = periods.value[0].id
  } catch (err) {
    console.error('Failed to load periods:', err)
  }
}

async function loadData() {
  if (!filterPeriod.value) return
  
  loading.value = true
  try {
    // Use task5 API for progress by department
    const res = await $axios.get('/api/task5/reports/progress', {
      params: { period_id: filterPeriod.value }
    })
    const data = res.data?.data || res.data || []
    
    // Transform data for display
    progressData.value = Array.isArray(data) ? data.map(item => ({
      id: item.id || item.department_id,
      department: item.department_name || item.name_th || item.department,
      submitted: item.submitted || item.completed || 0,
      total: item.total || item.total_assignments || 0,
      percent: item.percent || item.progress || 
        (item.total > 0 ? Math.round((item.submitted / item.total) * 100) : 0)
    })) : []
  } catch (err) {
    console.error('Failed to load progress data:', err)
    progressData.value = []
  } finally {
    loading.value = false
  }
}

watch(filterPeriod, () => {
  loadData()
})

onMounted(async () => {
  await loadPeriods()
  if (filterPeriod.value) loadData()
})

function viewDetails(item) {
  console.log('View details:', item)
}

function exportExcel() {
  // Simple CSV export
  const headers = ['แผนก', 'ส่งแล้ว', 'ทั้งหมด', 'เปอร์เซ็นต์']
  const rows = progressData.value.map(item => [
    item.department,
    item.submitted,
    item.total,
    item.percent + '%'
  ])
  
  const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'progress_report.csv'
  a.click()
}
</script>
