<!-- pages/evaluator/assignments.vue -->
<!-- รายการครูที่ต้องประเมิน (Evaluator's Assigned Tasks) -->
<template>
  <div>
    <v-card class="mb-4">
      <v-card-title class="text-h5">
        <v-icon class="mr-2">mdi-clipboard-check-outline</v-icon>
        งานที่ต้องประเมิน
      </v-card-title>
      <v-card-subtitle>รายการครูที่ได้รับมอบหมายให้ประเมิน (filter by period/department/status)</v-card-subtitle>
    </v-card>

    <!-- Filters -->
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
              clearable
              @update:modelValue="loadAssignments"
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
              @update:modelValue="loadAssignments"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-select
              v-model="filterStatus"
              label="สถานะ"
              :items="statusItems"
              item-title="title"
              item-value="value"
              density="comfortable"
              clearable
              @update:modelValue="loadAssignments"
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Assignments Table -->
    <v-card>
      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="assignments"
          :loading="loading"
          :items-per-page="10"
        >
          <template #item.evaluatee="{ item }">
            <div class="font-weight-medium">{{ item.evaluatee_name }}</div>
            <div class="text-caption text-grey">{{ item.department_name }}</div>
          </template>

          <template #item.progress="{ item }">
            <v-progress-linear
              :model-value="item.progress || 0"
              :color="getProgressColor(item.progress)"
              height="25"
              rounded
            >
              <strong>{{ item.progress || 0 }}%</strong>
            </v-progress-linear>
          </template>
          
          <template #item.status="{ item }">
            <v-chip :color="getStatusColor(item.status)" size="small">
              {{ getStatusText(item.status) }}
            </v-chip>
          </template>
          
          <template #item.actions="{ item }">
            <v-btn 
              size="small" 
              color="primary" 
              variant="tonal"
              :to="`/evaluator/assignments/${item.id}`"
            >
              <v-icon left>mdi-lead-pencil</v-icon>
              ให้คะแนน
            </v-btn>
          </template>

          <template #no-data>
            <div class="text-center pa-8">
              <v-icon size="64" color="grey">mdi-clipboard-text-off-outline</v-icon>
              <p class="text-grey mt-2">ไม่พบงานที่ต้องประเมิน</p>
            </div>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
definePageMeta({ middleware: 'auth' })

import { ref, onMounted } from 'vue'

const { $axios } = useNuxtApp()

const loading = ref(false)
const assignments = ref([])
const periods = ref([])
const departments = ref([])

const filterPeriod = ref(null)
const filterDept = ref(null)
const filterStatus = ref(null)

const statusItems = [
  { title: 'ทั้งหมด', value: null },
  { title: 'รอประเมิน', value: 'pending' },
  { title: 'กำลังดำเนินการ', value: 'in_progress' },
  { title: 'เสร็จสิ้น', value: 'completed' }
]

const headers = [
  { title: 'ครูผู้ถูกประเมิน', key: 'evaluatee', sortable: true },
  { title: 'รอบการประเมิน', key: 'period_name', sortable: true },
  { title: 'ความคืบหน้า', key: 'progress', width: '200px' },
  { title: 'สถานะ', key: 'status', width: '120px' },
  { title: 'จัดการ', key: 'actions', sortable: false, width: '150px' }
]

function getProgressColor(progress) {
  if (progress >= 80) return 'success'
  if (progress >= 50) return 'warning'
  return 'error'
}

function getStatusColor(status) {
  const colors = {
    pending: 'warning',
    in_progress: 'info',
    completed: 'success',
    submitted: 'primary'
  }
  return colors[status] || 'grey'
}

function getStatusText(status) {
  const texts = {
    pending: 'รอประเมิน',
    in_progress: 'กำลังดำเนินการ',
    completed: 'เสร็จสิ้น',
    submitted: 'ส่งแล้ว'
  }
  return texts[status] || status
}

async function loadDropdowns() {
  try {
    const [periodsRes, deptsRes] = await Promise.all([
      $axios.get('/api/periods'),
      $axios.get('/api/departments')
    ])
    periods.value = periodsRes.data?.data || periodsRes.data || []
    departments.value = deptsRes.data?.data || deptsRes.data || []
  } catch (err) {
    console.error('Failed to load dropdowns:', err)
  }
}

async function loadAssignments() {
  loading.value = true
  try {
    const params = {}
    if (filterPeriod.value) params.period_id = filterPeriod.value
    if (filterDept.value) params.department_id = filterDept.value
    if (filterStatus.value) params.status = filterStatus.value

    // Get my assignments (as evaluator)
    const res = await $axios.get('/api/assignments/my-tasks', { params })
    assignments.value = res.data?.data || res.data || []
  } catch (err) {
    console.error('Failed to load assignments:', err)
    assignments.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadDropdowns()
  loadAssignments()
})
</script>
