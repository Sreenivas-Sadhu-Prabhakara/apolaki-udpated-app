import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../services/api'

export const useMarketplaceStore = defineStore('marketplace', () => {
  const products = ref([])
  const currentProduct = ref(null)
  const reviews = ref([])
  const wishlist = ref([])
  const loading = ref(false)
  const error = ref(null)

  const fetchProducts = async (category = null, search = null) => {
    loading.value = true
    error.value = null
    try {
      let url = '/marketplace/products'
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (category && category !== 'all') {
        if (!search) {
          url = `/marketplace/products/category/${category}`
        } else {
          params.set('category', category)
        }
      }
      const queryString = params.toString()
      const response = await api.get(queryString ? `${url}?${queryString}` : url)
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

  const fetchReviews = async (productId) => {
    try {
      const response = await api.get(`/marketplace/products/${productId}/reviews`)
      reviews.value = response.data.data || []
      return reviews.value
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch reviews'
      return []
    }
  }

  const createReview = async (productId, { rating, title, comment }) => {
    try {
      const response = await api.post(`/marketplace/products/${productId}/reviews`, { rating, title, comment })
      const review = response.data.data || response.data
      reviews.value.unshift(review)
      return review
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to create review'
      throw err
    }
  }

  const fetchWishlist = async () => {
    try {
      const response = await api.get('/marketplace/wishlist')
      wishlist.value = response.data.data || []
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch wishlist'
    }
  }

  const addToWishlist = async (productId) => {
    try {
      await api.post(`/marketplace/wishlist/${productId}`)
      // Refresh wishlist
      await fetchWishlist()
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to add to wishlist'
      throw err
    }
  }

  const removeFromWishlist = async (productId) => {
    try {
      await api.delete(`/marketplace/wishlist/${productId}`)
      wishlist.value = wishlist.value.filter(i => i.id !== productId)
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to remove from wishlist'
      throw err
    }
  }

  const isInWishlist = (productId) => {
    return wishlist.value.some(item => item.id === productId)
  }

  return {
    products,
    currentProduct,
    reviews,
    wishlist,
    loading,
    error,
    fetchProducts,
    fetchProduct,
    fetchReviews,
    createReview,
    fetchWishlist,
    addToWishlist,
    removeFromWishlist,
    isInWishlist
  }
})
