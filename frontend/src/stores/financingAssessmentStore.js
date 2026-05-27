import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../services/api'

export const useFinancingAssessmentStore = defineStore('financingAssessment', () => {
  const assessments = ref([])
  const loading = ref(false)
  const saving = ref(false)
  const error = ref(null)
  const lastSaved = ref(null)

  const fetchAssessments = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await api.get('/assessments')
      assessments.value = response.data.data || []
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to load saved assessments'
    } finally {
      loading.value = false
    }
  }

  const saveAssessment = async (payload) => {
    saving.value = true
    error.value = null
    try {
      const response = await api.post('/assessments', payload)
      const created = response.data.data || response.data
      assessments.value.unshift(created)
      lastSaved.value = new Date()
      return created
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to save assessment'
      throw err
    } finally {
      saving.value = false
    }
  }

  const getAssessmentById = async (id) => {
    try {
      const response = await api.get(`/assessments/${id}`)
      return response.data.data || response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch assessment'
      return null
    }
  }

  return {
    assessments,
    loading,
    saving,
    error,
    lastSaved,
    fetchAssessments,
    saveAssessment,
    getAssessmentById,
  }
})
