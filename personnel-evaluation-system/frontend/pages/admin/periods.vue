<!-- pages/admin/periods.vue -->
<template>
  <div>
    <v-card class="mb-4">
      <v-card-title class="text-h5">
        <v-icon class="mr-2">mdi-calendar-range</v-icon>
        จัดการรอบการประเมิน (Evaluation Periods)
      </v-card-title>
      <v-card-subtitle>CRUD รอบ (ชื่อ/วันเริ่ม–สิ้นสุด/active), ยกเลิกรอบ</v-card-subtitle>
    </v-card>

    <v-card>
      <v-card-text>
        <div class="d-flex justify-end mb-4">
          <v-btn color="primary" prepend-icon="mdi-plus" @click="openDialog()">
            เพิ่มรอบการประเมิน
          </v-btn>
        </div>

        <v-data-table
          :headers="headers"
          :items="items"
          :loading="loading"
          :items-per-page="10"
        >
          <template #item.dates="{ item }">
            {{ formatDate(item.start_date) }} - {{ formatDate(item.end_date) }}
          </template>
          
          <template #item.is_active="{ item }">
            <v-chip :color="item.is_active ? 'success' : 'error'" size="small">
              {{ item.is_active ? 'Active' : 'Closed' }}
            </v-chip>
          </template>
          
          <template #item.actions="{ item }">
            <v-btn size="small" variant="text" icon="mdi-pencil" @click="openDialog(item)" />
            <v-btn 
              v-if="item.is_active"
              size="small" 
              variant="text" 
              icon="mdi-lock" 
              color="warning" 
              @click="toggleActive(item)"
              title="ปิดรอบ"
            />
            <v-btn 
              v-else
              size="small" 
              variant="text" 
              icon="mdi-lock-open" 
              color="success" 
              @click="toggleActive(item)"
              title="เปิดรอบ"
            />
            <v-btn size="small" variant="text" icon="mdi-delete" color="error" @click="confirmDelete(item)" />
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Dialog -->
    <v-dialog v-model="dialog" max-width="600">
      <v-card>
        <v-card-title>{{ editMode ? 'แก้ไขรอบการประเมิน' : 'เพิ่มรอบการประเมิน' }}</v-card-title>
        <v-card-text>
          <v-text-field v-model="form.code" label="รหัสรอบ" density="comfortable" class="mb-2" />
          <v-text-field v-model="form.name_th" label="ชื่อรอบการประเมิน" density="comfortable" class="mb-2" />
          <v-text-field 
            v-model.number="form.buddhist_year" 
            label="ปีพุทธศักราช" 
            type="number" 
            density="comfortable" 
            class="mb-2" 
          />
          <v-text-field
            v-model="form.start_date"
            label="วันที่เริ่มต้น"
            type="date"
            density="comfortable"
            class="mb-2"
          />
          <v-text-field
            v-model="form.end_date"
            label="วันที่สิ้นสุด"
            type="date"
            density="comfortable"
            class="mb-2"
          />
          <v-switch v-model="form.is_active" label="Active" color="success" />
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
        <v-card-text>คุณต้องการลบรอบการประเมิน "{{ selectedItem?.name_th }}" หรือไม่?</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="deleteDialog = false">ยกเลิก</v-btn>
          <v-btn color="error" @click="deleteItem">ลบ</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

import { ref, onMounted } from 'vue'
const api = useApi()

const loading = ref(false)
const dialog = ref(false)
const deleteDialog = ref(false)
const editMode = ref(false)
const selectedItem = ref(null)

const form = ref({
  code: '',
  name_th: '',
  buddhist_year: 2568,
  start_date: '',
  end_date: '',
  is_active: true
})

const headers = [
  { title: 'รหัส', key: 'code', sortable: true },
  { title: 'ชื่อรอบ', key: 'name_th', sortable: true },
  { title: 'ปี พ.ศ.', key: 'buddhist_year', sortable: true },
  { title: 'ช่วงเวลา', key: 'dates', sortable: false },
  { title: 'สถานะ', key: 'is_active', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false }
]

const items = ref([])

async function loadData() {
  loading.value = true
  try {
    const res = await api.periods.list()
    const data = res?.data || res
    items.value = Array.isArray(data) ? data : []
  } catch (err) {
    console.error('Failed to load periods:', err)
    items.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})

function formatDate(date) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('th-TH')
}

function openDialog(item = null) {
  if (item) {
    editMode.value = true
    form.value = { ...item }
  } else {
    editMode.value = false
    form.value = { code: '', name_th: '', buddhist_year: 2568, start_date: '', end_date: '', is_active: true }
  }
  dialog.value = true
}

async function save() {
  try {
    if (editMode.value) {
      await api.periods.update(form.value.id, form.value)
    } else {
      await api.periods.create(form.value)
    }
    await loadData()
    dialog.value = false
  } catch (err) {
    console.error('Failed to save:', err)
    alert('เกิดข้อผิดพลาดในการบันทึก')
  }
}

async function toggleActive(item) {
  try {
    await api.periods.toggle(item.id)
    await loadData()
  } catch (err) {
    console.error('Failed to toggle:', err)
    alert('เกิดข้อผิดพลาดในการเปลี่ยนสถานะ')
  }
}

function confirmDelete(item) {
  selectedItem.value = item
  deleteDialog.value = true
}

async function deleteItem() {
  try {
    await api.periods.delete(selectedItem.value.id)
    await loadData()
    deleteDialog.value = false
  } catch (err) {
    console.error('Failed to delete:', err)
    alert('เกิดข้อผิดพลาดในการลบ')
  }
}
</script>
