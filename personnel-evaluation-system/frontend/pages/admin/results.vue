<!-- pages/admin/results.vue -->
<template>
  <div>
    <v-card class="mb-4">
      <v-card-title class="text-h5">
        <v-icon class="mr-2">mdi-file-chart-outline</v-icon>
        สรุปผลการประเมิน (Evaluation Results)
      </v-card-title>
      <v-card-subtitle>สรุปผลตามหัวข้อ/ตัวชี้วัด/บุคคล/แผนก, Export CSV/Excel/PDF</v-card-subtitle>
    </v-card>

    <v-card class="mb-4">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="3">
            <v-select
              v-model="filterPeriod"
              label="รอบการประเมิน"
              :items="periods"
              item-title="name_th"
              item-value="id"
              density="comfortable"
            />
          </v-col>
          <v-col cols="12" md="3">
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
          <v-col cols="12" md="3">
            <v-select
              v-model="filterStatus"
              label="สถานะ"
              :items="['draft', 'submitted', 'locked']"
              density="comfortable"
              clearable
            />
          </v-col>
          <v-col cols="12" md="3" class="d-flex align-center gap-2">
            <v-btn color="success" prepend-icon="mdi-file-excel" @click="exportExcel">
              Excel
            </v-btn>
            <v-btn color="error" prepend-icon="mdi-file-pdf-box" @click="exportPDF">
              PDF
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card>
      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="filteredResults"
          :loading="loading"
          :items-per-page="10"
        >
          <template #item.score="{ item }">
            <v-chip 
              :color="item.score >= 3 ? 'success' : item.score >= 2 ? 'warning' : 'error'"
              size="small"
            >
              {{ item.score ? item.score.toFixed(2) : '-' }}
            </v-chip>
          </template>
          
          <template #item.normalized="{ item }">
            {{ item.normalized ? item.normalized.toFixed(2) : '-' }}
          </template>
          
          <template #item.status="{ item }">
            <v-chip 
              :color="item.status === 'submitted' ? 'success' : item.status === 'draft' ? 'warning' : 'info'"
              size="small"
            >
              {{ item.status }}
            </v-chip>
          </template>
          
          <template #item.actions="{ item }">
            <v-btn size="small" variant="text" icon="mdi-eye" @click="viewDetails(item)" />
            <v-btn size="small" variant="text" icon="mdi-pencil" @click="editResult(item)" />
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

import { ref, computed } from 'vue'

const loading = ref(false)
const filterPeriod = ref(1)
const filterDept = ref(null)
const filterStatus = ref(null)

const periods = ref([
  { id: 1, name_th: 'การประเมินครูประจำปี 2568' }
])

const departments = ref([
  { id: 1, name_th: 'เทคโนโลยีสารสนเทศ' },
  { id: 2, name_th: 'เครื่องกล' },
  { id: 3, name_th: 'อิเล็กทรอนิกส์' }
])

const headers = [
  { title: 'ครูผู้ถูกประเมิน', key: 'evaluatee_name', sortable: true },
  { title: 'แผนก', key: 'dept_name', sortable: true },
  { title: 'หัวข้อ', key: 'topic_name', sortable: true },
  { title: 'ตัวชี้วัด', key: 'indicator_name', sortable: true },
  { title: 'คะแนน', key: 'score', sortable: true },
  { title: 'Normalized', key: 'normalized', sortable: true },
  { title: 'สถานะ', key: 'status', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false }
]

const results = ref([
  { 
    id: 1, 
    evaluatee_name: 'ครูไอที 01',
    dept_id: 1,
    dept_name: 'เทคโนโลยีสารสนเทศ',
    topic_name: 'การจัดการเรียนการสอน',
    indicator_name: 'แผนการจัดการเรียนรู้',
    score: 3.5,
    normalized: 0.83,
    status: 'submitted'
  },
  { 
    id: 2, 
    evaluatee_name: 'ครูเครื่องกล 01',
    dept_id: 2,
    dept_name: 'เครื่องกล',
    topic_name: 'การจัดการเรียนการสอน',
    indicator_name: 'สื่อการเรียนรู้',
    score: 3.0,
    normalized: 0.67,
    status: 'submitted'
  },
  { 
    id: 3, 
    evaluatee_name: 'ครูบัญชี 01',
    dept_id: 3,
    dept_name: 'การบัญชี',
    topic_name: 'การบริหารจัดการชั้นเรียน',
    indicator_name: 'แผนภูมิ/กฎ/ตารางเวร',
    score: null,
    normalized: null,
    status: 'draft'
  }
])

const filteredResults = computed(() => {
  let result = results.value
  
  if (filterDept.value) {
    result = result.filter(item => item.dept_id === filterDept.value)
  }
  
  if (filterStatus.value) {
    result = result.filter(item => item.status === filterStatus.value)
  }
  
  return result
})

function viewDetails(item) {
  console.log('View details:', item)
}

function editResult(item) {
  console.log('Edit result:', item)
}

function exportExcel() {
  console.log('Export to Excel')
  alert('Export to Excel - Feature coming soon!')
}

function exportPDF() {
  console.log('Export to PDF')
  alert('Export to PDF - Feature coming soon!')
}
</script>
