<!-- pages/me/evidence.vue -->
<!-- อัปโหลดหลักฐาน (Upload Evidence) -->
<template>
  <div>
    <v-card class="mb-4">
      <v-card-title class="text-h5">
        <v-icon class="mr-2">mdi-file-upload-outline</v-icon>
        อัปโหลดหลักฐาน
      </v-card-title>
      <v-card-subtitle>จัดการไฟล์หลักฐานประกอบการประเมิน</v-card-subtitle>
    </v-card>

    <!-- Upload Section -->
    <v-card class="mb-4">
      <v-card-title>อัปโหลดหลักฐานใหม่</v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="4">
            <v-select
              v-model="uploadForm.indicator_id"
              label="ตัวชี้วัด"
              :items="indicators"
              item-title="display_name"
              item-value="id"
              density="comfortable"
              :rules="[v => !!v || 'กรุณาเลือกตัวชี้วัด']"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-select
              v-model="uploadForm.evidence_type_id"
              label="ประเภทหลักฐาน"
              :items="evidenceTypes"
              item-title="name_th"
              item-value="id"
              density="comfortable"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-file-input
              v-model="uploadForm.files"
              label="เลือกไฟล์"
              prepend-icon="mdi-paperclip"
              multiple
              show-size
              density="comfortable"
              accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
            />
          </v-col>
        </v-row>
        <v-textarea
          v-model="uploadForm.description"
          label="คำอธิบาย (ถ้ามี)"
          rows="2"
          density="comfortable"
        />
        <div class="d-flex justify-end">
          <v-btn
            color="primary"
            :loading="uploading"
            :disabled="!uploadForm.indicator_id || !uploadForm.files?.length"
            @click="uploadEvidence"
          >
            <v-icon left>mdi-upload</v-icon>
            อัปโหลด
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <!-- Uploaded Files List -->
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        หลักฐานที่อัปโหลดแล้ว
        <v-chip color="info">{{ evidences.length }} รายการ</v-chip>
      </v-card-title>
      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="evidences"
          :loading="loading"
          :items-per-page="10"
        >
          <template #item.file_type="{ item }">
            <v-icon :color="getFileIconColor(item.mime_type)">
              {{ getFileIcon(item.mime_type) }}
            </v-icon>
          </template>

          <template #item.indicator="{ item }">
            <div class="font-weight-medium">{{ item.indicator_code }}</div>
            <div class="text-caption text-grey">{{ item.indicator_name }}</div>
          </template>

          <template #item.uploaded_at="{ item }">
            {{ formatDate(item.created_at) }}
          </template>

          <template #item.file_size="{ item }">
            {{ formatFileSize(item.file_size) }}
          </template>

          <template #item.actions="{ item }">
            <v-btn
              size="small"
              variant="text"
              icon="mdi-eye"
              color="info"
              @click="viewFile(item)"
            />
            <v-btn
              size="small"
              variant="text"
              icon="mdi-download"
              color="primary"
              @click="downloadFile(item)"
            />
            <v-btn
              size="small"
              variant="text"
              icon="mdi-delete"
              color="error"
              @click="confirmDelete(item)"
            />
          </template>

          <template #no-data>
            <div class="text-center pa-8">
              <v-icon size="64" color="grey">mdi-file-upload-outline</v-icon>
              <p class="text-grey mt-2">ยังไม่มีหลักฐานที่อัปโหลด</p>
            </div>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Delete Confirmation -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title>ยืนยันการลบ</v-card-title>
        <v-card-text>
          คุณต้องการลบไฟล์ "{{ selectedItem?.original_name }}" หรือไม่?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="deleteDialog = false">ยกเลิก</v-btn>
          <v-btn color="error" :loading="deleting" @click="deleteEvidence">ลบ</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Preview Dialog -->
    <v-dialog v-model="previewDialog" max-width="800">
      <v-card>
        <v-card-title class="d-flex justify-space-between">
          {{ previewItem?.original_name }}
          <v-btn icon variant="text" @click="previewDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-img
            v-if="previewItem?.mime_type?.startsWith('image/')"
            :src="previewUrl"
            max-height="500"
            contain
          />
          <iframe
            v-else-if="previewItem?.mime_type === 'application/pdf'"
            :src="previewUrl"
            width="100%"
            height="500"
            frameborder="0"
          />
          <div v-else class="text-center pa-8">
            <v-icon size="64">mdi-file-document</v-icon>
            <p class="mt-2">ไม่สามารถแสดงตัวอย่างไฟล์นี้ได้</p>
            <v-btn color="primary" @click="downloadFile(previewItem)">ดาวน์โหลด</v-btn>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Alert -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color">
      {{ snackbar.message }}
    </v-snackbar>
  </div>
</template>

<script setup>
definePageMeta({ middleware: 'auth' })

import { ref, computed, onMounted } from 'vue'
import { useRuntimeConfig } from '#app'

const { $axios } = useNuxtApp()
const config = useRuntimeConfig()

const loading = ref(false)
const uploading = ref(false)
const deleting = ref(false)
const deleteDialog = ref(false)
const previewDialog = ref(false)
const selectedItem = ref(null)
const previewItem = ref(null)

const evidences = ref([])
const indicators = ref([])
const evidenceTypes = ref([])

const uploadForm = ref({
  indicator_id: null,
  evidence_type_id: null,
  files: [],
  description: ''
})

const snackbar = ref({
  show: false,
  message: '',
  color: 'success'
})

const headers = [
  { title: '', key: 'file_type', width: '50px', sortable: false },
  { title: 'ชื่อไฟล์', key: 'original_name', sortable: true },
  { title: 'ตัวชี้วัด', key: 'indicator', sortable: true },
  { title: 'ขนาด', key: 'file_size', sortable: true },
  { title: 'วันที่อัปโหลด', key: 'uploaded_at', sortable: true },
  { title: 'จัดการ', key: 'actions', sortable: false, width: '150px' }
]

const previewUrl = computed(() => {
  if (!previewItem.value) return ''
  const baseUrl = config.public?.apiBase || 'http://localhost:7000'
  return `${baseUrl}/api/attachments/${previewItem.value.id}/file`
})

function getFileIcon(mimeType) {
  if (mimeType?.startsWith('image/')) return 'mdi-file-image'
  if (mimeType === 'application/pdf') return 'mdi-file-pdf-box'
  if (mimeType?.includes('word') || mimeType?.includes('document')) return 'mdi-file-word'
  if (mimeType?.includes('excel') || mimeType?.includes('sheet')) return 'mdi-file-excel'
  return 'mdi-file-document'
}

function getFileIconColor(mimeType) {
  if (mimeType?.startsWith('image/')) return 'success'
  if (mimeType === 'application/pdf') return 'error'
  if (mimeType?.includes('word')) return 'primary'
  if (mimeType?.includes('excel')) return 'green'
  return 'grey'
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatFileSize(bytes) {
  if (!bytes) return '-'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

async function loadData() {
  loading.value = true
  try {
    // Load indicators
    const indicatorsRes = await $axios.get('/api/indicators', { params: { active: true } })
    const indicatorsData = indicatorsRes.data?.data || indicatorsRes.data || []
    indicators.value = indicatorsData.map(ind => ({
      ...ind,
      display_name: `${ind.code} - ${ind.name_th}`
    }))

    // Load evidence types
    try {
      const typesRes = await $axios.get('/api/evidence-types')
      evidenceTypes.value = typesRes.data?.data || typesRes.data || []
    } catch (e) {
      evidenceTypes.value = []
    }

    // Load my evidences
    const evidencesRes = await $axios.get('/api/attachments')
    evidences.value = evidencesRes.data?.data || evidencesRes.data || []
  } catch (err) {
    console.error('Failed to load data:', err)
  } finally {
    loading.value = false
  }
}

async function uploadEvidence() {
  if (!uploadForm.value.indicator_id || !uploadForm.value.files?.length) return

  uploading.value = true
  try {
    const formData = new FormData()
    uploadForm.value.files.forEach(file => formData.append('files', file))
    formData.append('indicator_id', uploadForm.value.indicator_id)
    if (uploadForm.value.evidence_type_id) {
      formData.append('evidence_type_id', uploadForm.value.evidence_type_id)
    }
    if (uploadForm.value.description) {
      formData.append('description', uploadForm.value.description)
    }

    // Use task2 API for evidence submission with validation
    await $axios.post('/api/task2/evidence', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    showSnackbar('อัปโหลดหลักฐานสำเร็จ', 'success')
    
    // Reset form
    uploadForm.value = {
      indicator_id: null,
      evidence_type_id: null,
      files: [],
      description: ''
    }

    // Reload list
    await loadData()
  } catch (err) {
    const message = err.response?.data?.message || 'เกิดข้อผิดพลาดในการอัปโหลด'
    showSnackbar(message, 'error')
  } finally {
    uploading.value = false
  }
}

function viewFile(item) {
  previewItem.value = item
  previewDialog.value = true
}

function downloadFile(item) {
  const baseUrl = config.public?.apiBase || 'http://localhost:7000'
  window.open(`${baseUrl}/api/attachments/${item.id}/file`, '_blank')
}

function confirmDelete(item) {
  selectedItem.value = item
  deleteDialog.value = true
}

async function deleteEvidence() {
  if (!selectedItem.value) return

  deleting.value = true
  try {
    await $axios.delete(`/api/attachments/${selectedItem.value.id}`)
    showSnackbar('ลบหลักฐานสำเร็จ', 'success')
    deleteDialog.value = false
    await loadData()
  } catch (err) {
    showSnackbar('เกิดข้อผิดพลาดในการลบ', 'error')
  } finally {
    deleting.value = false
  }
}

function showSnackbar(message, color = 'success') {
  snackbar.value = { show: true, message, color }
}

onMounted(() => {
  loadData()
})
</script>
