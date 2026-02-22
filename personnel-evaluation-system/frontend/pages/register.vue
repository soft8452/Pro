<!-- pages/register.vue -->
<template>
  <div class="container mx-auto px-4 py-12 max-w-md">
    <v-card>
      <v-card-title class="text-xl">สมัครสมาชิก</v-card-title>
      <v-card-text>
        <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
          <v-text-field
            v-model="name_th"
            label="ชื่อ-นามสกุล (ภาษาไทย)"
            :rules="[r => !!r || 'กรอกชื่อ']"
            prepend-inner-icon="mdi-account-outline"
            required
          />
          
          <v-text-field
            v-model="email"
            label="Email"
            type="email"
            :rules="[r => !!r || 'กรอกอีเมล', r => /.+@.+\..+/.test(r) || 'อีเมลไม่ถูกต้อง']"
            prepend-inner-icon="mdi-email-outline"
            required
          />
          
          <v-text-field
            v-model="password"
            label="Password"
            :type="showPw ? 'text' : 'password'"
            :append-inner-icon="showPw ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append-inner="showPw = !showPw"
            prepend-inner-icon="mdi-lock-outline"
            :rules="[r => !!r || 'กรอกรหัสผ่าน', r => r.length >= 6 || 'รหัสผ่านอย่างน้อย 6 ตัวอักษร']"
            required
          />
          
          <v-text-field
            v-model="confirmPassword"
            label="Confirm Password"
            :type="showPw ? 'text' : 'password'"
            prepend-inner-icon="mdi-lock-check-outline"
            :rules="[r => !!r || 'ยืนยันรหัสผ่าน', r => r === password || 'รหัสผ่านไม่ตรงกัน']"
            required
          />
          
          <v-select
            v-model="department_id"
            label="แผนก (ถ้ามี)"
            :items="departments"
            item-title="name_th"
            item-value="id"
            prepend-inner-icon="mdi-office-building-outline"
            clearable
          />
          
          <v-alert v-if="errorMsg" type="error" density="comfortable" variant="tonal">
            {{ errorMsg }}
          </v-alert>
          
          <v-alert v-if="successMsg" type="success" density="comfortable" variant="tonal">
            {{ successMsg }}
          </v-alert>
          
          <v-card-actions class="px-0">
            <v-btn text @click="router.push('/login')">เข้าสู่ระบบ</v-btn>
            <v-spacer />
            <v-btn :loading="loading" color="primary" type="submit">สมัครสมาชิก</v-btn>
          </v-card-actions>
        </form>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'auth-login', ssr: false })

import { ref, onMounted } from 'vue'

const { $api } = useNuxtApp()
const router = useRouter()

const name_th = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const department_id = ref(null)
const departments = ref([])
const showPw = ref(false)
const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

onMounted(async () => {
  // โหลดรายชื่อแผนก
  try {
    const { data } = await $api.get('/api/departments')
    departments.value = data
  } catch (e) {
    console.error('Load departments error:', e)
  }
})

const onSubmit = async () => {
  errorMsg.value = ''
  successMsg.value = ''
  
  if (password.value !== confirmPassword.value) {
    errorMsg.value = 'รหัสผ่านไม่ตรงกัน'
    return
  }
  
  loading.value = true
  try {
    const { data } = await $api.post('/api/auth/register', {
      name_th: name_th.value,
      email: email.value,
      password: password.value,
      department_id: department_id.value
    })
    
    if (data.success) {
      successMsg.value = data.message || 'สมัครสมาชิกสำเร็จ! กรุณารอการอนุมัติจากผู้ดูแลระบบ'
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    }
  } catch (e) {
    errorMsg.value = e.response?.data?.message || e.message || 'Registration error'
    console.error('REGISTER ERROR:', e)
  } finally {
    loading.value = false
  }
}
</script>
