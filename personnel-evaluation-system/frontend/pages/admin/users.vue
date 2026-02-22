<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-account-group</v-icon>
            จัดการผู้ใช้งาน
            <v-spacer />
            <v-text-field
              v-model="search"
              prepend-inner-icon="mdi-magnify"
              label="ค้นหา..."
              single-line
              hide-details
              density="compact"
              class="mr-4"
              style="max-width: 300px"
            />
            <v-btn color="primary" @click="openDialog()">
              <v-icon left>mdi-plus</v-icon>
              เพิ่มผู้ใช้
            </v-btn>
          </v-card-title>

          <v-data-table
            :headers="headers"
            :items="filteredItems"
            :loading="loading"
            class="elevation-1"
          >
            <template #item.role="{ item }">
              <v-chip :color="getRoleColor(item.role)" size="small">
                {{ getRoleText(item.role) }}
              </v-chip>
            </template>

            <template #item.actions="{ item }">
              <v-btn icon size="small" @click="openDialog(item)">
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
              <v-btn icon size="small" color="error" @click="confirmDelete(item)">
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

    <!-- Create/Edit Dialog -->
    <v-dialog v-model="dialog" max-width="600">
      <v-card>
        <v-card-title>{{ editMode ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้ใหม่' }}</v-card-title>
        <v-card-text>
          <v-text-field v-model="form.name_th" label="ชื่อ-สกุล (ไทย)" required />
          <v-text-field v-model="form.email" label="Email" type="email" required />
          <v-text-field 
            v-if="!editMode" 
            v-model="form.password" 
            label="รหัสผ่าน" 
            type="password" 
            required 
          />
          <v-select
            v-model="form.role"
            :items="roles"
            item-title="text"
            item-value="value"
            label="Role"
            required
          />
          <v-select
            v-model="form.dept_id"
            :items="departments"
            item-title="name_th"
            item-value="id"
            label="แผนก"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="dialog = false">ยกเลิก</v-btn>
          <v-btn color="primary" @click="save">บันทึก</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title>ยืนยันการลบ</v-card-title>
        <v-card-text>คุณต้องการลบผู้ใช้ "{{ selectedItem?.name_th }}" หรือไม่?</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="deleteDialog = false">ยกเลิก</v-btn>
          <v-btn color="error" @click="deleteItem">ลบ</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
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
  name_th: '',
  email: '',
  password: '',
  role: 'evaluatee',
  dept_id: null
})

const roles = [
  { value: 'admin', text: 'ผู้ดูแลระบบ' },
  { value: 'evaluator', text: 'กรรมการประเมิน' },
  { value: 'evaluatee', text: 'ผู้ถูกประเมิน' }
]

const headers = [
  { title: 'ชื่อ-สกุล', key: 'name_th', sortable: true },
  { title: 'Email', key: 'email', sortable: true },
  { title: 'Role', key: 'role', sortable: true },
  { title: 'แผนก', key: 'dept_name', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false }
]

const items = ref([])
const departments = ref([])

const filteredItems = computed(() => {
  const list = Array.isArray(items.value) ? items.value : []
  if (!search.value) return list
  const s = search.value.toLowerCase()
  return list.filter(item => 
    item.name_th?.toLowerCase().includes(s) || 
    item.email?.toLowerCase().includes(s)
  )
})

function getRoleColor(role) {
  const colors = { admin: 'error', evaluator: 'warning', evaluatee: 'info' }
  return colors[role] || 'grey'
}

function getRoleText(role) {
  const texts = { admin: 'ผู้ดูแล', evaluator: 'กรรมการ', evaluatee: 'ครู' }
  return texts[role] || role
}

async function loadData() {
  loading.value = true
  try {
    const [usersRes, deptsRes] = await Promise.all([
      api.users.list(),
      api.departments.list()
    ])
    // users API return { items: [...] }, departments return { data: [...] }
    const usersData = usersRes?.items || usersRes?.data || usersRes
    const deptsData = deptsRes?.data || deptsRes?.items || deptsRes
    items.value = Array.isArray(usersData) ? usersData : []
    departments.value = Array.isArray(deptsData) ? deptsData : []
    console.log('[Users] loaded:', items.value.length, 'users,', departments.value.length, 'depts')
  } catch (err) {
    console.error('Failed to load:', err)
    items.value = []
    departments.value = []
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
    form.value = { ...item, password: '' }
  } else {
    editMode.value = false
    form.value = { name_th: '', email: '', password: '', role: 'evaluatee', dept_id: null }
  }
  dialog.value = true
}

async function save() {
  try {
    if (editMode.value) {
      await api.users.update(form.value.id, form.value)
    } else {
      await api.users.create(form.value)
    }
    await loadData()
    dialog.value = false
  } catch (err) {
    console.error('Failed to save:', err)
    alert('เกิดข้อผิดพลาด')
  }
}

function confirmDelete(item) {
  selectedItem.value = item
  deleteDialog.value = true
}

async function deleteItem() {
  try {
    await api.users.delete(selectedItem.value.id)
    await loadData()
    deleteDialog.value = false
  } catch (err) {
    console.error('Failed to delete:', err)
    alert('เกิดข้อผิดพลาด')
  }
}
</script>
