<!-- pages/admin/topics.vue -->
<template>
  <div>
    <v-card class="mb-4">
      <v-card-title class="text-h5">
        <v-icon class="mr-2">mdi-format-list-bulleted</v-icon>
        จัดการหัวข้อการประเมิน (Evaluation Topics)
      </v-card-title>
      <v-card-subtitle>CRUD หัวข้อ (A5-1..A5-4), กำหนด weight และสถานะ active</v-card-subtitle>
    </v-card>

    <v-card>
      <v-card-text>
        <div class="d-flex justify-space-between align-center mb-4">
          <v-text-field
            v-model="search"
            label="ค้นหา"
            prepend-inner-icon="mdi-magnify"
            density="comfortable"
            hide-details
            clearable
            class="mr-4"
            style="max-width: 400px"
          />
          <v-btn color="primary" prepend-icon="mdi-plus" @click="openDialog()">
            เพิ่มหัวข้อใหม่
          </v-btn>
        </div>

        <v-data-table
          :headers="headers"
          :items="filteredItems"
          :loading="loading"
          :items-per-page="10"
        >
          <template #item.weight="{ item }">
            <v-chip size="small" color="info">{{ item.weight }}</v-chip>
          </template>
          
          <template #item.active="{ item }">
            <v-chip :color="item.active ? 'success' : 'error'" size="small">
              {{ item.active ? 'Active' : 'Inactive' }}
            </v-chip>
          </template>
          
          <template #item.actions="{ item }">
            <v-btn size="small" variant="text" icon="mdi-pencil" @click="openDialog(item)" />
            <v-btn size="small" variant="text" icon="mdi-delete" color="error" @click="confirmDelete(item)" />
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Dialog -->
    <v-dialog v-model="dialog" max-width="600">
      <v-card>
        <v-card-title>{{ editMode ? 'แก้ไขหัวข้อ' : 'เพิ่มหัวข้อใหม่' }}</v-card-title>
        <v-card-text>
          <v-text-field v-model="form.code" label="รหัส" density="comfortable" class="mb-2" />
          <v-text-field v-model="form.title_th" label="ชื่อหัวข้อ" density="comfortable" class="mb-2" />
          <v-textarea v-model="form.description" label="คำอธิบาย" rows="3" density="comfortable" class="mb-2" />
          <v-text-field v-model.number="form.weight" label="น้ำหนัก" type="number" step="0.01" density="comfortable" class="mb-2" />
          <v-switch v-model="form.active" label="Active" color="success" />
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
        <v-card-text>คุณต้องการลบหัวข้อ "{{ selectedItem?.title_th }}" หรือไม่?</v-card-text>
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

import { ref, computed, onMounted } from 'vue'
const api = useApi()

const search = ref('')
const loading = ref(false)
const dialog = ref(false)
const deleteDialog = ref(false)
const editMode = ref(false)
const selectedItem = ref(null)

const form = ref({
  code: '',
  title_th: '',
  description: '',
  weight: 0.00,
  active: true
})

const headers = [
  { title: 'รหัส', key: 'code', sortable: true },
  { title: 'ชื่อหัวข้อ', key: 'title_th', sortable: true },
  { title: 'น้ำหนัก', key: 'weight', sortable: true },
  { title: 'สถานะ', key: 'active', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false }
]

const items = ref([])

const filteredItems = computed(() => {
  const list = Array.isArray(items.value) ? items.value : []
  if (!search.value) return list
  const s = search.value.toLowerCase()
  return list.filter(item => 
    item.code?.toLowerCase().includes(s) || 
    item.title_th?.toLowerCase().includes(s)
  )
})

async function loadData() {
  loading.value = true
  try {
    const res = await api.topics.list()
    const data = res?.data || res
    items.value = Array.isArray(data) ? data : []
  } catch (err) {
    console.error('Failed to load topics:', err)
    items.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})

function openDialog(item = null) {
  if (item) {
    editMode.value = true
    form.value = { ...item }
  } else {
    editMode.value = false
    form.value = { code: '', title_th: '', description: '', weight: 0.00, active: true }
  }
  dialog.value = true
}

async function save() {
  try {
    if (editMode.value) {
      await api.topics.update(form.value.id, form.value)
    } else {
      await api.topics.create(form.value)
    }
    await loadData()
    dialog.value = false
  } catch (err) {
    console.error('Failed to save:', err)
    alert('เกิดข้อผิดพลาดในการบันทึก')
  }
}

function confirmDelete(item) {
  selectedItem.value = item
  deleteDialog.value = true
}

async function deleteItem() {
  try {
    await api.topics.delete(selectedItem.value.id)
    await loadData()
    deleteDialog.value = false
  } catch (err) {
    console.error('Failed to delete:', err)
    alert('เกิดข้อผิดพลาดในการลบ')
  }
}
</script>
