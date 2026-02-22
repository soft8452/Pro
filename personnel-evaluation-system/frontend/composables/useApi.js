// composables/useApi.js
export const useApi = () => {
  const { $api, $axios } = useNuxtApp()
  const http = $axios || $api  // รองรับทั้ง $axios และ $api
  
  // Helper: unwrap axios response to get data directly
  const unwrap = (promise) => promise.then(res => res.data)
  
  return {
    // Topics
    topics: {
      list: () => unwrap(http.get('/api/topics')),
      get: (id) => unwrap(http.get(`/api/topics/${id}`)),
      create: (data) => unwrap(http.post('/api/topics', data)),
      update: (id, data) => unwrap(http.put(`/api/topics/${id}`, data)),
      delete: (id) => unwrap(http.delete(`/api/topics/${id}`))
    },
    
    // Indicators
    indicators: {
      list: (params) => unwrap(http.get('/api/indicators', { params })),
      get: (id) => unwrap(http.get(`/api/indicators/${id}`)),
      create: (data) => unwrap(http.post('/api/indicators', data)),
      update: (id, data) => unwrap(http.put(`/api/indicators/${id}`, data)),
      delete: (id) => unwrap(http.delete(`/api/indicators/${id}`)),
      evidenceTypes: (id) => unwrap(http.get(`/api/indicators/${id}/evidence-types`))
    },
    
    // Periods
    periods: {
      list: () => unwrap(http.get('/api/periods')),
      active: () => unwrap(http.get('/api/periods/active')),
      get: (id) => unwrap(http.get(`/api/periods/${id}`)),
      create: (data) => unwrap(http.post('/api/periods', data)),
      update: (id, data) => unwrap(http.put(`/api/periods/${id}`, data)),
      toggle: (id) => unwrap(http.patch(`/api/periods/${id}/toggle`)),
      delete: (id) => unwrap(http.delete(`/api/periods/${id}`))
    },
    
    // Departments
    departments: {
      list: () => unwrap(http.get('/api/departments')),
      get: (id) => unwrap(http.get(`/api/departments/${id}`)),
      create: (data) => unwrap(http.post('/api/departments', data)),
      update: (id, data) => unwrap(http.put(`/api/departments/${id}`, data)),
      delete: (id) => unwrap(http.delete(`/api/departments/${id}`))
    },
    
    // Assignments
    assignments: {
      list: (params) => unwrap(http.get('/api/assignments', { params })),
      get: (id) => unwrap(http.get(`/api/assignments/${id}`)),
      create: (data) => unwrap(http.post('/api/assignments', data)),
      update: (id, data) => unwrap(http.put(`/api/assignments/${id}`, data)),
      cancel: (id) => unwrap(http.patch(`/api/assignments/${id}/cancel`)),
      delete: (id) => unwrap(http.delete(`/api/assignments/${id}`))
    },
    
    // Results
    results: {
      list: (params) => unwrap(http.get('/api/results', { params })),
      get: (id) => unwrap(http.get(`/api/results/${id}`)),
      create: (data) => unwrap(http.post('/api/results', data)),
      update: (id, data) => unwrap(http.put(`/api/results/${id}`, data)),
      submit: (id) => unwrap(http.patch(`/api/results/${id}/submit`)),
      delete: (id) => unwrap(http.delete(`/api/results/${id}`))
    },
    
    // Users
    users: {
      list: () => unwrap(http.get('/api/users')),
      get: (id) => unwrap(http.get(`/api/users/${id}`)),
      create: (data) => unwrap(http.post('/api/users', data)),
      update: (id, data) => unwrap(http.put(`/api/users/${id}`, data)),
      delete: (id) => unwrap(http.delete(`/api/users/${id}`))
    },
    
    // Reports
    reports: {
      normalized: (params) => unwrap(http.get('/api/task3/reports/normalized', { params })),
      progress: (params) => unwrap(http.get('/api/task5/reports/progress', { params }))
    }
  }
}
