const bcrypt = require('bcrypt')
;(async()=>{
  const h = '$2b$10$V0GTPQ/2Ap5r0nzE49FjfOW7xmXuSPQ8m7P81jwKrFFltwCvBXTsy'
  const ok = await bcrypt.compare('password123', h)
  console.log('compare password123 =>', ok)
})()
