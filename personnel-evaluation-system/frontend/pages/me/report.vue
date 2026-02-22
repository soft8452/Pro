<!-- pages/me/report.vue -->
<template>
  <div>
    <v-card class="mb-4">
      <v-card-title class="text-h5">
        <v-icon class="mr-2">mdi-file-document-outline</v-icon>
        รายงานผลการประเมินส่วนบุคคล (Personal Report)
      </v-card-title>
      <v-card-subtitle>พิมพ์รายงานผลส่วนบุคคล (PDF/Print)</v-card-subtitle>
    </v-card>

    <v-card class="mb-4">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <v-select
              v-model="selectedPeriod"
              label="เลือกรอบการประเมิน"
              :items="periods"
              item-title="name_th"
              item-value="id"
              density="comfortable"
            />
          </v-col>
          <v-col cols="12" md="6" class="d-flex align-center gap-2">
            <v-btn color="error" prepend-icon="mdi-file-pdf-box" @click="exportPDF">
              Export PDF
            </v-btn>
            <v-btn color="primary" prepend-icon="mdi-printer" @click="printReport">
              พิมพ์
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Report Preview -->
    <v-card id="report-content">
      <v-card-text class="pa-8">
        <!-- Header -->
        <div class="text-center mb-6">
          <h2 class="text-h4 mb-2">รายงานผลการประเมินบุคลากร</h2>
          <h3 class="text-h6 text-grey">{{ reportData.period }}</h3>
        </div>

        <!-- Personal Info -->
        <v-divider class="my-4" />
        <v-row class="mb-4">
          <v-col cols="6">
            <div class="d-flex">
              <div class="font-weight-bold mr-2">ชื่อ-นามสกุล:</div>
              <div>{{ reportData.name }}</div>
            </div>
          </v-col>
          <v-col cols="6">
            <div class="d-flex">
              <div class="font-weight-bold mr-2">แผนก:</div>
              <div>{{ reportData.department }}</div>
            </div>
          </v-col>
          <v-col cols="6">
            <div class="d-flex">
              <div class="font-weight-bold mr-2">รหัสพนักงาน:</div>
              <div>{{ reportData.employeeId }}</div>
            </div>
          </v-col>
          <v-col cols="6">
            <div class="d-flex">
              <div class="font-weight-bold mr-2">วันที่ประเมิน:</div>
              <div>{{ reportData.evaluatedDate }}</div>
            </div>
          </v-col>
        </v-row>

        <!-- Summary Score -->
        <v-divider class="my-4" />
        <v-card color="primary" dark class="mb-4">
          <v-card-text class="text-center">
            <div class="text-h3">{{ reportData.totalScore }} / 60</div>
            <div class="text-h6">คะแนนรวม (Normalized Score)</div>
            <div class="text-subtitle-1 mt-2">ระดับ: {{ reportData.grade }}</div>
          </v-card-text>
        </v-card>

        <!-- Scores by Topic -->
        <div v-for="topic in reportData.topics" :key="topic.code" class="mb-4">
          <h4 class="text-h6 mb-2">{{ topic.code }} - {{ topic.title }}</h4>
          <v-simple-table dense>
            <template #default>
              <thead>
                <tr>
                  <th>ตัวชี้วัด</th>
                  <th class="text-center">คะแนน</th>
                  <th>หมายเหตุ</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="ind in topic.indicators" :key="ind.code">
                  <td>{{ ind.code }} - {{ ind.name }}</td>
                  <td class="text-center">{{ ind.score }}</td>
                  <td>{{ ind.notes || '-' }}</td>
                </tr>
              </tbody>
            </template>
          </v-simple-table>
          <div class="text-right mt-2 font-weight-bold">
            คะแนนหัวข้อ: {{ topic.score }} / {{ topic.maxScore }}
          </div>
        </div>

        <!-- Signature -->
        <v-divider class="my-6" />
        <v-row class="mt-8">
          <v-col cols="6" class="text-center">
            <div class="mb-8">...................................</div>
            <div>ลงชื่อผู้ถูกประเมิน</div>
            <div>( {{ reportData.name}} )</div>
          </v-col>
          <v-col cols="6" class="text-center">
            <div class="mb-8">...................................</div>
            <div>ลงชื่อกรรมการประเมิน</div>
            <div>( {{ reportData.evaluatorName }} )</div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

import { ref, onMounted, watch } from 'vue'

const { $axios } = useNuxtApp()

const loading = ref(true)
const selectedPeriod = ref(null)
const periods = ref([])

const reportData = ref({
  period: '',
  name: '',
  department: '',
  employeeId: '',
  evaluatedDate: '',
  totalScore: 0,
  grade: '',
  evaluatorName: '',
  topics: []
})

async function loadPeriods() {
  try {
    const res = await $axios.get('/api/periods')
    periods.value = res.data?.data || res.data || []
    
    // Select active period by default
    const active = periods.value.find(p => p.is_active)
    if (active) selectedPeriod.value = active.id
    else if (periods.value.length) selectedPeriod.value = periods.value[0].id
  } catch (err) {
    console.error('Failed to load periods:', err)
  }
}

async function loadReport() {
  if (!selectedPeriod.value) return
  
  loading.value = true
  try {
    // Use task3 API for normalized score
    const res = await $axios.get('/api/task3/reports/normalized', {
      params: { period_id: selectedPeriod.value }
    })
    
    const data = res.data?.data || res.data
    
    if (data) {
      const period = periods.value.find(p => p.id === selectedPeriod.value)
      
      reportData.value = {
        period: period?.name_th || '',
        name: data.user?.name_th || data.evaluatee_name || '',
        department: data.user?.department_name || data.department_name || '',
        employeeId: data.user?.employee_id || data.employee_id || '',
        evaluatedDate: formatDate(data.evaluated_at || data.submitted_at),
        totalScore: data.normalized_score || data.total_score || 0,
        grade: getGrade(data.normalized_score || data.total_score || 0),
        evaluatorName: data.evaluator_name || '',
        topics: data.topics || []
      }
    }
  } catch (err) {
    console.error('Failed to load report:', err)
    // Fallback - try loading from evaluation results
    try {
      const evalRes = await $axios.get('/api/task1/evaluation-results')
      const results = evalRes.data?.data || evalRes.data || []
      
      // Load topics to structure data
      const topicsRes = await $axios.get('/api/topics', { params: { active: true } })
      const topics = topicsRes.data?.data || topicsRes.data || []
      
      const indicatorsRes = await $axios.get('/api/indicators', { params: { active: true } })
      const indicators = indicatorsRes.data?.data || indicatorsRes.data || []
      
      let totalScore = 0
      const topicsWithScores = topics.map(topic => {
        const topicIndicators = indicators.filter(ind => ind.topic_id === topic.id)
        let topicScore = 0
        let maxScore = 0
        
        const inds = topicIndicators.map(ind => {
          const result = results.find(r => r.indicator_id === ind.id)
          if (ind.type === 'score_1_4') {
            maxScore += (ind.max_score || 4)
            if (result?.score) {
              topicScore += result.score
              totalScore += result.score
            }
          }
          return {
            code: ind.code,
            name: ind.name_th,
            score: result?.score ?? (result?.value_yes_no === 1 ? 'ใช่' : result?.value_yes_no === 0 ? 'ไม่ใช่' : '-'),
            notes: result?.notes || ''
          }
        })
        
        return {
          code: topic.code,
          title: topic.title_th,
          score: topicScore.toFixed(1),
          maxScore,
          indicators: inds
        }
      })
      
      const period = periods.value.find(p => p.id === selectedPeriod.value)
      reportData.value = {
        period: period?.name_th || '',
        name: results[0]?.evaluatee_name || '',
        department: results[0]?.department_name || '',
        employeeId: '',
        evaluatedDate: formatDate(new Date()),
        totalScore: (totalScore / 4 * 60).toFixed(1), // Normalize to /60
        grade: getGrade(totalScore / 4 * 60),
        evaluatorName: results[0]?.evaluator_name || '',
        topics: topicsWithScores
      }
    } catch (e) {
      console.error('Fallback also failed:', e)
    }
  } finally {
    loading.value = false
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function getGrade(score) {
  if (score >= 54) return 'ดีเยี่ยม'
  if (score >= 48) return 'ดีมาก'
  if (score >= 36) return 'ดี'
  if (score >= 24) return 'พอใช้'
  return 'ปรับปรุง'
}

function exportPDF() {
  // Use browser print to PDF
  window.print()
}

function printReport() {
  window.print()
}

watch(selectedPeriod, () => {
  loadReport()
})

onMounted(async () => {
  await loadPeriods()
  if (selectedPeriod.value) {
    await loadReport()
  }
})
</script>

<style>
@media print {
  .v-navigation-drawer,
  .v-app-bar,
  .v-btn,
  .v-select {
    display: none !important;
  }
  
  #report-content {
    box-shadow: none !important;
  }
}
</style>
