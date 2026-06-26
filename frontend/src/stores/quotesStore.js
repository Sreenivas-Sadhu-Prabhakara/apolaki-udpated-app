import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import quotesApi from '../services/quotesApi'

/**
 * Quotes store (Pinia setup style).
 *
 * Wraps quotesApi for the dealer Quote Generator view: stateless calculation,
 * persistence, and the dealer's "My quotes" list. All actions surface the
 * { success, data, error, code } envelope from the backend.
 */
export const useQuotesStore = defineStore('quotes', () => {
  const quotes = ref([])          // the dealer's saved quotes (summaries)
  const current = ref(null)       // the most recent calculated/saved quote
  const loading = ref(false)      // list/get/save in flight
  const calculating = ref(false)  // calculate in flight
  const error = ref(null)

  const hasQuotes = computed(() => quotes.value.length > 0)
  const lastValidation = computed(() => current.value?.validation || null)

  function extractError(err, fallback) {
    return err.response?.data?.error || err.message || fallback
  }

  /**
   * Stateless calculate — sets `current` to the computed quote.
   * Returns the QUOTE on success, or null (with `error` set) on failure.
   */
  const calculate = async (payload) => {
    calculating.value = true
    error.value = null
    try {
      const res = await quotesApi.calculate(payload)
      current.value = res.data.data
      return current.value
    } catch (err) {
      error.value = extractError(err, 'Failed to calculate quote.')
      // Surface backend input-validation details when present (400 path).
      const validation = err.response?.data?.data?.validation || err.response?.data?.validation
      if (validation) current.value = { ...(current.value || {}), validation }
      return null
    } finally {
      calculating.value = false
    }
  }

  /**
   * Persist a quote. On success prepends it to the list and sets `current`.
   */
  const save = async (payload) => {
    loading.value = true
    error.value = null
    try {
      const res = await quotesApi.create(payload)
      const saved = res.data.data
      current.value = saved
      quotes.value = [saved, ...quotes.value.filter(q => q.id !== saved.id)]
      return saved
    } catch (err) {
      error.value = extractError(err, 'Failed to save quote.')
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Load the dealer's quotes (admins see all).
   */
  const fetchQuotes = async () => {
    loading.value = true
    error.value = null
    try {
      const res = await quotesApi.list()
      quotes.value = res.data.data || []
      return quotes.value
    } catch (err) {
      error.value = extractError(err, 'Failed to load quotes.')
      return []
    } finally {
      loading.value = false
    }
  }

  const fetchQuote = async (id) => {
    loading.value = true
    error.value = null
    try {
      const res = await quotesApi.get(id)
      return res.data.data
    } catch (err) {
      error.value = extractError(err, 'Failed to load quote.')
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Patch status/notes on a saved quote; keeps the list row in sync.
   */
  const updateQuote = async (id, patch) => {
    error.value = null
    try {
      const res = await quotesApi.update(id, patch)
      const updated = res.data.data
      quotes.value = quotes.value.map(q => (q.id === id ? { ...q, ...updated } : q))
      if (current.value?.id === id) current.value = { ...current.value, ...updated }
      return updated
    } catch (err) {
      error.value = extractError(err, 'Failed to update quote.')
      return null
    }
  }

  const removeQuote = async (id) => {
    error.value = null
    try {
      await quotesApi.remove(id)
      quotes.value = quotes.value.filter(q => q.id !== id)
      if (current.value?.id === id) current.value = null
      return true
    } catch (err) {
      error.value = extractError(err, 'Failed to delete quote.')
      return false
    }
  }

  const clearCurrent = () => {
    current.value = null
  }

  return {
    quotes,
    current,
    loading,
    calculating,
    error,
    hasQuotes,
    lastValidation,
    calculate,
    save,
    fetchQuotes,
    fetchQuote,
    updateQuote,
    removeQuote,
    clearCurrent
  }
})

export default useQuotesStore
