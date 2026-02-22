<!-- pages/reports/normalized.vue -->
<template>
  <div>
    <v-card class="mb-4">
      <v-card-title class="text-h5">
        <v-icon class="mr-2">mdi-chart-bar</v-icon>
        Normalized /60 Report
      </v-card-title>
      <v-card-subtitle>รายงานคะแนนมาตรฐาน (Normalized Score /60)</v-card-subtitle>
    </v-card>

    <v-card class="mb-4">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="4">
            <v-select
              v-model="filterPeriod"
              label="รอบการประเมิน"
              :items="periods"
              item-title="name_th"
              item-value="id"
              density="comfortable"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-select
              v-model="filterDept"
              label="แผนก"
              :items="departments"
              item-title="name_th"
              item-value="id"
              density="comfortable"
              clearable
            />
          </v-col>
          <v-col cols="12" md="4" class="d-flex align-center gap-2">
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

    <v-card>
      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="normalizedData"
          :loading="loading"
          :items-per-page="10"
        >
          <template #item.topics="{ item }">
            <div v-for="(score, topic) in item.topics" :key="topic" class="my-1">
              <v-chip size="small" class="mr-1">{{ topic }}</v-chip>
              {{ score.toFixed(2) }}
            </div>
          </template>
          
          <template #item.total_score="{ item }">
            <v-chip 
              :color="item.total_score >= 50 ? 'success' : item.total_score >= 40 ? 'warning' : 'error'"
              size="large"
            >
              {{ item.total_score.toFixed(2) }}
            </v-chip>
          </template>
          
          <template #item.grade="{ item }">
            <v-chip :color="getGradeColor(item.grade)" size="small">
              {{ item.grade }}
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

import { ref, onMounted, watch } from 'vue'

const { $axios } = useNuxtApp()

const loading = ref(false)
const filterPeriod = ref(null)
const filterDept = ref(null)

const periods = ref([])
const departments = ref([])

const headers = [
  { title: 'ชื่อ-นามสกุล', key: 'name', sortable: true },
  { title: 'แผนก', key: 'department', sortable: true },
  { title: 'คะแนนตามหัวข้อ', key: 'topics', sortable: false },
  { title: 'คะแนนรวม /60', key: 'total_score', sortable: true },
  { title: 'ระดับ', key: 'grade', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false }
]

const normalizedData = ref([])

function getGradeColor(grade) {
  const colors = {
    'ดีเยี่ยม': 'purple',
    'ดีมาก': 'success',
    'ดี': 'info',
    'พอใช้': 'warning',
    'ปรับปรุง': 'error'
  }
  return colors[grade] || 'grey'
}

function getGrade(score) {
  if (score >= 54) return 'ดีเยี่ยม'
  if (score >= 48) return 'ดีมาก'
  if (score >= 36) return 'ดี'
  if (score >= 24) return 'พอใช้'
  return 'ปรับปรุง'
}

async function loadDropdowns() {
  try {
    const [periodsRes, deptsRes] = await Promise.all([
      $axios.get('/api/periods'),
      $axios.get('/api/departments')
    ])
    periods.value = periodsRes.data?.data || periodsRes.data || []
    departments.value = deptsRes.data?.data || deptsRes.data || []
    
    // Select active period
    const active = periods.value.find(p => p.is_active)
    if (active) filterPeriod.value = active.id
    else if (periods.value.length) filterPeriod.value = periods.value[0].id
  } catch (err) {
    console.error('Failed to load dropdowns:', err)
  }
}

async function loadData() {
  if (!filterPeriod.value) return
  
  loading.value = true
  try {
    const params = { period_id: filterPeriod.value }
    if (filterDept.value) params.department_id = filterDept.value
    
    // Use task3 API for normalized report
    const res = await $axios.get('/api/task3/reports/normalized', { params })
    const data = res.data?.data || res.data || []
    
    // Transform data for display
    normalizedData.value = Array.isArray(data) ? data.map(item => ({
      id: item.id || item.user_id,
      name: item.name_th || item.evaluatee_name || item.name,
      department: item.department_name || item.department,
      topics: item.topics || {},
      total_score: item.normalized_score || item.total_score || 0,
      grade: item.grade || getGrade(item.normalized_score || item.total_score || 0)
    })) : []
  } catch (err) {
    console.error('Failed to load normalized data:', err)
    normalizedData.value = []
  } finally {
    loading.value = false
  }
}

function viewDetails(item) {
  console.log('View details:', item)
}

function exportExcel() {
  // Simple CSV export
  const headers = ['ชื่อ-นามสกุล', 'แผนก', 'คะแนนรวม', 'ระดับ']
  const rows = normalizedData.value.map(item => [
    item.name,
    item.department,
    item.total_score,
    item.grade
  ])
  
  const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'normalized_scores.csv'
  a.click()
}

watch([filterPeriod, filterDept], () => {
  loadData()
})

onMounted(async () => {
  await loadDropdowns()
  if (filterPeriod.value) loadData()
})
</script>
