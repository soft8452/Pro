<!-- pages/eval/results.vue -->
<template>
  <div>
    <v-card class="mb-4">
      <v-card-title class="text-h5">
        <v-icon class="mr-2">mdi-file-check-outline</v-icon>
        ประวัติการประเมิน (History)
      </v-card-title>
      <v-card-subtitle>ประวัติการส่ง/แก้คะแนนของฉัน (ตาม period)</v-card-subtitle>
    </v-card>

    <v-card class="mb-4">
      <v-card-text>
        <v-select
          v-model="filterPeriod"
          label="รอบการประเมิน"
          :items="periods"
          item-title="name_th"
          item-value="id"
          density="comfortable"
        />
      </v-card-text>
    </v-card>

    <v-card>
      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="history"
          :loading="loading"
          :items-per-page="10"
        >
          <template #item.submitted_at="{ item }">
            {{ formatDateTime(item.submitted_at) }}
          </template>
          
          <template #item.status="{ item }">
            <v-chip :color="getStatusColor(item.status)" size="small">
              {{ item.status }}
            </v-chip>
          </template>
          
          <template #item.actions="{ item }">
            <v-btn size="small" variant="text" icon="mdi-eye" @click="viewDetails(item)" />
            <v-btn 
              v-if="item.status === 'draft'"
              size="small" 
              variant="text" 
              icon="mdi-pencil" 
              @click="editScore(item)"
            />
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

import { ref } from 'vue'

const router = useRouter()
const loading = ref(false)
const filterPeriod = ref(1)

const periods = ref([
  { id: 1, name_th: 'การประเมินครูประจำปี 2568' }
])

const headers = [
  { title: 'ครูผู้ถูกประเมิน', key: 'evaluatee_name', sortable: true },
  { title: 'แผนก', key: 'dept_name', sortable: true },
  { title: 'วันที่ส่ง', key: 'submitted_at', sortable: true },
  { title: 'สถานะ', key: 'status', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false }
]

const history = ref([
  { 
    id: 1, 
    evaluatee_name: 'ครูไอที 01',
    dept_name: 'เทคโนโลยีสารสนเทศ',
    submitted_at: '2026-02-05 14:30:00',
    status: 'submitted'
  },
  { 
    id: 2, 
    evaluatee_name: 'ครูไอที 02',
    dept_name: 'เทคโนโลยีสารสนเทศ',
    submitted_at: '2026-02-04 10:15:00',
    status: 'submitted'
  },
  { 
    id: 3, 
    evaluatee_name: 'ครูเครื่องกล 01',
    dept_name: 'เครื่องกล',
    submitted_at: null,
    status: 'draft'
  }
])

function formatDateTime(datetime) {
  if (!datetime) return '-'
  return new Date(datetime).toLocaleString('th-TH')
}

function getStatusColor(status) {
  const colors = {
    'submitted': 'success',
    'draft': 'warning',
    'locked': 'info'
  }
  return colors[status] || 'grey'
}

function viewDetails(item) {
  console.log('View details:', item)
}

function editScore(item) {
  router.push(`/eval/scoring?assignment=${item.id}`)
}
</script>
