<!-- pages/admin/assignments.vue -->
<template>
  <div>
    <v-card class="mb-4">
      <v-card-title class="text-h5">
        <v-icon class="mr-2">mdi-account-multiple-check</v-icon>
        จัดการมอบหมายงาน (Assignments)
      </v-card-title>
      <v-card-subtitle>มอบหมายกรรมการ ↔ ครู (ตาม period/department), ปรับปรุง/ยกเลิก</v-card-subtitle>
    </v-card>

    <v-card>
      <v-card-text>
        <div class="d-flex justify-space-between align-center mb-4">
          <div class="d-flex gap-2">
            <v-select
              v-model="filterPeriod"
              label="รอบการประเมิน"
              :items="periods"
              item-title="name_th"
              item-value="id"
              density="comfortable"
              hide-details
              clearable
              style="max-width: 300px"
            />
            <v-select
              v-model="filterDept"
              label="แผนก"
              :items="departments"
              item-title="name_th"
              item-value="id"
              density="comfortable"
              hide-details
              clearable
              style="max-width: 200px"
            />
          </div>
          <v-btn color="primary" prepend-icon="mdi-plus" @click="openDialog()">
            มอบหมายงานใหม่
          </v-btn>
        </div>

        <v-data-table
          :headers="headers"
          :items="filteredItems"
          :loading="loading"
          :items-per-page="10"
        >
          <template #item.status="{ item }">
            <v-chip :color="item.status === 'active' ? 'success' : 'error'" size="small">
              {{ item.status === 'active' ? 'Active' : 'Cancelled' }}
            </v-chip>
          </template>
          
          <template #item.actions="{ item }">
            <v-btn size="small" variant="text" icon="mdi-eye" @click="viewDetails(item)" />
            <v-btn 
              v-if="item.status === 'active'"
              size="small" 
              variant="text" 
              icon="mdi-cancel" 
              color="warning" 
              @click="cancelAssignment(item)"
            />
            <v-btn size="small" variant="text" icon="mdi-delete" color="error" @click="confirmDelete(item)" />
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Dialog -->
    <v-dialog v-model="dialog" max-width="600">
      <v-card>
        <v-card-title>มอบหมายงานใหม่</v-card-title>
        <v-card-text>
          <v-select
            v-model="form.period_id"
            label="รอบการประเมิน"
            :items="periods"
            item-title="name_th"
            item-value="id"
            density="comfortable"
            class="mb-2"
          />
          <v-select
            v-model="form.dept_id"
            label="แผนก"
            :items="departments"
            item-title="name_th"
            item-value="id"
            density="comfortable"
            class="mb-2"
          />
          <v-select
            v-model="form.evaluator_id"
            label="กรรมการประเมิน"
            :items="evaluators"
            item-title="name_th"
            item-value="id"
            density="comfortable"
            class="mb-2"
          />
          <v-select
            v-model="form.evaluatee_id"
            label="ครูผู้ถูกประเมิน"
            :items="evaluatees"
            item-title="name_th"
            item-value="id"
            density="comfortable"
            class="mb-2"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="dialog = false">ยกเลิก</v-btn>
          <v-btn color="primary" @click="save">บันทึก</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirm -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title>ยืนยันการลบ</v-card-title>
        <v-card-text>คุณต้องการลบการมอบหมายนี้หรือไม่?</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="deleteDialog = false">ยกเลิก</v-btn>
          <v-btn color="error" @click="deleteItem">ลบ</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- View Details Dialog -->
    <v-dialog v-model="detailsDialog" max-width="600">
      <v-card>
        <v-card-title class="d-flex justify-space-between align-center">
          <span>รายละเอียดการมอบหมาย</span>
          <v-chip :color="selectedDetail?.status === 'active' ? 'success' : 'grey'" size="small">
            {{ selectedDetail?.status || 'pending' }}
          </v-chip>
        </v-card-title>
        <v-card-text>
          <v-list lines="two">
            <v-list-item>
              <template #prepend>
                <v-icon>mdi-calendar</v-icon>
              </template>
              <v-list-item-title>รอบการประเมิน</v-list-item-title>
              <v-list-item-subtitle>{{ selectedDetail?.period_name || '-' }}</v-list-item-subtitle>
            </v-list-item>
            
            <v-list-item>
              <template #prepend>
                <v-icon>mdi-office-building</v-icon>
              </template>
              <v-list-item-title>แผนก</v-list-item-title>
              <v-list-item-subtitle>{{ selectedDetail?.dept_name || '-' }}</v-list-item-subtitle>
            </v-list-item>
            
            <v-list-item>
              <template #prepend>
                <v-icon>mdi-account-check</v-icon>
              </template>
              <v-list-item-title>กรรมการประเมิน</v-list-item-title>
              <v-list-item-subtitle>
                {{ selectedDetail?.evaluator_name || '-' }}
                <span v-if="selectedDetail?.evaluator_email" class="text-caption ml-2">({{ selectedDetail?.evaluator_email }})</span>
              </v-list-item-subtitle>
            </v-list-item>
            
            <v-list-item>
              <template #prepend>
                <v-icon>mdi-account</v-icon>
              </template>
              <v-list-item-title>ครูผู้ถูกประเมิน</v-list-item-title>
              <v-list-item-subtitle>
                {{ selectedDetail?.evaluatee_name || '-' }}
                <span v-if="selectedDetail?.evaluatee_email" class="text-caption ml-2">({{ selectedDetail?.evaluatee_email }})</span>
              </v-list-item-subtitle>
            </v-list-item>
            
            <v-list-item>
              <template #prepend>
                <v-icon>mdi-progress-check</v-icon>
              </template>
              <v-list-item-title>ความคืบหน้า</v-list-item-title>
              <v-list-item-subtitle>
                <v-progress-linear
                  :model-value="selectedDetail?.progress || 0"
                  color="primary"
                  height="10"
                  rounded
                >
                  <template #default="{ value }">
                    <span class="text-caption">{{ Math.ceil(value) }}%</span>
                  </template>
                </v-progress-linear>
              </v-list-item-subtitle>
            </v-list-item>
            
            <v-list-item>
              <template #prepend>
                <v-icon>mdi-clock-outline</v-icon>
              </template>
              <v-list-item-title>วันที่สร้าง</v-list-item-title>
              <v-list-item-subtitle>{{ formatDate(selectedDetail?.created_at) }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="detailsDialog = false">ปิด</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

import { ref, computed, onMounted } from 'vue'
const api = useApi()

const filterPeriod = ref(null)
const filterDept = ref(null)
const loading = ref(false)
const dialog = ref(false)
const deleteDialog = ref(false)
const detailsDialog = ref(false)
const selectedItem = ref(null)
const selectedDetail = ref(null)

const form = ref({
  period_id: null,
  dept_id: null,
  evaluator_id: null,
  evaluatee_id: null
})

const periods = ref([])
const departments = ref([])
const evaluators = ref([])
const evaluatees = ref([])

const headers = [
  { title: 'รอบการประเมิน', key: 'period_name', sortable: true },
  { title: 'แผนก', key: 'dept_name', sortable: true },
  { title: 'กรรมการ', key: 'evaluator_name', sortable: true },
  { title: 'ครูผู้ถูกประเมิน', key: 'evaluatee_name', sortable: true },
  { title: 'สถานะ', key: 'status', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false }
]

const items = ref([])

const filteredItems = computed(() => {
  let result = Array.isArray(items.value) ? items.value : []
  
  if (filterPeriod.value) {
    result = result.filter(item => item.period_id === filterPeriod.value)
  }
  
  if (filterDept.value) {
    result = result.filter(item => item.dept_id === filterDept.value)
  }
  
  return result
})

async function loadData() {
  loading.value = true
  try {
    const [assignmentsRes, periodsRes, deptsRes, usersRes] = await Promise.all([
      api.assignments.list(),
      api.periods.list(),
      api.departments.list(),
      api.users.list()
    ])
    const assignmentsData = assignmentsRes?.data || assignmentsRes?.items || assignmentsRes
    const periodsData = periodsRes?.data || periodsRes?.items || periodsRes
    const deptsData = deptsRes?.data || deptsRes?.items || deptsRes
    const usersData = usersRes?.items || usersRes?.data || usersRes
    
    items.value = Array.isArray(assignmentsData) ? assignmentsData : []
    periods.value = Array.isArray(periodsData) ? periodsData : []
    departments.value = Array.isArray(deptsData) ? deptsData : []
    
    const users = Array.isArray(usersData) ? usersData : []
    evaluators.value = users.filter(u => u.role === 'evaluator')
    evaluatees.value = users.filter(u => u.role === 'evaluatee')
  } catch (err) {
    console.error('Failed to load data:', err)
    items.value = []
    periods.value = []
    departments.value = []
    evaluators.value = []
    evaluatees.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})

function openDialog() {
  form.value = { period_id: null, dept_id: null, evaluator_id: null, evaluatee_id: null }
  dialog.value = true
}

async function save() {
  try {
    await api.assignments.create(form.value)
    await loadData()
    dialog.value = false
  } catch (err) {
    console.error('Failed to save:', err)
    if (err.response?.data?.error === 'DUPLICATE_ASSIGNMENT') {
      alert('การมอบหมายนี้มีอยู่แล้ว')
    } else {
      alert('เกิดข้อผิดพลาดในการบันทึก')
    }
  }
}

function viewDetails(item) {
  selectedDetail.value = item
  detailsDialog.value = true
}

function formatDate(dateString) {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

async function cancelAssignment(item) {
  try {
    await api.assignments.cancel(item.id)
    await loadData()
  } catch (err) {
    console.error('Failed to cancel:', err)
    alert('เกิดข้อผิดพลาด')
  }
}

function confirmDelete(item) {
  selectedItem.value = item
  deleteDialog.value = true
}

async function deleteItem() {
  try {
    await api.assignments.delete(selectedItem.value.id)
    await loadData()
    deleteDialog.value = false
  } catch (err) {
    console.error('Failed to delete:', err)
    alert('เกิดข้อผิดพลาดในการลบ')
  }
}
</script>
