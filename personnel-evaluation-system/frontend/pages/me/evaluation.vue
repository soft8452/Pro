<!-- pages/me/evaluation.vue -->
<template>
  <div>
    <v-card class="mb-4">
      <v-card-title class="text-h5">
        <v-icon class="mr-2">mdi-account-check-outline</v-icon>
        ผลการประเมินของฉัน (My Evaluation)
      </v-card-title>
      <v-card-subtitle>ดูหัวข้อ/ตัวชี้วัด, สถานะผล (draft/submitted/locked) และคะแนนที่ได้รับ</v-card-subtitle>
    </v-card>

    <v-row class="mb-4">
      <v-col cols="12" md="3">
        <v-card color="primary" dark>
          <v-card-text>
            <div class="text-h3">{{ stats.totalScore }}</div>
            <div>คะแนนรวม / 60</div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="3">
        <v-card color="success" dark>
          <v-card-text>
            <div class="text-h3">{{ stats.completed }}</div>
            <div>ตัวชี้วัดที่ประเมินแล้ว</div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="3">
        <v-card color="warning" dark>
          <v-card-text>
            <div class="text-h3">{{ stats.pending }}</div>
            <div>รอการประเมิน</div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="3">
        <v-card color="info" dark>
          <v-card-text>
            <div class="text-h3">{{ stats.evidences }}</div>
            <div>หลักฐานที่อัปโหลด</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Results by Topic -->
    <div v-for="topic in topics" :key="topic.id" class="mb-4">
      <v-card>
        <v-card-title class="bg-grey-lighten-3 d-flex justify-space-between">
          <div>
            {{ topic.code }} - {{ topic.title_th }}
            <v-chip class="ml-2" size="small" color="info">น้ำหนัก {{ topic.weight }}</v-chip>
          </div>
          <div>
            <v-chip color="success">คะแนน: {{ topic.totalScore }} / {{ topic.maxScore }}</v-chip>
          </div>
        </v-card-title>
        <v-card-text>
          <v-table>
            <thead>
              <tr>
                <th>รหัส</th>
                <th>ตัวชี้วัด</th>
                <th>ประเภท</th>
                <th>คะแนนที่ได้</th>
                <th>หมายเหตุ</th>
                <th>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="indicator in topic.indicators" :key="indicator.id">
                <td>{{ indicator.code }}</td>
                <td>{{ indicator.name_th }}</td>
                <td>
                  <v-chip :color="indicator.type === 'score_1_4' ? 'primary' : 'success'" size="small">
                    {{ indicator.type === 'score_1_4' ? 'คะแนน 1-4' : 'ใช่/ไม่ใช่' }}
                  </v-chip>
                </td>
                <td>
                  <v-chip 
                    v-if="indicator.score !== null"
                    :color="indicator.score >= 3 ? 'success' : indicator.score >= 2 ? 'warning' : 'error'"
                    size="small"
                  >
                    {{ indicator.score }}
                  </v-chip>
                  <v-chip 
                    v-else-if="indicator.value_yes_no !== null"
                    :color="indicator.value_yes_no ? 'success' : 'error'"
                    size="small"
                  >
                    {{ indicator.value_yes_no ? 'ใช่' : 'ไม่ใช่' }}
                  </v-chip>
                  <span v-else class="text-grey">-</span>
                </td>
                <td class="text-caption">{{ indicator.notes || '-' }}</td>
                <td>
                  <v-chip :color="getStatusColor(indicator.status)" size="small">
                    {{ indicator.status }}
                  </v-chip>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card-text>
      </v-card>
    </div>

    <v-card>
      <v-card-actions class="justify-end">
        <v-btn color="info" prepend-icon="mdi-file-document" @click="router.push('/me/report')">
          พิมพ์รายงาน
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

import { ref, computed, onMounted } from 'vue'

const { $axios } = useNuxtApp()
const router = useRouter()
const loading = ref(true)

const stats = ref({
  totalScore: 0,
  completed: 0,
  pending: 0,
  evidences: 0
})

const topics = ref([])
const myResults = ref([])
const activePeriod = ref(null)

// Compute stats from loaded data
const computedStats = computed(() => {
  let completed = 0
  let pending = 0
  let totalScore = 0
  
  topics.value.forEach(topic => {
    topic.indicators?.forEach(ind => {
      if (ind.score !== null || ind.value_yes_no !== null) {
        completed++
        if (ind.score !== null) totalScore += ind.score
      } else {
        pending++
      }
    })
  })
  
  return {
    totalScore: totalScore.toFixed(1),
    completed,
    pending,
    evidences: stats.value.evidences
  }
})

async function loadData() {
  loading.value = true
  try {
    // Load active period
    const periodsRes = await $axios.get('/api/periods', { params: { is_active: true } })
    const periodsData = periodsRes.data?.data || periodsRes.data || []
    activePeriod.value = periodsData[0]

    // Load topics with indicators
    const topicsRes = await $axios.get('/api/topics', { params: { active: true } })
    const topicsData = topicsRes.data?.data || topicsRes.data || []

    const indicatorsRes = await $axios.get('/api/indicators', { params: { active: true } })
    const allIndicators = indicatorsRes.data?.data || indicatorsRes.data || []

    // Load my evaluation results (no assignment_id needed for evaluatee)
    const resultsRes = await $axios.get('/api/task1/evaluation-results')
    const results = resultsRes.data?.results || resultsRes.data?.data || resultsRes.data || []

    // Load my attachments count
    try {
      const attachRes = await $axios.get('/api/attachments')
      stats.value.evidences = (attachRes.data?.data || attachRes.data || []).length
    } catch (e) {
      stats.value.evidences = 0
    }

    // Build topics with indicators and merge scores
    topics.value = topicsData.map(topic => {
      const topicIndicators = allIndicators.filter(ind => ind.topic_id === topic.id)
      let topicScore = 0
      let maxScore = 0
      
      const indicatorsWithScores = topicIndicators.map(ind => {
        const result = results.find(r => r.indicator_id === ind.id)
        if (ind.type === 'score_1_4') {
          maxScore += (ind.max_score || 4)
          if (result?.score) topicScore += result.score
        }
        
        return {
          ...ind,
          score: result?.score ?? null,
          value_yes_no: result?.value_yes_no ?? null,
          notes: result?.notes || '',
          status: result?.status || 'pending'
        }
      })
      
      return {
        ...topic,
        indicators: indicatorsWithScores,
        totalScore: topicScore.toFixed(1),
        maxScore
      }
    })

    // Update stats
    stats.value = computedStats.value
  } catch (err) {
    console.error('Failed to load evaluation data:', err)
  } finally {
    loading.value = false
  }
}

function getStatusColor(status) {
  const colors = {
    'submitted': 'success',
    'draft': 'warning',
    'locked': 'info',
    'pending': 'grey'
  }
  return colors[status] || 'grey'
}

onMounted(() => {
  loadData()
})
</script>
