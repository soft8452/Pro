<!-- pages/admin/indicators.vue -->
<template>
  <div>
    <v-card class="mb-4">
      <v-card-title class="text-h5">
        <v-icon class="mr-2">mdi-chart-box-outline</v-icon>
        จัดการตัวชี้วัด (Indicators)
      </v-card-title>
      <v-card-subtitle>CRUD ตัวชี้วัด ต่อ Topic, กำหนด type (score_1_4/yes_no), ช่วงคะแนน, น้ำหนัก และผูกชนิดหลักฐาน</v-card-subtitle>
    </v-card>

    <v-card>
      <v-card-text>
        <div class="d-flex justify-space-between align-center mb-4">
          <div class="d-flex gap-2">
            <v-text-field
              v-model="search"
              label="ค้นหา"
              prepend-inner-icon="mdi-magnify"
              density="comfortable"
              hide-details
              clearable
              style="max-width: 300px"
            />
            <v-select
              v-model="filterTopic"
              label="กรองตามหัวข้อ"
              :items="topics"
              item-title="title_th"
              item-value="id"
              density="comfortable"
              hide-details
              clearable
              style="max-width: 250px"
            />
          </div>
          <v-btn color="primary" prepend-icon="mdi-plus" @click="openDialog()">
            เพิ่มตัวชี้วัด
          </v-btn>
        </div>

        <v-data-table
          :headers="headers"
          :items="filteredItems"
          :loading="loading"
          :items-per-page="10"
        >
          <template #item.type="{ item }">
            <v-chip :color="item.type === 'score_1_4' ? 'primary' : 'success'" size="small">
              {{ item.type === 'score_1_4' ? 'คะแนน 1-4' : 'ใช่/ไม่ใช่' }}
            </v-chip>
          </template>
          
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
    <v-dialog v-model="dialog" max-width="700">
      <v-card>
        <v-card-title>{{ editMode ? 'แก้ไขตัวชี้วัด' : 'เพิ่มตัวชี้วัด' }}</v-card-title>
        <v-card-text>
          <v-select
            v-model="form.topic_id"
            label="หัวข้อประเมิน"
            :items="topics"
            item-title="title_th"
            item-value="id"
            density="comfortable"
            class="mb-2"
          />
          <v-text-field v-model="form.code" label="รหัส" density="comfortable" class="mb-2" />
          <v-text-field v-model="form.name_th" label="ชื่อตัวชี้วัด" density="comfortable" class="mb-2" />
          <v-textarea v-model="form.description" label="คำอธิบาย" rows="2" density="comfortable" class="mb-2" />
          <v-select
            v-model="form.type"
            label="ประเภท"
            :items="['score_1_4', 'yes_no']"
            density="comfortable"
            class="mb-2"
          />
          <v-row>
            <v-col cols="6">
              <v-text-field v-model.number="form.weight" label="น้ำหนัก" type="number" step="0.01" density="comfortable" />
            </v-col>
            <v-col cols="3">
              <v-text-field v-model.number="form.min_score" label="คะแนนต่ำสุด" type="number" density="comfortable" />
            </v-col>
            <v-col cols="3">
              <v-text-field v-model.number="form.max_score" label="คะแนนสูงสุด" type="number" density="comfortable" />
            </v-col>
          </v-row>
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
        <v-card-text>คุณต้องการลบตัวชี้วัด "{{ selectedItem?.name_th }}" หรือไม่?</v-card-text>
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
const filterTopic = ref(null)
const loading = ref(false)
const dialog = ref(false)
const deleteDialog = ref(false)
const editMode = ref(false)
const selectedItem = ref(null)

const form = ref({
  topic_id: null,
  code: '',
  name_th: '',
  description: '',
  type: 'score_1_4',
  weight: 1.00,
  min_score: 1,
  max_score: 4,
  active: true
})

const topics = ref([])

const headers = [
  { title: 'รหัส', key: 'code', sortable: true },
  { title: 'ชื่อตัวชี้วัด', key: 'name_th', sortable: true },
  { title: 'หัวข้อ', key: 'topic_name', sortable: true },
  { title: 'ประเภท', key: 'type', sortable: true },
  { title: 'น้ำหนัก', key: 'weight', sortable: true },
  { title: 'สถานะ', key: 'active', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false }
]

const items = ref([])

const filteredItems = computed(() => {
  let result = Array.isArray(items.value) ? items.value : []
  
  if (filterTopic.value) {
    result = result.filter(item => item.topic_id === filterTopic.value)
  }
  
  if (search.value) {
    const s = search.value.toLowerCase()
    result = result.filter(item => 
      item.code?.toLowerCase().includes(s) || 
      item.name_th?.toLowerCase().includes(s)
    )
  }
  
  return result
})

async function loadData() {
  loading.value = true
  try {
    const [indicatorsRes, topicsRes] = await Promise.all([
      api.indicators.list(),
      api.topics.list()
    ])
    const indicatorsData = indicatorsRes?.data || indicatorsRes
    const topicsData = topicsRes?.data || topicsRes
    items.value = Array.isArray(indicatorsData) ? indicatorsData : []
    topics.value = Array.isArray(topicsData) ? topicsData : []
  } catch (err) {
    console.error('Failed to load data:', err)
    items.value = []
    topics.value = []
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
    form.value = { topic_id: null, code: '', name_th: '', description: '', type: 'score_1_4', weight: 1.00, min_score: 1, max_score: 4, active: true }
  }
  dialog.value = true
}

async function save() {
  try {
    if (editMode.value) {
      await api.indicators.update(form.value.id, form.value)
    } else {
      await api.indicators.create(form.value)
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
    await api.indicators.delete(selectedItem.value.id)
    await loadData()
    deleteDialog.value = false
  } catch (err) {
    console.error('Failed to delete:', err)
    alert('เกิดข้อผิดพลาดในการลบ')
  }
}
</script>
