// middleware/auth.js
// ตรวจสอบว่า user login แล้วหรือยัง

export default defineNuxtRouteMiddleware((to, from) => {
  // ข้าม middleware สำหรับหน้า login, register
  const publicPages = ['/login', '/register', '/forgot']
  if (publicPages.includes(to.path)) {
    return
  }

  // ตรวจสอบ token จาก auth store หรือ localStorage
  let token = null
  if (process.client) {
    try {
      // ใช้ key เดียวกับ auth store
      token = localStorage.getItem('auth_token')
    } catch (e) {}
  }

  // ถ้าไม่มี token ให้ redirect ไป login
  if (!token) {
    return navigateTo('/login')
  }
})
