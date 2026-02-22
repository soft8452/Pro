<!-- pages/reports/index.vue -->
<template>
  <div>
    <v-card class="mb-4">
      <v-card-title class="text-h5">
        <v-icon class="mr-2">mdi-chart-areaspline</v-icon>
        รายงาน (Reports)
      </v-card-title>
      <v-card-subtitle>รายงานสรุปผลต่างๆ</v-card-subtitle>
    </v-card>

    <v-row>
      <v-col cols="12" md="6">
        <v-card hover @click="router.push('/reports/normalized')">
          <v-card-text class="pa-6">
            <div class="d-flex align-center">
              <v-icon size="64" color="primary" class="mr-4">mdi-chart-bar</v-icon>
              <div>
                <div class="text-h5 mb-2">Normalized Report</div>
                <div class="text-body-2 text-grey">รายงานคะแนนมาตรฐาน /60</div>
              </div>
            </div>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn color="primary" variant="text">ดูรายงาน</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card hover @click="router.push('/reports/progress')">
          <v-card-text class="pa-6">
            <div class="d-flex align-center">
              <v-icon size="64" color="success" class="mr-4">mdi-progress-check</v-icon>
              <div>
                <div class="text-h5 mb-2">Progress Report</div>
                <div class="text-body-2 text-grey">ความคืบหน้าการประเมินตามแผนก</div>
              </div>
            </div>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn color="success" variant="text">ดูรายงาน</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card hover>
          <v-card-text class="pa-6">
            <div class="d-flex align-center">
              <v-icon size="64" color="info" class="mr-4">mdi-account-group</v-icon>
              <div>
                <div class="text-h5 mb-2">By Department</div>
                <div class="text-body-2 text-grey">รายงานแยกตามแผนก</div>
              </div>
            </div>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn color="info" variant="text" disabled>Coming Soon</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card hover>
          <v-card-text class="pa-6">
            <div class="d-flex align-center">
              <v-icon size="64" color="warning" class="mr-4">mdi-calendar-range</v-icon>
              <div>
                <div class="text-h5 mb-2">By Period</div>
                <div class="text-body-2 text-grey">รายงานแยกตามรอบการประเมิน</div>
              </div>
            </div>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn color="warning" variant="text" disabled>Coming Soon</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const router = useRouter()
</script>
