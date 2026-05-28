<template>
  <div class="min-h-screen py-8 px-4 sm:px-6 lg:px-8" :class="isDark ? 'bg-slate-900' : 'bg-gray-50'">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="flex justify-between items-start mb-8">
        <div>
          <h1 class="text-3xl font-bold" :class="isDark ? 'text-slate-100' : 'text-gray-900'">☀️ Solar Marketplace</h1>
          <p class="mt-2" :class="isDark ? 'text-slate-400' : 'text-gray-600'">Browse panels, inverters, batteries, and more.</p>
        </div>
        <div class="flex gap-3">
          <button @click="viewMode = 'grid'" :class="viewMode === 'grid' ? 'bg-orange-600 text-white' : 'bg-white text-gray-700 border border-gray-300'" class="px-3 py-2 rounded-lg text-sm font-medium transition">🔲 Grid</button>
          <button @click="showWishlist = !showWishlist" :class="showWishlist ? 'bg-red-600 text-white' : 'bg-white text-gray-700 border border-gray-300'" class="px-3 py-2 rounded-lg text-sm font-medium transition">
            ❤️ Wishlist ({{ marketplaceStore.wishlist.length }})
          </button>
          <button v-if="compareList.length > 0" @click="showCompare = !showCompare" class="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition">
            ⚖️ Compare ({{ compareList.length }})
          </button>
        </div>
      </div>

      <!-- Search Bar -->
      <div class="mb-6">
        <div class="relative">
          <input
            v-model="searchQuery"
            @input="debouncedSearch"
            type="text"
            placeholder="Search products by name, manufacturer, or description..."
            class="w-full rounded-xl px-5 py-3 pl-12 text-lg focus:ring-2 focus:ring-orange-500"
            :class="isDark ? 'bg-slate-800 border-slate-600 text-slate-100 placeholder-slate-400' : 'border border-gray-300'"
          />
          <span class="absolute left-4 top-4 text-gray-400">🔍</span>
          <button v-if="searchQuery" @click="clearSearch" class="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600">✕</button>
        </div>
      </div>

      <!-- Category Filter -->
      <div class="flex flex-wrap gap-2 mb-8">
        <button
          v-for="cat in categories"
          :key="cat.value"
          @click="filterByCategory(cat.value)"
          :class="[
            'px-4 py-2 rounded-full text-sm font-medium transition',
            activeCategory === cat.value
              ? 'bg-orange-600 text-white'
              : isDark ? 'bg-slate-800 text-slate-300 border border-slate-600 hover:bg-slate-700' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
          ]"
        >
          {{ cat.label }}
        </button>
      </div>
      
      <!-- Marketplace Tabs -->
      <div class="flex border-b mb-6" :class="isDark ? 'border-slate-700' : 'border-gray-200'">
        <button 
          @click="activeTab = 'equipment'" 
          class="px-6 py-3 font-medium text-sm transition-colors border-b-2"
          :class="activeTab === 'equipment' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
        >
          📦 Equipment & Products
        </button>
        <button 
          @click="activeTab = 'installers'" 
          class="px-6 py-3 font-medium text-sm transition-colors border-b-2"
          :class="activeTab === 'installers' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
        >
          🛠️ Vetted Installers & Services
        </button>
      </div>

      <div v-if="activeTab === 'installers'">
        <!-- Installer/Service Filters -->
        <div class="flex flex-wrap gap-3 mb-6 items-center">
            <span class="text-sm font-medium text-gray-500">Service Type:</span>
            <button
              v-for="type in serviceTypes"
              :key="type.value"
              @click="activeServiceType = type.value"
              :class="[
                'px-3 py-1.5 rounded-full text-xs font-medium transition',
                activeServiceType === type.value
                  ? 'bg-blue-600 text-white'
                  : isDark ? 'bg-slate-800 text-slate-300 border border-slate-600 hover:bg-slate-700' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
              ]"
            >
              {{ type.label }}
            </button>
            
            <div class="ml-auto flex items-center gap-2">
                <span class="text-sm font-medium text-gray-500">📍 Region:</span>
                <select v-model="selectedProvince" class="rounded-lg border px-3 py-1.5 text-sm" :class="isDark ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-gray-300'">
                    <option value="all">Any Region</option>
                    <option value="NCR">Metro Manila (NCR)</option>
                    <option value="Bulacan">Bulacan</option>
                    <option value="Cavite">Cavite</option>
                    <option value="Laguna">Laguna</option>
                    <option value="Cebu">Cebu</option>
                </select>
            </div>
        </div>

        <!-- Installers List -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div v-for="installer in filteredInstallers" :key="installer.id" 
                 class="border rounded-xl p-5 hover:shadow-lg transition flex flex-col"
                 :class="isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'">
                
                <div class="flex gap-4">
                    <div class="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center text-2xl flex-shrink-0">
                        {{ installer.icon || '👷' }}
                    </div>
                    <div class="flex-1">
                        <div class="flex justify-between items-start">
                            <h3 class="font-bold text-lg" :class="isDark ? 'text-white' : 'text-gray-900'">{{ installer.name }}</h3>
                            <span v-if="installer.verified" class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
                                ✓ Verified
                            </span>
                        </div>
                        <p class="text-sm text-gray-500 mt-1 flex items-center gap-1">
                            📍 {{ installer.provinces.join(', ') }}
                        </p>
                        <div class="flex items-center gap-2 mt-2">
                            <span class="text-yellow-500 text-sm">★ {{ installer.rating.toFixed(1) }}</span>
                            <span class="text-xs text-gray-400">({{ installer.reviewCount }} reviews)</span>
                            <span class="text-xs text-gray-400 mx-1">•</span>
                            <span class="text-xs font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-600">{{ installer.typeLabel }}</span>
                        </div>
                    </div>
                </div>
                
                <p class="mt-4 text-sm line-clamp-2 text-gray-600" :class="isDark ? 'text-gray-400' : ''">
                    {{ installer.description }}
                </p>
                
                <div class="mt-auto pt-4 flex gap-3">
                    <button v-if="installer.contact_enabled" @click="router.push(`/messaging?installerId=${installer.id}`)" class="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold py-2 rounded-lg text-sm transition" title="Message Installer">
                        💬 Message
                    </button>
                    <button v-if="installer.booking_enabled" @click="openActionModal(installer, 'book')" class="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 rounded-lg text-sm transition">
                        📅 Book
                    </button>
                    <button v-if="installer.scheduling_enabled" @click="openActionModal(installer, 'schedule')" class="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg text-sm transition">
                        🗓️ Schedule
                    </button>
                    <button v-if="installer.type === 'supplier'" @click="openActionModal(installer, 'add')" class="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded-lg text-sm transition">
                        ➕ Add
                    </button>
                </div>
            </div>
        </div>
        
        <div v-if="filteredInstallers.length === 0" class="text-center py-16 text-gray-500">
            No service providers found for the selected area.
        </div>
      </div>

      <!-- Wishlist Panel -->
      <div v-if="showWishlist && activeTab === 'equipment'" class="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold text-gray-900">❤️ My Wishlist</h2>
          <button @click="showWishlist = false" class="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>
        <div v-if="marketplaceStore.wishlist.length === 0" class="text-center py-8 text-gray-400">
          Your wishlist is empty. Click the ❤️ button on any product to save it.
        </div>
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div v-for="item in marketplaceStore.wishlist" :key="item.wishlist_id || item.id" class="flex items-center gap-4 border border-gray-200 rounded-lg p-4">
            <div class="text-3xl">{{ categoryIcon(item.category) }}</div>
            <div class="flex-1">
              <h4 class="font-bold text-gray-900">{{ item.name }}</h4>
              <p class="text-sm text-gray-500">{{ formatCurrency(item.price) }}</p>
            </div>
            <button @click="removeFromWishlist(item.id)" class="text-red-500 hover:text-red-700 text-sm">Remove</button>
          </div>
        </div>
      </div>

      <!-- Comparison Panel -->
      <div v-if="showCompare && compareList.length >= 2" class="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8 overflow-x-auto">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold text-gray-900">⚖️ Product Comparison</h2>
          <div class="flex gap-2">
            <button @click="compareList = []; showCompare = false" class="text-sm text-gray-500 hover:text-gray-700">Clear All</button>
            <button @click="showCompare = false" class="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
          </div>
        </div>
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b">
              <th class="text-left py-2 pr-4 text-gray-500">Feature</th>
              <th v-for="p in compareList" :key="p.id" class="py-2 px-4 text-left font-bold text-gray-900">
                {{ p.name }}
                <button @click="removeFromCompare(p.id)" class="ml-2 text-red-400 text-xs hover:text-red-600">✕</button>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-b"><td class="py-2 pr-4 text-gray-500">Category</td><td v-for="p in compareList" :key="p.id + '-cat'" class="py-2 px-4 capitalize">{{ p.category }}</td></tr>
            <tr class="border-b"><td class="py-2 pr-4 text-gray-500">Manufacturer</td><td v-for="p in compareList" :key="p.id + '-mfg'" class="py-2 px-4">{{ p.manufacturer || '—' }}</td></tr>
            <tr class="border-b"><td class="py-2 pr-4 text-gray-500">Price</td><td v-for="p in compareList" :key="p.id + '-price'" class="py-2 px-4 font-bold">{{ formatCurrency(p.price) }}</td></tr>
            <tr class="border-b"><td class="py-2 pr-4 text-gray-500">Rating</td><td v-for="p in compareList" :key="p.id + '-rating'" class="py-2 px-4">{{ p.rating ? `★ ${Number(p.rating).toFixed(1)} (${p.review_count || 0})` : 'No reviews' }}</td></tr>
            <tr class="border-b"><td class="py-2 pr-4 text-gray-500">Availability</td><td v-for="p in compareList" :key="p.id + '-inv'" class="py-2 px-4" :class="p.inventory > 0 ? 'text-green-600' : 'text-red-500'">{{ p.inventory > 0 ? `In Stock (${p.inventory})` : 'Out of Stock' }}</td></tr>
          </tbody>
        </table>
      </div>

      <!-- Loading -->
      <div v-if="marketplaceStore.loading" class="text-center py-20 text-gray-500">Loading products…</div>

      <!-- Error -->
      <div v-else-if="marketplaceStore.error" class="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
        {{ marketplaceStore.error }}
      </div>

      <!-- Product Detail Modal -->
      <div v-else-if="selectedProduct" class="bg-white rounded-xl shadow-lg border border-gray-200 p-8 mb-8">
        <button @click="selectedProduct = null" class="text-gray-400 hover:text-gray-600 text-sm mb-4 flex items-center gap-1">← Back to products</button>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div class="bg-linear-to-br from-orange-50 to-yellow-50 rounded-xl h-64 flex items-center justify-center text-7xl">
            {{ categoryIcon(selectedProduct.category) }}
          </div>
          <div>
            <span class="text-xs font-semibold uppercase tracking-wide text-orange-600">{{ selectedProduct.category }}</span>
            <h2 class="text-2xl font-bold text-gray-900 mt-1">{{ selectedProduct.name }}</h2>
            <p v-if="selectedProduct.manufacturer" class="text-sm text-gray-500 mt-1">by {{ selectedProduct.manufacturer }}</p>
            <p class="mt-3 text-gray-600">{{ selectedProduct.description || 'High-quality solar equipment.' }}</p>
            <div class="mt-4">
              <span class="text-3xl font-bold text-gray-900">{{ formatCurrency(selectedProduct.price) }}</span>
              <span class="ml-3 text-sm" :class="selectedProduct.inventory > 0 ? 'text-green-600' : 'text-red-500'">
                {{ selectedProduct.inventory > 0 ? `In Stock (${selectedProduct.inventory})` : 'Out of Stock' }}
              </span>
            </div>
            <div v-if="selectedProduct.rating" class="mt-2 flex items-center gap-2">
              <span class="text-yellow-500 text-lg">{{ '★'.repeat(Math.round(Number(selectedProduct.rating))) }}{{ '☆'.repeat(5 - Math.round(Number(selectedProduct.rating))) }}</span>
              <span class="text-sm text-gray-600">{{ Number(selectedProduct.rating).toFixed(1) }} ({{ selectedProduct.review_count || 0 }} reviews)</span>
            </div>
            <!-- Specs -->
            <div v-if="selectedProduct.specs && Object.keys(selectedProduct.specs).length > 0" class="mt-4 border-t pt-4">
              <h4 class="font-bold text-gray-700 mb-2">Specifications</h4>
              <div v-for="(val, key) in selectedProduct.specs" :key="key" class="flex justify-between py-1 text-sm border-b border-gray-100">
                <span class="text-gray-500 capitalize">{{ key.replace(/_/g, ' ') }}</span>
                <span class="font-medium text-gray-900">{{ val }}</span>
              </div>
            </div>
            <div class="mt-6 flex gap-3">
              <button @click="toggleWishlist(selectedProduct)" :class="marketplaceStore.isInWishlist(selectedProduct.id) ? 'bg-red-100 text-red-600 border-red-300' : 'bg-white text-gray-700 border-gray-300'" class="border px-4 py-2 rounded-lg text-sm font-medium transition">
                {{ marketplaceStore.isInWishlist(selectedProduct.id) ? '❤️ In Wishlist' : '🤍 Add to Wishlist' }}
              </button>
              <button @click="toggleCompare(selectedProduct)" :class="isInCompare(selectedProduct.id) ? 'bg-blue-100 text-blue-600 border-blue-300' : 'bg-white text-gray-700 border-gray-300'" class="border px-4 py-2 rounded-lg text-sm font-medium transition">
                {{ isInCompare(selectedProduct.id) ? '✓ In Comparison' : '⚖️ Compare' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Reviews Section -->
        <div class="mt-8 border-t pt-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-bold text-gray-900">Reviews ({{ productReviews.length }})</h3>
            <button @click="showReviewForm = !showReviewForm" class="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 transition">
              ✏️ Write Review
            </button>
          </div>

          <!-- Review Form -->
          <div v-if="showReviewForm" class="bg-gray-50 rounded-xl p-6 mb-6 border border-gray-200">
            <form @submit.prevent="handleSubmitReview" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                <div class="flex gap-2">
                  <button v-for="star in 5" :key="star" type="button" @click="reviewForm.rating = star" class="text-2xl transition" :class="star <= reviewForm.rating ? 'text-yellow-500' : 'text-gray-300'">★</button>
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input v-model="reviewForm.title" type="text" placeholder="Great product!" class="w-full border border-gray-300 rounded-lg px-4 py-2" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Comment</label>
                <textarea v-model="reviewForm.comment" rows="3" placeholder="Share your experience..." class="w-full border border-gray-300 rounded-lg px-4 py-2"></textarea>
              </div>
              <div class="flex gap-3">
                <button type="submit" :disabled="!reviewForm.rating" class="bg-orange-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 transition">Submit Review</button>
                <button type="button" @click="showReviewForm = false" class="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg">Cancel</button>
              </div>
            </form>
          </div>

          <!-- Reviews List -->
          <div v-if="productReviews.length === 0" class="text-center py-8 text-gray-400">No reviews yet. Be the first to review!</div>
          <div v-else class="space-y-4">
            <div v-for="review in productReviews" :key="review.id" class="border border-gray-200 rounded-lg p-4">
              <div class="flex justify-between items-start">
                <div>
                  <span class="text-yellow-500">{{ '★'.repeat(review.rating) }}{{ '☆'.repeat(5 - review.rating) }}</span>
                  <h4 v-if="review.title" class="font-bold text-gray-900 mt-1">{{ review.title }}</h4>
                </div>
                <span class="text-xs text-gray-400">{{ new Date(review.created_at).toLocaleDateString() }}</span>
              </div>
              <p v-if="review.comment" class="text-sm text-gray-600 mt-2">{{ review.comment }}</p>
              <p class="text-xs text-gray-400 mt-2">— {{ review.first_name || 'Anonymous' }} {{ (review.last_name || '')[0] || '' }}.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Products Grid -->
      <div v-else-if="activeTab === 'equipment'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div
          v-for="product in filteredProducts"
          :key="product.id"
          class="rounded-xl shadow-sm border overflow-hidden hover:shadow-lg transition cursor-pointer group"
          :class="isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'"
        >
          <div @click="selectProduct(product)" class="h-40 flex items-center justify-center text-5xl relative" :class="isDark ? 'bg-slate-700' : 'bg-linear-to-br from-orange-50 to-yellow-50'">
            {{ categoryIcon(product.category) }}
            <div class="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
              <button @click.stop="toggleWishlist(product)" class="bg-white rounded-full w-8 h-8 flex items-center justify-center shadow text-sm hover:bg-red-50">
                {{ marketplaceStore.isInWishlist(product.id) ? '❤️' : '🤍' }}
              </button>
              <button @click.stop="toggleCompare(product)" class="bg-white rounded-full w-8 h-8 flex items-center justify-center shadow text-sm hover:bg-blue-50">
                {{ isInCompare(product.id) ? '✓' : '⚖️' }}
              </button>
            </div>
          </div>
          <div @click="selectProduct(product)" class="p-5">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold uppercase tracking-wide text-orange-600">{{ product.category }}</span>
              <span v-if="product.manufacturer" class="text-xs" :class="isDark ? 'text-slate-500' : 'text-gray-400'">{{ product.manufacturer }}</span>
            </div>
            <h3 class="mt-1 text-lg font-bold" :class="isDark ? 'text-slate-100' : 'text-gray-900'">{{ product.name }}</h3>
            <p class="mt-1 text-sm line-clamp-2" :class="isDark ? 'text-slate-400' : 'text-gray-500'">{{ product.description || 'High-quality solar equipment.' }}</p>
            <div class="mt-4 flex items-center justify-between">
              <span class="text-xl font-bold" :class="isDark ? 'text-slate-100' : 'text-gray-900'">{{ formatCurrency(product.price) }}</span>
              <span v-if="product.inventory > 0" class="text-xs text-green-500 font-medium">In Stock</span>
              <span v-else class="text-xs text-red-500 font-medium">Out of Stock</span>
            </div>
            <div v-if="product.rating" class="mt-2 flex items-center gap-1">
              <span class="text-yellow-500">★</span>
              <span class="text-sm" :class="isDark ? 'text-slate-300' : 'text-gray-600'">{{ Number(product.rating).toFixed(1) }}</span>
              <span class="text-xs" :class="isDark ? 'text-slate-500' : 'text-gray-400'">({{ product.review_count || 0 }})</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'equipment' && !marketplaceStore.loading && !marketplaceStore.error && !selectedProduct && filteredProducts.length === 0" class="text-center py-20 text-gray-400">
        No products found. Try adjusting your search or filters.
      </div>

      <!-- Action Modal -->
      <div v-if="actionDealer" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden" :class="isDark ? 'bg-slate-900 border border-slate-700' : ''">
          <div class="p-6 border-b" :class="isDark ? 'border-slate-700' : 'border-gray-200'">
            <div class="flex justify-between items-center">
              <h2 class="text-xl font-bold capitalize" :class="isDark ? 'text-white' : 'text-gray-900'">{{ actionType }} Request</h2>
              <button @click="actionDealer = null" class="text-gray-500 hover:text-gray-700 transition transform hover:scale-110">✕</button>
            </div>
            <p class="text-sm text-gray-500 mt-1">Send a request to <strong class="text-gray-700">{{ actionDealer.name }}</strong></p>
          </div>
          
          <div class="p-6 space-y-4">
            <div v-if="actionType === 'book' || actionType === 'schedule'" class="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4">
                <p class="text-sm text-blue-800 flex items-start gap-2">
                    <span class="mt-0.5">💡</span>
                    <span>This request will automatically include your current system size estimate and roof type from your last Assessment.</span>
                </p>
            </div>
            
            <div v-if="actionType === 'schedule'">
              <label class="block text-sm font-medium mb-1" :class="isDark ? 'text-slate-300' : 'text-gray-700'">Preferred Date/Time</label>
              <input type="datetime-local" v-model="actionSchedule" class="w-full border rounded-lg px-4 py-2 text-sm" :class="isDark ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-gray-300'" />
            </div>

            <div v-if="actionType !== 'schedule'">
              <label class="block text-sm font-medium mb-1" :class="isDark ? 'text-slate-300' : 'text-gray-700'">Project Timeline</label>
              <select class="w-full border rounded-lg px-4 py-2 text-sm" :class="isDark ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-gray-300'">
                <option>Ready to start immediately</option>
                <option>Within 1-3 months</option>
                <option>Just exploring options</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-1" :class="isDark ? 'text-slate-300' : 'text-gray-700'">Additional Notes</label>
              <textarea v-model="actionNotes" rows="3" class="w-full border rounded-lg px-4 py-2 text-sm" :class="isDark ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-gray-300'" placeholder="Tell them about your specific requirements..."></textarea>
            </div>
          </div>
          
          <div class="p-6 border-t flex justify-end gap-3" :class="isDark ? 'border-slate-700 bg-slate-800/50' : 'border-gray-200 bg-gray-50'">
            <button @click="actionDealer = null" class="px-4 py-2 text-sm font-medium rounded-lg border hover:bg-gray-100 transition" :class="isDark ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-gray-300 text-gray-700'">Cancel</button>
            <button @click="submitAction" class="px-6 py-2 text-sm font-medium rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition flex items-center gap-2">
              <span v-if="submittingAction">Sending...</span>
              <span v-else>Send Request ✉️</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMarketplaceStore } from '../stores/marketplaceStore'
import { useThemeStore } from '../stores/themeStore'
import { formatCurrency } from '../utils/currency'

const router = useRouter()
const marketplaceStore = useMarketplaceStore()
const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDarkMode)
const activeCategory = ref('all')
const searchQuery = ref('')
const viewMode = ref('grid')
const showWishlist = ref(false)
const showCompare = ref(false)
const compareList = ref([])
const selectedProduct = ref(null)
const productReviews = ref([])
const showReviewForm = ref(false)

const activeTab = ref('equipment') // 'equipment' or 'installers'
const activeServiceType = ref('all')
const selectedProvince = ref('all')

const actionDealer = ref(null)
const actionType = ref('') // 'book', 'schedule', 'add'
const submittingAction = ref(false)
const actionNotes = ref('')
const actionSchedule = ref('')

// Use saved province from Assessment if available
onMounted(() => {
    try {
        const stored = localStorage.getItem('financingAssessmentState')
        if (stored) {
            const assessment = JSON.parse(stored)
            if (assessment.province && ['NCR', 'Bulacan', 'Cavite', 'Laguna', 'Cebu'].includes(assessment.province)) {
                selectedProvince.value = assessment.province
            }
        }
    } catch (e) {
        console.warn('Could not read assessment province for marketplace filter', e)
    }
})

const serviceTypes = [
  { value: 'all', label: 'All Services' },
  { value: 'installer', label: '🛠 Vetted Installers' },
  { value: 'supplier', label: '📦 Material Suppliers' },
  { value: 'consultant', label: '📋 Solar Consultants' },
  { value: 'maintenance', label: '🔧 Maintenance Crews' }
]

const filteredInstallers = computed(() => {
    return marketplaceStore.dealers.filter(installer => {
        const typeMatch = activeServiceType.value === 'all' || installer.type === activeServiceType.value
        // Assume installer.provinces is an array from JSONB. If it's a string, parse it.
        let provs = []
        try {
           provs = typeof installer.provinces === 'string' ? JSON.parse(installer.provinces) : (installer.provinces || [])
        } catch(e) {}

        const provinceMatch = selectedProvince.value === 'all' || provs.includes(selectedProvince.value)
        return typeMatch && provinceMatch
    })
})

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
  return marketplaceStore.products
})

function categoryIcon(cat) {
  const icons = { panels: '🔲', inverters: '⚡', batteries: '🔋', 'ev-chargers': '🚗', monitoring: '📊', kits: '📦' }
  return icons[cat] || '☀️'
}

let searchTimeout
function debouncedSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    marketplaceStore.fetchProducts(activeCategory.value, searchQuery.value || null)
  }, 300)
}

function clearSearch() {
  searchQuery.value = ''
  marketplaceStore.fetchProducts(activeCategory.value)
}

function filterByCategory(cat) {
  activeCategory.value = cat
  marketplaceStore.fetchProducts(cat, searchQuery.value || null)
}

async function selectProduct(product) {
  selectedProduct.value = product
  showReviewForm.value = false
  reviewForm.rating = 0
  reviewForm.title = ''
  reviewForm.comment = ''
  productReviews.value = await marketplaceStore.fetchReviews(product.id)
}

async function toggleWishlist(product) {
  try {
    if (marketplaceStore.isInWishlist(product.id)) {
      await marketplaceStore.removeFromWishlist(product.id)
    } else {
      await marketplaceStore.addToWishlist(product.id)
    }
  } catch (e) {
    console.error('Wishlist error:', e)
  }
}

function toggleCompare(product) {
  const idx = compareList.value.findIndex(p => p.id === product.id)
  if (idx !== -1) {
    compareList.value.splice(idx, 1)
  } else if (compareList.value.length < 4) {
    compareList.value.push(product)
  }
}

function isInCompare(productId) {
  return compareList.value.some(p => p.id === productId)
}

function removeFromCompare(productId) {
  compareList.value = compareList.value.filter(p => p.id !== productId)
}

async function removeFromWishlist(productId) {
  try {
    await marketplaceStore.removeFromWishlist(productId)
  } catch (e) {
    console.error('Remove wishlist error:', e)
  }
}

async function handleSubmitReview() {
  try {
    await marketplaceStore.createReview(selectedProduct.value.id, {
      rating: reviewForm.rating,
      title: reviewForm.title,
      comment: reviewForm.comment
    })
    productReviews.value = await marketplaceStore.fetchReviews(selectedProduct.value.id)
    showReviewForm.value = false
    reviewForm.rating = 0
    reviewForm.title = ''
    reviewForm.comment = ''
    // Refresh product data to update rating
    await marketplaceStore.fetchProducts(activeCategory.value, searchQuery.value || null)
  } catch (e) {
    console.error('Review error:', e)
  }
}

function openActionModal(dealer, type) {
    actionDealer.value = dealer
    actionType.value = type
    actionNotes.value = ''
    actionSchedule.value = ''
}

async function submitAction() {
    submittingAction.value = true
    try {
        await marketplaceStore.createBooking(actionDealer.value.id, actionType.value, actionSchedule.value, actionNotes.value)
        alert(`${actionType.value.charAt(0).toUpperCase() + actionType.value.slice(1)} request sent successfully! The provider will contact you shortly.`)
        actionDealer.value = null
    } catch (e) {
        alert('Failed to send request. Please try again.')
    } finally {
        submittingAction.value = false
    }
}

onMounted(async () => {
  await marketplaceStore.fetchProducts()
  await marketplaceStore.fetchWishlist()
  await marketplaceStore.fetchDealers()
})
</script>
