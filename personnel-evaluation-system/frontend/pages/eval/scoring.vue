<!-- pages/eval/scoring.vue -->
<template>
  <div>
    <v-card class="mb-4">
      <v-card-title class="text-h5">
        <v-icon class="mr-2">mdi-lead-pencil</v-icon>
        กรอกคะแนน (Fill Scores)
      </v-card-title>
      <v-card-subtitle>แบบกริดตัวชี้วัด (score/yes-no/note), อัปโหลดไฟล์หลักฐานประกอบ, บันทึก/ยืนยันผล</v-card-subtitle>
    </v-card>

    <v-card class="mb-4">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <div class="text-subtitle-2 text-grey">ครูผู้ถูกประเมิน</div>
            <div class="text-h6">{{ evaluateeInfo.name }}</div>
          </v-col>
          <v-col cols="12" md="6">
            <div class="text-subtitle-2 text-grey">แผนก</div>
            <div class="text-h6">{{ evaluateeInfo.department }}</div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Topics และ Indicators -->
    <div v-for="topic in topics" :key="topic.id" class="mb-4">
      <v-card>
        <v-card-title class="bg-grey-lighten-3">
          {{ topic.code }} - {{ topic.title_th }}
          <v-chip class="ml-2" size="small" color="info">น้ำหนัก {{ topic.weight }}</v-chip>
        </v-card-title>
        <v-card-text>
          <div v-for="indicator in topic.indicators" :key="indicator.id" class="mb-4 pa-3 border rounded">
            <div class="font-weight-bold mb-2">{{ indicator.code }} - {{ indicator.name_th }}</div>
            <div class="text-caption text-grey mb-3">{{ indicator.description }}</div>
            
            <!-- Score input -->
            <v-row v-if="indicator.type === 'score_1_4'">
              <v-col cols="12" md="4">
                <v-slider
                  v-model="indicator.score"
                  :min="indicator.min_score"
                  :max="indicator.max_score"
                  :step="0.5"
                  show-ticks
                  thumb-label
                  label="คะแนน"
                  :color="indicator.score >= 3 ? 'success' : indicator.score >= 2 ? 'warning' : 'error'"
                />
              </v-col>
              <v-col cols="12" md="8">
                <v-textarea
                  v-model="indicator.notes"
                  label="หมายเหตุ"
                  rows="2"
                  density="comfortable"
                />
              </v-col>
            </v-row>
            
            <!-- Yes/No input -->
            <v-row v-else-if="indicator.type === 'yes_no'">
              <v-col cols="12" md="4">
                <v-radio-group v-model="indicator.value_yes_no" inline>
                  <v-radio label="ใช่" :value="1" color="success" />
                  <v-radio label="ไม่ใช่" :value="0" color="error" />
                </v-radio-group>
              </v-col>
              <v-col cols="12" md="8">
                <v-textarea
                  v-model="indicator.notes"
                  label="หมายเหตุ"
                  rows="2"
                  density="comfortable"
                />
              </v-col>
            </v-row>
            
            <!-- File upload -->
            <v-file-input
              v-model="indicator.files"
              label="แนบไฟล์หลักฐาน (ถ้ามี)"
              prepend-icon="mdi-paperclip"
              density="comfortable"
              multiple
              chips
              show-size
            />
          </div>
        </v-card-text>
      </v-card>
    </div>

    <!-- Actions -->
    <v-card>
      <v-card-actions class="justify-end">
        <v-btn @click="router.back()">ยกเลิก</v-btn>
        <v-btn color="warning" @click="saveDraft">บันทึกแบบร่าง</v-btn>
        <v-btn color="success" @click="submitScores">ยืนยันและส่ง</v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

import { ref } from 'vue'

const router = useRouter()

const evaluateeInfo = ref({
  name: 'ครูไอที 01',
  department: 'เทคโนโลยีสารสนเทศ'
})

const topics = ref([
  {
    id: 1,
    code: 'TOP1',
    title_th: 'การจัดการเรียนการสอน',
    weight: 0.30,
    indicators: [
      { id: 1, code: 'T1-PLAN', name_th: 'แผนการจัดการเรียนรู้', description: 'แผนการสอนสอดคล้องมาตรฐาน', type: 'score_1_4', min_score: 1, max_score: 4, score: 3, notes: '', files: [] },
      { id: 2, code: 'T1-MEDIA', name_th: 'สื่อการเรียนรู้', description: 'ใบงาน/แบบฝึก/มัลติมีเดีย', type: 'score_1_4', min_score: 1, max_score: 4, score: 3.5, notes: '', files: [] },
      { id: 3, code: 'T1-REFLECT', name_th: 'บันทึกหลังการสอน', description: 'สะท้อนผลและการปรับปรุง', type: 'yes_no', value_yes_no: 1, notes: '', files: [] }
    ]
  },
  {
    id: 2,
    code: 'TOP2',
    title_th: 'การบริหารจัดการชั้นเรียน',
    weight: 0.20,
    indicators: [
      { id: 4, code: 'T2-CHART', name_th: 'แผนภูมิ/กฎ/ตารางเวร', description: 'แผนผังที่นั่ง กฎห้องเรียน', type: 'yes_no', value_yes_no: null, notes: '', files: [] }
    ]
  }
])

function saveDraft() {
  console.log('Saving draft...')
  alert('บันทึกแบบร่างสำเร็จ')
}

function submitScores() {
  console.log('Submitting scores...')
  alert('ส่งคะแนนสำเร็จ')
  router.push('/eval/tasks')
}
</script>
