<!-- pages/settings.vue -->
<template>
  <div>
    <v-card class="mb-4">
      <v-card-title class="text-h5">
        <v-icon class="mr-2">mdi-cog-outline</v-icon>
        ตั้งค่าระบบ (Settings)
      </v-card-title>
      <v-card-subtitle>การตั้งค่าระบบและโปรไฟล์ผู้ใช้</v-card-subtitle>
    </v-card>

    <v-row>
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>โปรไฟล์</v-card-title>
          <v-card-text>
            <p>จัดการข้อมูลส่วนตัว เปลี่ยนรหัสผ่าน</p>
          </v-card-text>
          <v-card-actions>
            <v-btn color="primary" variant="text">แก้ไขโปรไฟล์</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>การแจ้งเตือน</v-card-title>
          <v-card-text>
            <p>ตั้งค่าการรับการแจ้งเตือนทาง Email</p>
          </v-card-text>
          <v-card-actions>
            <v-btn color="primary" variant="text" disabled>Coming Soon</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'dashboard', middleware: 'auth' })
</script>
