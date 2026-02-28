import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../services/api'

export const useMarketplaceStore = defineStore('marketplace', () => {
  const products = ref([])
  const currentProduct = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const fetchProducts = async (category = null) => {
    loading.value = true
    error.value = null
    try {
      const url = category && category !== 'all'
        ? `/marketplace/products/category/${category}`
        : '/marketplace/products'
      const response = await api.get(url)
      products.value = response.data.data || []
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch products'
    } finally {
      loading.value = false
    }
  }

  const fetchProduct = async (id) => {
    loading.value = true
    error.value = null
    try {
      const response = await api.get(`/marketplace/products/${id}`)
      currentProduct.value = response.data.data || response.data
      return currentProduct.value
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch product'
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    products,
    currentProduct,
    loading,
    error,
    fetchProducts,
    fetchProduct
  }
})
