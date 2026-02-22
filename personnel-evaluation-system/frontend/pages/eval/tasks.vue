<!-- pages/eval/tasks.vue -->
<template>
  <div>
    <v-card class="mb-4">
      <v-card-title class="text-h5">
        <v-icon class="mr-2">mdi-clipboard-check-outline</v-icon>
        งานที่ต้องประเมิน (Assigned Tasks)
      </v-card-title>
      <v-card-subtitle>รายการครูที่ต้องประเมิน (filter by period/department/status)</v-card-subtitle>
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
          <v-col cols="12" md="4">
            <v-select
              v-model="filterStatus"
              label="สถานะ"
              :items="statusItems"
              density="comfortable"
              clearable
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card>
      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="filteredTasks"
          :loading="loading"
          :items-per-page="10"
        >
          <template #item.progress="{ item }">
            <v-progress-linear
              :model-value="item.progress"
              :color="item.progress >= 80 ? 'success' : item.progress >= 50 ? 'warning' : 'error'"
              height="25"
            >
              <strong>{{ item.progress }}%</strong>
            </v-progress-linear>
          </template>
          
          <template #item.status="{ item }">
            <v-chip :color="getStatusColor(item.status)" size="small">
              {{ item.status }}
            </v-chip>
          </template>
          
          <template #item.actions="{ item }">
            <v-btn 
              size="small" 
              color="primary" 
              variant="tonal"
              @click="goToScoring(item)"
            >
              ให้คะแนน
            </v-btn>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

import { ref, computed } from 'vue'

const router = useRouter()
const loading = ref(false)
const filterPeriod = ref(1)
const filterDept = ref(null)
const filterStatus = ref(null)

const periods = ref([
  { id: 1, name_th: 'การประเมินครูประจำปี 2568' }
])

const departments = ref([
  { id: 1, name_th: 'เทคโนโลยีสารสนเทศ' },
  { id: 2, name_th: 'เครื่องกล' }
])

const statusItems = ['draft', 'submitted', 'locked']

const headers = [
  { title: 'ครูผู้ถูกประเมิน', key: 'evaluatee_name', sortable: true },
  { title: 'แผนก', key: 'dept_name', sortable: true },
  { title: 'ความคืบหน้า', key: 'progress', sortable: true },
  { title: 'สถานะ', key: 'status', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false }
]

const tasks = ref([
  { 
    id: 1,
    assignment_id: 1,
    evaluatee_name: 'ครูไอที 01',
    dept_id: 1,
    dept_name: 'เทคโนโลยีสารสนเทศ',
    progress: 65,
    status: 'draft'
  },
  { 
    id: 2,
    assignment_id: 2,
    evaluatee_name: 'ครูไอที 02',
    dept_id: 1,
    dept_name: 'เทคโนโลยีสารสนเทศ',
    progress: 100,
    status: 'submitted'
  },
  { 
    id: 3,
    assignment_id: 3,
    evaluatee_name: 'ครูเครื่องกล 01',
    dept_id: 2,
    dept_name: 'เครื่องกล',
    progress: 0,
    status: 'draft'
  }
])

const filteredTasks = computed(() => {
  let result = tasks.value
  
  if (filterDept.value) {
    result = result.filter(item => item.dept_id === filterDept.value)
  }
  
  if (filterStatus.value) {
    result = result.filter(item => item.status === filterStatus.value)
  }
  
  return result
})

function getStatusColor(status) {
  const colors = {
    'submitted': 'success',
    'draft': 'warning',
    'locked': 'info'
  }
  return colors[status] || 'grey'
}

function goToScoring(item) {
  router.push(`/eval/scoring?assignment=${item.assignment_id}`)
}
</script>
