<!-- pages/evaluator/history.vue -->
<!-- ประวัติการประเมินที่ส่งแล้ว -->
<template>
  <div>
    <v-card class="mb-4">
      <v-card-title class="text-h5">
        <v-icon class="mr-2">mdi-history</v-icon>
        ประวัติการประเมิน
      </v-card-title>
      <v-card-subtitle>รายการประเมินที่ส่งแล้ว</v-card-subtitle>
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
              @update:modelValue="loadHistory"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="search"
              label="ค้นหาชื่อครู"
              prepend-inner-icon="mdi-magnify"
              density="comfortable"
              clearable
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-select
              v-model="filterYear"
              label="ปีงบประมาณ"
              :items="years"
              density="comfortable"
              clearable
              @update:modelValue="loadHistory"
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- History Table -->
    <v-card>
      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="filteredHistory"
          :loading="loading"
          :items-per-page="10"
        >
          <template #item.evaluatee="{ item }">
            <div class="font-weight-medium">{{ item.evaluatee_name }}</div>
            <div class="text-caption text-grey">{{ item.department_name }}</div>
          </template>

          <template #item.submitted_at="{ item }">
            {{ formatDate(item.submitted_at) }}
          </template>

          <template #item.total_score="{ item }">
            <v-chip :color="getScoreColor(item.total_score)" size="small">
              {{ item.total_score?.toFixed(2) || '-' }}
            </v-chip>
          </template>

          <template #item.status="{ item }">
            <v-chip color="success" size="small">
              <v-icon size="small" left>mdi-check</v-icon>
              ส่งแล้ว
            </v-chip>
          </template>

          <template #item.actions="{ item }">
            <v-btn 
              size="small" 
              variant="text" 
              icon="mdi-eye"
              @click="viewDetails(item)"
            />
            <v-btn 
              size="small" 
              variant="text" 
              icon="mdi-printer"
              @click="printReport(item)"
            />
          </template>

          <template #no-data>
            <div class="text-center pa-8">
              <v-icon size="64" color="grey">mdi-history</v-icon>
              <p class="text-grey mt-2">ไม่พบประวัติการประเมิน</p>
            </div>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Detail Dialog -->
    <v-dialog v-model="detailDialog" max-width="800">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-file-document-outline</v-icon>
          รายละเอียดการประเมิน
          <v-spacer />
          <v-btn icon variant="text" @click="detailDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-divider />
        <v-card-text v-if="selectedItem">
          <v-row class="mb-4">
            <v-col cols="6">
              <div class="text-subtitle-2 text-grey">ครูผู้ถูกประเมิน</div>
              <div class="text-h6">{{ selectedItem.evaluatee_name }}</div>
            </v-col>
            <v-col cols="6">
              <div class="text-subtitle-2 text-grey">รอบการประเมิน</div>
              <div class="text-h6">{{ selectedItem.period_name }}</div>
            </v-col>
            <v-col cols="6">
              <div class="text-subtitle-2 text-grey">วันที่ส่ง</div>
              <div>{{ formatDate(selectedItem.submitted_at) }}</div>
            </v-col>
            <v-col cols="6">
              <div class="text-subtitle-2 text-grey">คะแนนรวม</div>
              <v-chip :color="getScoreColor(selectedItem.total_score)" size="large">
                {{ selectedItem.total_score?.toFixed(2) || '-' }} / 4.00
              </v-chip>
            </v-col>
          </v-row>

          <v-divider class="my-4" />

          <div class="text-subtitle-1 font-weight-medium mb-3">คะแนนรายตัวชี้วัด</div>
          <v-table density="compact">
            <thead>
              <tr>
                <th>ตัวชี้วัด</th>
                <th class="text-center">คะแนน</th>
                <th>หมายเหตุ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="score in selectedItem.scores" :key="score.indicator_id">
                <td>{{ score.indicator_name }}</td>
                <td class="text-center">
                  <v-chip size="small" :color="getScoreColor(score.score)">
                    {{ score.score?.toFixed(1) || '-' }}
                  </v-chip>
                </td>
                <td class="text-caption">{{ score.notes || '-' }}</td>
              </tr>
            </tbody>
          </v-table>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
definePageMeta({ middleware: 'auth' })

import { ref, computed, onMounted } from 'vue'

const { $axios } = useNuxtApp()

const loading = ref(false)
const history = ref([])
const periods = ref([])

const filterPeriod = ref(null)
const filterYear = ref(null)
const search = ref('')
const detailDialog = ref(false)
const selectedItem = ref(null)

const currentYear = new Date().getFullYear() + 543
const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

const headers = [
  { title: 'ครูผู้ถูกประเมิน', key: 'evaluatee', sortable: true },
  { title: 'รอบการประเมิน', key: 'period_name', sortable: true },
  { title: 'วันที่ส่ง', key: 'submitted_at', sortable: true },
  { title: 'คะแนนรวม', key: 'total_score', sortable: true },
  { title: 'สถานะ', key: 'status', width: '120px' },
  { title: 'จัดการ', key: 'actions', sortable: false, width: '100px' }
]

const filteredHistory = computed(() => {
  if (!search.value) return history.value
  const s = search.value.toLowerCase()
  return history.value.filter(item => 
    item.evaluatee_name?.toLowerCase().includes(s) ||
    item.department_name?.toLowerCase().includes(s)
  )
})

function getScoreColor(score) {
  if (score >= 3.5) return 'success'
  if (score >= 2.5) return 'info'
  if (score >= 1.5) return 'warning'
  return 'error'
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

async function loadDropdowns() {
  try {
    const res = await $axios.get('/api/periods')
    periods.value = res.data?.data || res.data || []
  } catch (err) {
    console.error('Failed to load periods:', err)
  }
}

async function loadHistory() {
  loading.value = true
  try {
    const params = { status: 'submitted' }
    if (filterPeriod.value) params.period_id = filterPeriod.value
    if (filterYear.value) params.buddhist_year = filterYear.value

    const res = await $axios.get('/api/assignments/my-tasks', { params })
    history.value = res.data?.data || res.data || []
  } catch (err) {
    console.error('Failed to load history:', err)
    history.value = []
  } finally {
    loading.value = false
  }
}

async function viewDetails(item) {
  selectedItem.value = item
  
  // Load scores for this assignment using evaluatee_id, evaluator_id, period_id
  try {
    const res = await $axios.get('/api/results', {
      params: { 
        evaluatee_id: item.evaluatee_id,
        evaluator_id: item.evaluator_id,
        period_id: item.period_id
      }
    })
    selectedItem.value.scores = res.data?.data || res.data || []
  } catch (err) {
    console.error('Failed to load scores:', err)
    selectedItem.value.scores = []
  }
  
  detailDialog.value = true
}

function printReport(item) {
  window.open(`/reports/normalized?assignment_id=${item.id}`, '_blank')
}

onMounted(() => {
  loadDropdowns()
  loadHistory()
})
</script>
