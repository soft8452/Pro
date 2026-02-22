// ~/composables/useMenu.js
import { ref, isRef, computed } from 'vue'

// ถ้า backend ส่ง 'evaluatee' ให้ map มาเป็น 'user'
function normalizeRole(r) {
  const x = (r || '').toString().toLowerCase()
  if (x === 'evaluatee') return 'evaluatee'
  return ['admin', 'evaluator', 'evaluatee'].includes(x) ? x : 'evaluatee'
}

const MAP = {
  admin: [
    {
      label: 'MAIN',
      items: [
        { label: 'Dashboard', to: '/', icon: 'mdi-view-dashboard-outline' },
      ]
    },
    {
      label: 'MANAGEMENT',
      items: [
        { label: 'Users', to: '/admin/users', icon: 'mdi-account-cog-outline' },
        { label: 'Evaluation Topics', to: '/admin/topics', icon: 'mdi-format-list-bulleted' },
        { label: 'Indicators', to: '/admin/indicators', icon: 'mdi-checkbox-marked-outline' },
        { label: 'Evaluation Periods', to: '/admin/periods', icon: 'mdi-calendar-range' },
        { label: 'Assignments', to: '/admin/assignments', icon: 'mdi-account-multiple-check' },
        { label: 'Evaluation Results', to: '/admin/results', icon: 'mdi-file-chart-outline' },
      ]
    },
    {
      label: 'REPORTS',
      items: [
        { label: 'Normalized /60', to: '/reports/normalized', icon: 'mdi-chart-bar' },
        { label: 'Progress', to: '/reports/progress', icon: 'mdi-progress-check' },
      ]
    },
    {
      label: 'SYSTEM',
      items: [
        { label: 'System Health', href: 'http://localhost:7000/health', target: '_blank', icon: 'mdi-heart-pulse' },
        { label: 'API Docs', href: 'http://localhost:7000/docs', target: '_blank', icon: 'mdi-book-open-outline' },
      ]
    }
  ],

  evaluator: [
    {
      label: 'MAIN',
      items: [
        { label: 'Dashboard', to: '/', icon: 'mdi-view-dashboard-outline' },
      ]
    },
    {
      label: 'EVALUATION',
      items: [
        { label: 'My Assignments', to: '/evaluator/assignments', icon: 'mdi-clipboard-check-outline' },
        { label: 'History', to: '/evaluator/history', icon: 'mdi-history' },
      ]
    },
    {
      label: 'REPORTS',
      items: [
        { label: 'Normalized /60', to: '/reports/normalized', icon: 'mdi-chart-bar' },
      ]
    }
  ],

  evaluatee: [
    {
      label: 'MAIN',
      items: [
        { label: 'Dashboard', to: '/', icon: 'mdi-view-dashboard-outline' },
      ]
    },
    {
      label: 'MY EVALUATION',
      items: [
        { label: 'My Evaluation', to: '/me/evaluation', icon: 'mdi-clipboard-account-outline' },
        { label: 'Upload Evidence', to: '/me/evidence', icon: 'mdi-file-upload-outline' },
        { label: 'Personal Report', to: '/me/report', icon: 'mdi-file-document-outline' },
      ]
    }
  ]
}

export function useMenu(roleInput = 'evaluatee') {
  const r = isRef(roleInput) ? roleInput : ref(roleInput)

  const menu = computed(() => {
    const key = normalizeRole(r.value)
    return MAP[key] || MAP.evaluatee
  })

  return { menu }
}
