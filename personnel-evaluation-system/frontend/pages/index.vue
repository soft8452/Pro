<script setup>
definePageMeta({ layout: 'dashboard' })
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'

const { $axios } = useNuxtApp()
const auth = useAuthStore()
const router = useRouter()

const stats = ref({
  users: 0,
  topics: 0,
  indicators: 0,
  periods: 0,
  assignments: 0,
  myAssignments: 0,
  myEvidences: 0,
  myScore: 0,
  pendingTasks: 0,
  completedTasks: 0
})
const pendingAssignments = ref([])
const loading = ref(true)

const isAdmin = computed(() => auth.user?.role?.toLowerCase() === 'admin')
const isEvaluator = computed(() => auth.user?.role?.toLowerCase() === 'evaluator')
const isEvaluatee = computed(() => auth.user?.role?.toLowerCase() === 'evaluatee')

onMounted(async () => {
  try {
    // โหลดข้อมูลสถิติตามบทบาท
    if (isAdmin.value) {
      await loadAdminStats()
    } else if (isEvaluator.value) {
      await loadEvaluatorStats()
    } else if (isEvaluatee.value) {
      await loadEvaluateeStats()
    }
  } catch (e) {
    console.error('Load stats error:', e)
  } finally {
    loading.value = false
  }
})

async function loadAdminStats() {
  try {
    const [usersRes, topicsRes, indicatorsRes, periodsRes, assignmentsRes] = await Promise.all([
      $axios.get('/api/users').catch(() => ({ data: { items: [] } })),
      $axios.get('/api/topics').catch(() => ({ data: { data: [] } })),
      $axios.get('/api/indicators').catch(() => ({ data: { data: [] } })),
      $axios.get('/api/periods').catch(() => ({ data: { data: [] } })),
      $axios.get('/api/assignments').catch(() => ({ data: { data: [] } }))
    ])
    // users API returns { items: [...] }, others return { data: [...] }
    const usersData = usersRes.data?.items || usersRes.data?.data || usersRes.data || []
    const topicsData = topicsRes.data?.data || topicsRes.data?.items || topicsRes.data || []
    const indicatorsData = indicatorsRes.data?.data || indicatorsRes.data?.items || indicatorsRes.data || []
    const periodsData = periodsRes.data?.data || periodsRes.data?.items || periodsRes.data || []
    const assignmentsData = assignmentsRes.data?.data || assignmentsRes.data?.items || assignmentsRes.data || []
    
    stats.value.users = Array.isArray(usersData) ? usersData.length : 0
    stats.value.topics = Array.isArray(topicsData) ? topicsData.length : 0
    stats.value.indicators = Array.isArray(indicatorsData) ? indicatorsData.length : 0
    stats.value.periods = Array.isArray(periodsData) ? periodsData.length : 0
    stats.value.assignments = Array.isArray(assignmentsData) ? assignmentsData.length : 0
  } catch (e) {
    console.error(e)
  }
}

async function loadEvaluatorStats() {
  try {
    // โหลดรายการที่ต้องประเมิน
    const res = await $axios.get('/api/assignments/my-tasks').catch(() => ({ data: [] }))
    const tasks = res.data?.data || res.data || []
    stats.value.myAssignments = tasks.length
    stats.value.pendingTasks = tasks.filter(t => t.status === 'pending' || !t.status).length
    stats.value.completedTasks = tasks.filter(t => t.status === 'submitted' || t.status === 'completed').length
    pendingAssignments.value = tasks.filter(t => t.status !== 'submitted').slice(0, 5)
  } catch (e) {
    console.error(e)
  }
}

async function loadEvaluateeStats() {
  try {
    // โหลดหลักฐานและคะแนนของฉัน
    const [evidenceRes, resultsRes] = await Promise.all([
      $axios.get('/api/attachments').catch(() => ({ data: [] })),
      $axios.get('/api/task1/evaluation-results', { params: { assignment_id: 1 } }).catch(() => ({ data: { results: [] } }))
    ])
    stats.value.myEvidences = (evidenceRes.data?.data || evidenceRes.data || []).length
    
    // Calculate average score
    const results = resultsRes.data?.results || []
    if (results.length > 0) {
      const scores = results.filter(r => r.score != null).map(r => r.score)
      stats.value.myScore = scores.length > 0 
        ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
        : 0
    }
  } catch (e) {
    console.error(e)
  }
}
</script>

<template>
  <div>
    <!-- Admin Dashboard -->
    <div v-if="isAdmin">
      <v-card class="mb-6">
        <v-card-title class="text-h5">
          <v-icon class="mr-2">mdi-shield-crown</v-icon>
          Admin Dashboard
        </v-card-title>
        <v-card-subtitle>บทบาท: ผู้ดูแลระบบ</v-card-subtitle>
      </v-card>

      <v-row v-if="!loading">
        <v-col cols="12" md="3">
          <v-card color="primary" dark>
            <v-card-text>
              <div class="text-h3">{{ stats.users }}</div>
              <div>ผู้ใช้งาน</div>
            </v-card-text>
            <v-card-actions>
              <v-btn text @click="router.push('/users')">จัดการ</v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
        
        <v-col cols="12" md="3">
          <v-card color="success" dark>
            <v-card-text>
              <div class="text-h3">{{ stats.topics }}</div>
              <div>หัวข้อประเมิน</div>
            </v-card-text>
            <v-card-actions>
              <v-btn text @click="router.push('/admin/topics')">จัดการ</v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
        
        <v-col cols="12" md="3">
          <v-card color="info" dark>
            <v-card-text>
              <div class="text-h3">{{ stats.indicators }}</div>
              <div>ตัวชี้วัด</div>
            </v-card-text>
            <v-card-actions>
              <v-btn text @click="router.push('/admin/indicators')">จัดการ</v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
        
        <v-col cols="12" md="3">
          <v-card color="warning" dark>
            <v-card-text>
              <div class="text-h3">{{ stats.periods }}</div>
              <div>รอบการประเมิน</div>
            </v-card-text>
            <v-card-actions>
              <v-btn text @click="router.push('/admin/periods')">จัดการ</v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
      
      <v-card class="mt-6">
        <v-card-title>Quick Actions</v-card-title>
        <v-card-text>
          <div class="d-flex flex-wrap gap-2">
            <v-btn color="primary" prepend-icon="mdi-account-plus" @click="router.push('/admin/users')">
              จัดการผู้ใช้
            </v-btn>
            <v-btn color="success" prepend-icon="mdi-clipboard-plus" @click="router.push('/admin/assignments')">
              มอบหมายงาน
            </v-btn>
            <v-btn color="info" prepend-icon="mdi-chart-line" @click="router.push('/reports/normalized')">
              รายงาน
            </v-btn>
            <v-btn color="warning" prepend-icon="mdi-progress-check" @click="router.push('/reports/progress')">
              ความคืบหน้า
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
    </div>

    <!-- Evaluator Dashboard -->
    <div v-else-if="isEvaluator">
      <v-card class="mb-6">
        <v-card-title class="text-h5">
          <v-icon class="mr-2">mdi-clipboard-check</v-icon>
          Evaluator Dashboard
        </v-card-title>
        <v-card-subtitle>บทบาท: กรรมการประเมิน</v-card-subtitle>
      </v-card>

      <v-row v-if="!loading">
        <v-col cols="12" md="4">
          <v-card color="warning" dark>
            <v-card-text>
              <div class="text-h3">{{ stats.pendingTasks }}</div>
              <div>รอดำเนินการ</div>
            </v-card-text>
            <v-card-actions>
              <v-btn text @click="router.push('/evaluator/assignments')">ดูรายการ</v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
        
        <v-col cols="12" md="4">
          <v-card color="success" dark>
            <v-card-text>
              <div class="text-h3">{{ stats.completedTasks }}</div>
              <div>ส่งแล้ว</div>
            </v-card-text>
            <v-card-actions>
              <v-btn text @click="router.push('/evaluator/history')">ดูประวัติ</v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
        
        <v-col cols="12" md="4">
          <v-card color="primary" dark>
            <v-card-text>
              <div class="text-h3">{{ stats.myAssignments }}</div>
              <div>งานทั้งหมด</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
      
      <v-card class="mt-6">
        <v-card-title>รายการที่รอประเมิน</v-card-title>
        <v-card-text>
          <v-list v-if="pendingAssignments.length > 0">
            <v-list-item 
              v-for="task in pendingAssignments" 
              :key="task.id"
              :to="`/evaluator/assignments/${task.id}`"
            >
              <v-list-item-title>{{ task.evaluatee_name }}</v-list-item-title>
              <v-list-item-subtitle>{{ task.department_name }}</v-list-item-subtitle>
              <template #append>
                <v-btn size="small" color="primary" variant="tonal">
                  ให้คะแนน
                </v-btn>
              </template>
            </v-list-item>
          </v-list>
          <p v-else class="text-grey">ยังไม่มีรายการที่รอประเมิน</p>
        </v-card-text>
      </v-card>
    </div>

    <!-- Evaluatee Dashboard -->
    <div v-else-if="isEvaluatee">
      <v-card class="mb-6">
        <v-card-title class="text-h5">
          <v-icon class="mr-2">mdi-account-circle</v-icon>
          My Dashboard
        </v-card-title>
        <v-card-subtitle>บทบาท: ผู้ถูกประเมิน (ครูผู้สอน)</v-card-subtitle>
      </v-card>

      <v-row v-if="!loading">
        <v-col cols="12" md="4">
          <v-card color="success" dark>
            <v-card-text>
              <div class="text-h3">{{ stats.myEvidences }}</div>
              <div>หลักฐานที่อัปโหลด</div>
            </v-card-text>
            <v-card-actions>
              <v-btn text @click="router.push('/me/evidence')">ดูรายการ</v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
        
        <v-col cols="12" md="4">
          <v-card color="info" dark>
            <v-card-text>
              <div class="text-h3">{{ stats.myScore }}</div>
              <div>คะแนนเฉลี่ย</div>
            </v-card-text>
            <v-card-actions>
              <v-btn text @click="router.push('/me/evaluation')">ดูผลประเมิน</v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
        
        <v-col cols="12" md="4">
          <v-card color="primary" dark>
            <v-card-text>
              <v-icon size="48">mdi-file-document-outline</v-icon>
              <div class="mt-2">รายงานส่วนบุคคล</div>
            </v-card-text>
            <v-card-actions>
              <v-btn text @click="router.push('/me/report')">ดูรายงาน</v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
      
      <v-card class="mt-6">
        <v-card-title>การดำเนินการ</v-card-title>
        <v-card-text>
          <div class="d-flex flex-wrap gap-2">
            <v-btn color="primary" prepend-icon="mdi-upload" @click="router.push('/me/evidence')">
              อัปโหลดหลักฐาน
            </v-btn>
            <v-btn color="success" prepend-icon="mdi-format-list-checks" @click="router.push('/me/evaluation')">
              ผลการประเมินของฉัน
            </v-btn>
            <v-btn color="info" prepend-icon="mdi-file-document" @click="router.push('/me/report')">
              พิมพ์รายงาน
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
    </div>

    <!-- Loading -->
    <v-skeleton-loader v-if="loading" type="card" />

    <!-- Shortcuts Section -->
    <v-card class="mt-6">
      <v-card-title>ลิงก์ที่เป็นประโยชน์</v-card-title>
      <v-card-text>
        <div class="d-flex flex-wrap gap-2">
          <v-btn 
            href="http://localhost:7000/docs" 
            target="_blank"
            prepend-icon="mdi-book-open-outline"
            variant="outlined"
          >
            API Docs
          </v-btn>
          <v-btn 
            href="http://localhost:7000/health" 
            target="_blank"
            prepend-icon="mdi-heart-pulse"
            variant="outlined"
            color="success"
          >
            System Health
          </v-btn>
          <v-btn 
            v-if="isAdmin"
            @click="router.push('/reports/normalized')"
            prepend-icon="mdi-chart-bar"
            variant="outlined"
            color="info"
          >
            Normalized Report
          </v-btn>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>
