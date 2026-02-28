<template>
  <div class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">☀️ Solar Marketplace</h1>
        <p class="mt-2 text-gray-600">Browse panels, inverters, batteries, and more.</p>
      </div>

      <!-- Category Filter -->
      <div class="flex flex-wrap gap-2 mb-8">
        <button
          v-for="cat in categories"
          :key="cat.value"
          @click="activeCategory = cat.value"
          :class="[
            'px-4 py-2 rounded-full text-sm font-medium transition',
            activeCategory === cat.value
              ? 'bg-orange-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
          ]"
        >
          {{ cat.label }}
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-20 text-gray-500">Loading products…</div>

      <!-- Error -->
      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
        {{ error }}
      </div>

      <!-- Products Grid -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div
          v-for="product in filteredProducts"
          :key="product.id"
          class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition"
        >
          <div class="bg-gradient-to-br from-orange-50 to-yellow-50 h-40 flex items-center justify-center text-5xl">
            {{ categoryIcon(product.category) }}
          </div>
          <div class="p-5">
            <span class="text-xs font-semibold uppercase tracking-wide text-orange-600">{{ product.category }}</span>
            <h3 class="mt-1 text-lg font-bold text-gray-900">{{ product.name }}</h3>
            <p class="mt-1 text-sm text-gray-500 line-clamp-2">{{ product.description || 'High-quality solar equipment.' }}</p>
            <div class="mt-4 flex items-center justify-between">
              <span class="text-xl font-bold text-gray-900">${{ Number(product.price).toLocaleString() }}</span>
              <span v-if="product.inventory > 0" class="text-xs text-green-600 font-medium">In Stock ({{ product.inventory }})</span>
              <span v-else class="text-xs text-red-500 font-medium">Out of Stock</span>
            </div>
            <div v-if="product.rating" class="mt-2 flex items-center gap-1">
              <span class="text-yellow-500">★</span>
              <span class="text-sm text-gray-600">{{ product.rating }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="!loading && !error && filteredProducts.length === 0" class="text-center py-20 text-gray-400">
        No products found in this category.
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import api from '../services/api'

const products = ref([])
const loading = ref(true)
const error = ref(null)
const activeCategory = ref('all')

const categories = [
  { value: 'all', label: 'All' },
  { value: 'panels', label: '🔲 Panels' },
  { value: 'inverters', label: '⚡ Inverters' },
  { value: 'batteries', label: '🔋 Batteries' },
  { value: 'ev-chargers', label: '🚗 EV Chargers' },
  { value: 'monitoring', label: '📊 Monitoring' },
  { value: 'kits', label: '📦 Kits' },
]

const filteredProducts = computed(() => {
  if (activeCategory.value === 'all') return products.value
  return products.value.filter(p => p.category === activeCategory.value)
})

function categoryIcon(cat) {
  const icons = { panels: '🔲', inverters: '⚡', batteries: '🔋', 'ev-chargers': '🚗', monitoring: '📊', kits: '📦' }
  return icons[cat] || '☀️'
}

onMounted(async () => {
  try {
    const res = await api.get('/marketplace/products')
    products.value = res.data.data || []
  } catch (e) {
    error.value = e.response?.data?.error || 'Failed to load products'
  } finally {
    loading.value = false
  }
})
</script>
