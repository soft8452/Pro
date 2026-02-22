<!-- pages/evaluator/assignments/[id].vue -->
<!-- กรอกคะแนนแบบกริดตัวชี้วัด -->
<template>
  <div>
    <!-- Header -->
    <v-card class="mb-4">
      <v-card-title class="text-h5">
        <v-btn icon variant="text" @click="$router.back()">
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
        <v-icon class="ml-2 mr-2">mdi-lead-pencil</v-icon>
        กรอกคะแนนการประเมิน
      </v-card-title>
      <v-card-subtitle class="ml-12">
        แบบกริดตัวชี้วัด (score/yes-no/note), อัปโหลดไฟล์หลักฐานประกอบ, บันทึก/ยืนยันผล
      </v-card-subtitle>
    </v-card>

    <!-- Loading -->
    <v-skeleton-loader v-if="loading" type="card, card, card" />

    <template v-else>
      <!-- Evaluatee Info -->
      <v-card class="mb-4">
        <v-card-text>
          <v-row>
            <v-col cols="12" md="4">
              <div class="text-subtitle-2 text-grey">ครูผู้ถูกประเมิน</div>
              <div class="text-h6">{{ assignment.evaluatee_name }}</div>
            </v-col>
            <v-col cols="12" md="4">
              <div class="text-subtitle-2 text-grey">แผนก</div>
              <div class="text-h6">{{ assignment.department_name }}</div>
            </v-col>
            <v-col cols="12" md="4">
              <div class="text-subtitle-2 text-grey">รอบการประเมิน</div>
              <div class="text-h6">{{ assignment.period_name }}</div>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Topics and Indicators -->
      <v-expansion-panels v-model="expandedPanels" multiple>
        <v-expansion-panel v-for="topic in topics" :key="topic.id">
          <v-expansion-panel-title>
            <div class="d-flex align-center">
              <v-icon class="mr-2">mdi-folder-outline</v-icon>
              <span class="font-weight-medium">{{ topic.code }} - {{ topic.title_th }}</span>
              <v-chip class="ml-3" size="small" color="info">น้ำหนัก {{ topic.weight }}</v-chip>
              <v-chip class="ml-2" size="small" :color="getTopicProgressColor(topic)">
                {{ getTopicProgress(topic) }}%
              </v-chip>
            </div>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <div v-for="indicator in topic.indicators" :key="indicator.id" class="mb-4 pa-4 border rounded">
              <div class="d-flex justify-space-between align-center mb-2">
                <div>
                  <div class="font-weight-bold">{{ indicator.code }} - {{ indicator.name_th }}</div>
                  <div class="text-caption text-grey">{{ indicator.description }}</div>
                </div>
                <v-chip v-if="indicator.evidence_required" size="small" color="warning">
                  <v-icon size="small" left>mdi-file-document</v-icon>
                  ต้องมีหลักฐาน
                </v-chip>
              </div>
              
              <!-- Score input (1-4) -->
              <v-row v-if="indicator.type === 'score_1_4'">
                <v-col cols="12" md="5">
                  <v-slider
                    v-model="scores[indicator.id].score"
                    :min="indicator.min_score || 1"
                    :max="indicator.max_score || 4"
                    :step="0.5"
                    show-ticks="always"
                    thumb-label="always"
                    :color="getScoreColor(scores[indicator.id].score)"
                    @update:modelValue="autoSave(indicator.id)"
                  >
                    <template #prepend>
                      <span class="text-subtitle-2">{{ indicator.min_score || 1 }}</span>
                    </template>
                    <template #append>
                      <span class="text-subtitle-2">{{ indicator.max_score || 4 }}</span>
                    </template>
                  </v-slider>
                </v-col>
                <v-col cols="12" md="7">
                  <v-textarea
                    v-model="scores[indicator.id].notes"
                    label="หมายเหตุ"
                    rows="2"
                    density="comfortable"
                    @blur="autoSave(indicator.id)"
                  />
                </v-col>
              </v-row>
              
              <!-- Yes/No input -->
              <v-row v-else-if="indicator.type === 'yes_no'">
                <v-col cols="12" md="3">
                  <v-radio-group 
                    v-model="scores[indicator.id].value_yes_no" 
                    inline
                    @update:modelValue="autoSave(indicator.id)"
                  >
                    <v-radio label="ใช่" :value="1" color="success" />
                    <v-radio label="ไม่ใช่" :value="0" color="error" />
                  </v-radio-group>
                </v-col>
                <v-col cols="12" md="9">
                  <v-textarea
                    v-model="scores[indicator.id].notes"
                    label="หมายเหตุ"
                    rows="2"
                    density="comfortable"
                    @blur="autoSave(indicator.id)"
                  />
                </v-col>
              </v-row>

              <!-- Evidence upload (if required) -->
              <div v-if="indicator.evidence_required" class="mt-3">
                <v-file-input
                  v-model="scores[indicator.id].files"
                  label="อัปโหลดหลักฐาน"
                  prepend-icon="mdi-paperclip"
                  multiple
                  show-size
                  density="comfortable"
                  accept="image/*,application/pdf,.doc,.docx"
                  @update:modelValue="uploadEvidence(indicator.id)"
                />
                <!-- Existing attachments -->
                <div v-if="scores[indicator.id].attachments?.length" class="mt-2">
                  <v-chip 
                    v-for="att in scores[indicator.id].attachments" 
                    :key="att.id"
                    size="small"
                    class="mr-2 mb-1"
                    closable
                    @click:close="removeAttachment(indicator.id, att.id)"
                  >
                    <v-icon left size="small">mdi-file</v-icon>
                    {{ att.original_name }}
                  </v-chip>
                </div>
              </div>
            </div>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>

      <!-- Actions -->
      <v-card class="mt-4">
        <v-card-text class="d-flex justify-space-between align-center">
          <div>
            <v-chip color="info" class="mr-2">
              ความคืบหน้ารวม: {{ overallProgress }}%
            </v-chip>
            <span v-if="lastSaved" class="text-caption text-grey">
              บันทึกล่าสุด: {{ lastSaved }}
            </span>
          </div>
          <div>
            <v-btn variant="outlined" class="mr-2" @click="saveDraft">
              <v-icon left>mdi-content-save</v-icon>
              บันทึกร่าง
            </v-btn>
            <v-btn color="primary" :disabled="overallProgress < 100" @click="submitEvaluation">
              <v-icon left>mdi-send</v-icon>
              ส่งผลประเมิน
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
    </template>

    <!-- Submit Confirmation Dialog -->
    <v-dialog v-model="submitDialog" max-width="500">
      <v-card>
        <v-card-title>ยืนยันการส่งผลประเมิน</v-card-title>
        <v-card-text>
          <v-alert type="warning" variant="tonal" class="mb-4">
            เมื่อส่งผลประเมินแล้ว จะไม่สามารถแก้ไขได้อีก
          </v-alert>
          <p>คุณต้องการส่งผลประเมินของ <strong>{{ assignment.evaluatee_name }}</strong> หรือไม่?</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="submitDialog = false">ยกเลิก</v-btn>
          <v-btn color="primary" :loading="submitting" @click="confirmSubmit">ยืนยัน</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
definePageMeta({ middleware: 'auth' })

import { ref, computed, onMounted } from 'vue'

const route = useRoute()
const { $axios } = useNuxtApp()

const assignmentId = computed(() => route.params.id)

const loading = ref(true)
const submitting = ref(false)
const submitDialog = ref(false)
const lastSaved = ref(null)
const expandedPanels = ref([0])

const assignment = ref({})
const topics = ref([])
const scores = ref({})

function getScoreColor(score) {
  if (score >= 3.5) return 'success'
  if (score >= 2.5) return 'info'
  if (score >= 1.5) return 'warning'
  return 'error'
}

function getTopicProgress(topic) {
  if (!topic.indicators?.length) return 0
  const filled = topic.indicators.filter(ind => {
    const s = scores.value[ind.id]
    if (ind.type === 'score_1_4') return s?.score != null
    return s?.value_yes_no != null
  }).length
  return Math.round((filled / topic.indicators.length) * 100)
}

function getTopicProgressColor(topic) {
  const progress = getTopicProgress(topic)
  if (progress >= 100) return 'success'
  if (progress >= 50) return 'warning'
  return 'error'
}

const overallProgress = computed(() => {
  let total = 0
  let filled = 0
  topics.value.forEach(topic => {
    topic.indicators?.forEach(ind => {
      total++
      const s = scores.value[ind.id]
      if (ind.type === 'score_1_4' && s?.score != null) filled++
      else if (ind.type === 'yes_no' && s?.value_yes_no != null) filled++
    })
  })
  return total > 0 ? Math.round((filled / total) * 100) : 0
})

async function loadAssignment() {
  loading.value = true
  try {
    // Load assignment details
    const res = await $axios.get(`/api/assignments/${assignmentId.value}`)
    assignment.value = res.data?.data || res.data || {}

    // Load topics with indicators
    const topicsRes = await $axios.get('/api/topics', { params: { active: true } })
    const topicsData = topicsRes.data?.data || topicsRes.data || []

    // Load indicators for each topic
    const indicatorsRes = await $axios.get('/api/indicators', { params: { active: true } })
    const allIndicators = indicatorsRes.data?.data || indicatorsRes.data || []

    // Group indicators by topic
    topics.value = topicsData.map(topic => ({
      ...topic,
      indicators: allIndicators.filter(ind => ind.topic_id === topic.id)
    }))

    // Initialize scores object
    allIndicators.forEach(ind => {
      scores.value[ind.id] = {
        indicator_id: ind.id,
        score: null,
        value_yes_no: null,
        notes: '',
        files: [],
        attachments: []
      }
    })

    // Load existing scores if any
    try {
      const scoresRes = await $axios.get(`/api/results`, {
        params: { assignment_id: assignmentId.value }
      })
      const existingScores = scoresRes.data?.data || scoresRes.data || []
      existingScores.forEach(s => {
        if (scores.value[s.indicator_id]) {
          scores.value[s.indicator_id] = {
            ...scores.value[s.indicator_id],
            ...s
          }
        }
      })
    } catch (e) {
      console.log('No existing scores')
    }
  } catch (err) {
    console.error('Failed to load assignment:', err)
  } finally {
    loading.value = false
  }
}

async function autoSave(indicatorId) {
  try {
    const score = scores.value[indicatorId]
    await $axios.post(`/api/results`, {
      assignment_id: assignmentId.value,
      indicator_id: indicatorId,
      score: score.score,
      value_yes_no: score.value_yes_no,
      notes: score.notes
    })
    lastSaved.value = new Date().toLocaleTimeString('th-TH')
  } catch (err) {
    console.error('Auto-save failed:', err)
  }
}

async function saveDraft() {
  try {
    const allScores = Object.values(scores.value).filter(s => 
      s.score != null || s.value_yes_no != null
    )
    
    for (const score of allScores) {
      await $axios.post(`/api/results`, {
        assignment_id: assignmentId.value,
        indicator_id: score.indicator_id,
        score: score.score,
        value_yes_no: score.value_yes_no,
        notes: score.notes
      })
    }
    
    lastSaved.value = new Date().toLocaleTimeString('th-TH')
  } catch (err) {
    console.error('Save draft failed:', err)
  }
}

async function uploadEvidence(indicatorId) {
  const files = scores.value[indicatorId].files
  if (!files?.length) return

  try {
    const formData = new FormData()
    files.forEach(file => formData.append('files', file))
    formData.append('assignment_id', assignmentId.value)
    formData.append('indicator_id', indicatorId)

    const res = await $axios.post('/api/attachments', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    // Update attachments list
    const newAttachments = res.data?.data || res.data || []
    scores.value[indicatorId].attachments.push(...newAttachments)
    scores.value[indicatorId].files = []
  } catch (err) {
    console.error('Upload failed:', err)
  }
}

async function removeAttachment(indicatorId, attachmentId) {
  try {
    await $axios.delete(`/api/attachments/${attachmentId}`)
    scores.value[indicatorId].attachments = scores.value[indicatorId].attachments
      .filter(a => a.id !== attachmentId)
  } catch (err) {
    console.error('Remove attachment failed:', err)
  }
}

function submitEvaluation() {
  submitDialog.value = true
}

async function confirmSubmit() {
  submitting.value = true
  try {
    // Save all scores first
    await saveDraft()
    
    // Submit the assignment
    await $axios.patch(`/api/assignments/${assignmentId.value}`, {
      status: 'submitted'
    })
    
    submitDialog.value = false
    navigateTo('/evaluator/assignments')
  } catch (err) {
    console.error('Submit failed:', err)
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadAssignment()
})
</script>
