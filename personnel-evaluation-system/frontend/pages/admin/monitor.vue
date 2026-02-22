<!-- pages/admin/monitor.vue -->
<template>
  <div>
    <v-card class="mb-4">
      <v-card-title class="text-h5">
        <v-icon class="mr-2">mdi-monitor-dashboard</v-icon>
        ติดตามความคืบหน้า (Monitor)
      </v-card-title>
      <v-card-subtitle>ติดตามสถานะการประเมินและการอัปโหลดหลักฐาน</v-card-subtitle>
    </v-card>

    <v-row class="mb-4">
      <v-col cols="12" md="3">
        <v-card color="primary" dark>
          <v-card-text>
            <div class="text-h3">{{ stats.total }}</div>
            <div>การมอบหมายทั้งหมด</div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="3">
        <v-card color="success" dark>
          <v-card-text>
            <div class="text-h3">{{ stats.completed }}</div>
            <div>เสร็จสมบูรณ์</div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="3">
        <v-card color="warning" dark>
          <v-card-text>
            <div class="text-h3">{{ stats.inProgress }}</div>
            <div>กำลังดำเนินการ</div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="3">
        <v-card color="error" dark>
          <v-card-text>
            <div class="text-h3">{{ stats.notStarted }}</div>
            <div>ยังไม่เริ่ม</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-card class="mb-4">
      <v-card-title>ความคืบหน้าตามแผนก</v-card-title>
      <v-card-text>
        <v-table>
          <thead>
            <tr>
              <th>แผนก</th>
              <th>ส่งแล้ว</th>
              <th>ทั้งหมด</th>
              <th>เปอร์เซ็นต์</th>
              <th>Progress</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="dept in progressByDept" :key="dept.name">
              <td>{{ dept.name }}</td>
              <td>{{ dept.submitted }}</td>
              <td>{{ dept.total }}</td>
              <td>{{ dept.percent }}%</td>
              <td>
                <v-progress-linear
                  :model-value="dept.percent"
                  :color="dept.percent >= 80 ? 'success' : dept.percent >= 50 ? 'warning' : 'error'"
                  height="20"
                >
                  <strong>{{ dept.percent }}%</strong>
                </v-progress-linear>
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>

    <v-card>
      <v-card-title>รายละเอียดการประเมิน</v-card-title>
      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="assignments"
          :loading="loading"
          :items-per-page="10"
        >
          <template #item.progress="{ item }">
            <v-progress-circular
              :model-value="item.progress"
              :color="item.progress >= 80 ? 'success' : item.progress >= 50 ? 'warning' : 'error'"
              size="50"
            >
              {{ item.progress }}%
            </v-progress-circular>
          </template>
          
          <template #item.status="{ item }">
            <v-chip :color="getStatusColor(item.status)" size="small">
              {{ item.status }}
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

import { ref } from 'vue'

const loading = ref(false)

const stats = ref({
  total: 12,
  completed: 5,
  inProgress: 4,
  notStarted: 3
})

const progressByDept = ref([
  { name: 'เทคโนโลยีสารสนเทศ', submitted: 8, total: 10, percent: 80 },
  { name: 'เครื่องกล', submitted: 6, total: 12, percent: 50 },
  { name: 'อิเล็กทรอนิกส์', submitted: 3, total: 8, percent: 37.5 },
  { name: 'การบัญชี', submitted: 5, total: 10, percent: 50 }
])

const headers = [
  { title: 'กรรมการ', key: 'evaluator', sortable: true },
  { title: 'ครูผู้ถูกประเมิน', key: 'evaluatee', sortable: true },
  { title: 'แผนก', key: 'department', sortable: true },
  { title: 'ความคืบหน้า', key: 'progress', sortable: true },
  { title: 'สถานะ', key: 'status', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false }
]

const assignments = ref([
  { id: 1, evaluator: 'กรรมการประเมินไอที', evaluatee: 'ครูไอที 01', department: 'เทคโนโลยีสารสนเทศ', progress: 75, status: 'In Progress' },
  { id: 2, evaluator: 'กรรมการประเมินเครื่องกล', evaluatee: 'ครูเครื่องกล 01', department: 'เครื่องกล', progress: 100, status: 'Completed' },
  { id: 3, evaluator: 'กรรมการประเมินไอที', evaluatee: 'ครูบัญชี 01', department: 'การบัญชี', progress: 0, status: 'Not Started' }
])

function getStatusColor(status) {
  const colors = {
    'Completed': 'success',
    'In Progress': 'warning',
    'Not Started': 'error'
  }
  return colors[status] || 'grey'
}

function viewDetails(item) {
  console.log('View details:', item)
}
</script>
