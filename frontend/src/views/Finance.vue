<template>
  <div class="min-h-screen py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-200"
    :class="isDark ? 'bg-slate-900' : 'bg-gray-50'">
    <div class="max-w-5xl mx-auto">

      <!-- Loading -->
      <div v-if="consentLoading" class="flex flex-col items-center justify-center py-40 gap-4">
        <div class="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <p class="text-sm" :class="isDark ? 'text-slate-500' : 'text-gray-400'">Loading…</p>
      </div>

      <!-- Consent Gate -->
      <div v-else-if="!hasFinanceConsent" class="max-w-sm mx-auto text-center py-32">
        <div class="w-12 h-12 rounded-2xl mx-auto mb-5 flex items-center justify-center text-2xl"
          :class="isDark ? 'bg-slate-800' : 'bg-orange-50'">💰</div>
        <h2 class="text-xl font-semibold mb-2" :class="isDark ? 'text-slate-100' : 'text-gray-900'">Finance Access Required</h2>
        <p class="text-sm mb-7 leading-relaxed" :class="isDark ? 'text-slate-400' : 'text-gray-500'">
          Enable Finance Data access to view ROI projections, transactions, and financing options.
        </p>
        <button @click="grantFinanceConsent" :disabled="grantingConsent"
          class="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-50">
          <span v-if="grantingConsent" class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          {{ grantingConsent ? 'Enabling…' : 'Enable Access' }}
        </button>
        <p v-if="consentError" class="mt-4 text-xs text-red-500">{{ consentError }}</p>
        <p class="mt-5 text-xs" :class="isDark ? 'text-slate-600' : 'text-gray-400'">
          Revoke anytime from Profile → Privacy Settings
        </p>
      </div>

      <!-- Main Content -->
      <template v-if="hasFinanceConsent">

        <!-- Header -->
        <div class="mb-7">
          <p class="text-xs font-semibold uppercase tracking-widest mb-1 text-orange-500">Solar Financing</p>
          <h1 class="text-2xl font-bold" :class="isDark ? 'text-slate-100' : 'text-gray-900'">Financial Advisor</h1>
        </div>

        <!-- Tab Bar -->
        <div class="flex gap-0 border-b mb-8" :class="isDark ? 'border-slate-700' : 'border-gray-200'">
          <button v-for="tab in tabs" :key="tab.key" @click="activeTab = tab.key"
            class="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors relative"
            :class="activeTab === tab.key
              ? 'border-orange-500 text-orange-500'
              : (isDark ? 'border-transparent text-slate-400 hover:text-slate-200' : 'border-transparent text-gray-500 hover:text-gray-700')">
            {{ tab.label }}
            <span v-if="tab.key === 'saved' && assessmentStore.assessments.length"
              class="bg-orange-500 text-white text-[9px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
              {{ assessmentStore.assessments.length }}
            </span>
          </button>
        </div>

        <!-- ── CALCULATOR ── -->
        <div v-if="activeTab === 'advisor'" class="space-y-6">

          <!-- Sliders + Stats -->
          <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">

            <!-- Sliders -->
            <div class="lg:col-span-3 rounded-xl border p-6 space-y-6"
              :class="isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'">
              <h2 class="text-sm font-semibold" :class="isDark ? 'text-slate-200' : 'text-gray-700'">Bill Swap Calculator</h2>

              <div>
                <div class="flex justify-between text-sm mb-2">
                  <span :class="isDark ? 'text-slate-400' : 'text-gray-500'">Monthly electricity bill</span>
                  <span class="font-semibold text-orange-500">{{ formatCurrency(inputBill) }}/mo</span>
                </div>
                <input type="range" min="2000" max="40000" step="500" v-model.number="inputBill"
                  class="w-full h-1 rounded-full appearance-none cursor-pointer accent-orange-500"
                  :class="isDark ? 'bg-slate-700' : 'bg-gray-200'" />
                <div class="flex justify-between text-xs mt-1.5" :class="isDark ? 'text-slate-600' : 'text-gray-400'">
                  <span>₱2,000</span><span>₱40,000</span>
                </div>
              </div>

              <div>
                <div class="flex justify-between text-sm mb-2">
                  <span :class="isDark ? 'text-slate-400' : 'text-gray-500'">Solar system size</span>
                  <span class="font-semibold text-orange-500">{{ systemSizeKW }} kWp</span>
                </div>
                <input type="range" min="1.5" max="20" step="0.5" v-model.number="systemSizeKW"
                  class="w-full h-1 rounded-full appearance-none cursor-pointer accent-orange-500"
                  :class="isDark ? 'bg-slate-700' : 'bg-gray-200'" />
                <div class="flex justify-between text-xs mt-1.5" :class="isDark ? 'text-slate-600' : 'text-gray-400'">
                  <span>1.5 kWp</span><span>20 kWp</span>
                </div>
              </div>

              <div class="grid grid-cols-3 gap-3 pt-4 border-t" :class="isDark ? 'border-slate-700' : 'border-gray-100'">
                <div>
                  <label class="block text-xs text-gray-400 mb-1.5">Inflation</label>
                  <select v-model.number="inflationRate"
                    class="w-full text-xs rounded-lg border px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    :class="isDark ? 'bg-slate-900 border-slate-600 text-slate-200' : 'bg-white border-gray-200 text-gray-700'">
                    <option :value="3">3%</option>
                    <option :value="4.5">4.5%</option>
                    <option :value="6">6%</option>
                    <option :value="7.5">7.5%</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs text-gray-400 mb-1.5">Down %</label>
                  <input type="number" min="0" max="90" v-model.number="loanDownPaymentPct"
                    class="w-full text-xs rounded-lg border px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    :class="isDark ? 'bg-slate-900 border-slate-600 text-slate-200' : 'bg-white border-gray-200 text-gray-700'" />
                </div>
                <div>
                  <label class="block text-xs text-gray-400 mb-1.5">Term</label>
                  <select v-model.number="loanTenureYears"
                    class="w-full text-xs rounded-lg border px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    :class="isDark ? 'bg-slate-900 border-slate-600 text-slate-200' : 'bg-white border-gray-200 text-gray-700'">
                    <option :value="3">3 yrs</option>
                    <option :value="5">5 yrs</option>
                    <option :value="7">7 yrs</option>
                    <option :value="10">10 yrs</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Stats column -->
            <div class="lg:col-span-2 flex flex-col gap-3">
              <div class="rounded-xl border p-5 flex-1"
                :class="isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'">
                <p class="text-xs text-gray-400 mb-1">Monthly savings</p>
                <p class="text-2xl font-bold text-emerald-500">{{ php(estimatedMonthlySavings) }}</p>
                <p class="text-xs mt-1" :class="isDark ? 'text-slate-500' : 'text-gray-400'">
                  {{ Math.round((estimatedMonthlySavings / inputBill) * 100) }}% off your current bill
                </p>
              </div>
              <div class="rounded-xl border p-5 flex-1"
                :class="isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'">
                <p class="text-xs text-gray-400 mb-1">Payback period</p>
                <p class="text-2xl font-bold text-orange-500">{{ computedPaybackYears }} yrs</p>
                <p class="text-xs mt-1" :class="isDark ? 'text-slate-500' : 'text-gray-400'">Until free energy</p>
              </div>
              <div class="rounded-xl border p-5 flex-1"
                :class="isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'">
                <p class="text-xs text-gray-400 mb-1">25-year profit</p>
                <p class="text-2xl font-bold text-emerald-500">{{ php(lifetimeProfit) }}</p>
                <p class="text-xs mt-1" :class="isDark ? 'text-slate-500' : 'text-gray-400'">Est. lifetime gain</p>
              </div>
              <button @click="saveCurrentSimulation" :disabled="assessmentStore.saving"
                class="w-full py-2.5 rounded-lg text-sm font-medium transition border"
                :class="saveSuccess
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : (isDark ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50')">
                {{ assessmentStore.saving ? 'Saving…' : saveSuccess ? '✓ Saved' : 'Save Simulation' }}
              </button>
            </div>
          </div>

          <!-- ROI Chart -->
          <div class="rounded-xl border overflow-hidden"
            :class="isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'">
            <div class="flex items-center justify-between px-6 py-4 border-b"
              :class="isDark ? 'border-slate-700' : 'border-gray-100'">
              <div>
                <p class="text-sm font-semibold" :class="isDark ? 'text-slate-200' : 'text-gray-800'">25-Year ROI Projection</p>
                <p class="text-xs mt-0.5" :class="isDark ? 'text-slate-500' : 'text-gray-400'">Gold dot marks your payback year</p>
              </div>
              <span class="text-xs font-medium px-2.5 py-1 rounded-full"
                :class="isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-600'">
                {{ estimatedRoi }}% ROI
              </span>
            </div>
            <div :class="isDark ? 'bg-slate-900' : 'bg-slate-950'" class="px-4 pt-4 pb-2">
              <svg viewBox="0 0 500 160" class="w-full" preserveAspectRatio="none" style="height:160px">
                <defs>
                  <linearGradient id="fg" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#ea580c" stop-opacity="0.25"/>
                    <stop offset="100%" stop-color="#ea580c" stop-opacity="0"/>
                  </linearGradient>
                </defs>
                <line x1="40" y1="40" x2="480" y2="40" stroke="#1e293b" stroke-dasharray="3,4"/>
                <line x1="40" y1="90" x2="480" y2="90" stroke="#1e293b" stroke-dasharray="3,4"/>
                <line x1="40" y1="140" x2="480" y2="140" stroke="#334155" stroke-width="1"/>
                <path :d="paybackPathFill" fill="url(#fg)"/>
                <path :d="paybackPath" fill="none" stroke="#ea580c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <line :x1="paybackIntersectX" y1="10" :x2="paybackIntersectX" y2="140" stroke="#f59e0b" stroke-width="1" stroke-dasharray="3,3"/>
                <circle :cx="paybackIntersectX" :cy="paybackIntersectY" r="4" fill="#f59e0b" stroke="#0f172a" stroke-width="2"/>
                <text :x="Math.min(paybackIntersectX + 6, 420)" :y="paybackIntersectY - 7" fill="#f59e0b" font-size="8.5" font-weight="600">Yr {{ computedPaybackYears }}</text>
              </svg>
              <div class="flex justify-between text-[10px] px-6 pb-1 text-slate-600 font-medium">
                <span>0</span><span>5</span><span>10</span><span>15</span><span>20</span><span>25</span>
              </div>
            </div>
          </div>

          <!-- Financing Options -->
          <div>
            <p class="text-xs font-semibold uppercase tracking-wider mb-3" :class="isDark ? 'text-slate-400' : 'text-gray-400'">Financing Options</p>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">

              <div v-for="opt in financingOptions" :key="opt.key"
                class="rounded-xl border p-5 flex flex-col gap-4 transition cursor-pointer"
                :class="[
                  opt.featured
                    ? (isDark ? 'border-orange-500/60 bg-orange-500/5' : 'border-orange-400 bg-orange-50/50')
                    : (isDark ? 'bg-slate-800 border-slate-700 hover:border-slate-500' : 'bg-white border-gray-200 hover:border-gray-300')
                ]"
                @click="selectFinancingOption(opt.key)">
                <div class="flex items-center justify-between">
                  <p class="font-semibold text-sm" :class="isDark ? 'text-slate-100' : 'text-gray-900'">{{ opt.name }}</p>
                  <span v-if="opt.featured" class="text-[10px] font-bold uppercase tracking-wide text-orange-500 border border-orange-500/40 px-1.5 py-0.5 rounded-full">Popular</span>
                  <span v-else class="text-[10px] font-medium" :class="isDark ? 'text-slate-500' : 'text-gray-400'">{{ opt.badge }}</span>
                </div>
                <p class="text-xs leading-relaxed" :class="isDark ? 'text-slate-400' : 'text-gray-500'">{{ opt.desc }}</p>
                <div class="space-y-1.5">
                  <div class="flex justify-between text-xs">
                    <span :class="isDark ? 'text-slate-500' : 'text-gray-400'">{{ opt.line1Label }}</span>
                    <span class="font-medium" :class="isDark ? 'text-slate-200' : 'text-gray-800'">{{ opt.line1Value }}</span>
                  </div>
                  <div class="flex justify-between text-xs">
                    <span :class="isDark ? 'text-slate-500' : 'text-gray-400'">{{ opt.line2Label }}</span>
                    <span class="font-medium" :class="opt.line2Color || (isDark ? 'text-slate-200' : 'text-gray-800')">{{ opt.line2Value }}</span>
                  </div>
                </div>
                <button class="mt-auto w-full py-2 rounded-lg text-xs font-semibold transition"
                  :class="opt.featured
                    ? 'bg-orange-600 hover:bg-orange-700 text-white'
                    : (isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700')">
                  Select
                </button>
              </div>
            </div>
          </div>

          <!-- Prequalifier -->
          <div class="rounded-xl border p-6"
            :class="isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'">
            <p class="text-xs font-semibold uppercase tracking-wider mb-5" :class="isDark ? 'text-slate-400' : 'text-gray-400'">Instant Prequalification</p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div class="space-y-5">
                <div>
                  <label class="block text-xs text-gray-400 mb-2">Property ownership</label>
                  <div class="flex gap-2">
                    <button type="button" @click="propertyOwned = true"
                      class="flex-1 py-2 rounded-lg text-xs font-medium border transition"
                      :class="propertyOwned
                        ? 'bg-orange-600 border-orange-600 text-white'
                        : (isDark ? 'border-slate-600 text-slate-400 hover:border-slate-500' : 'border-gray-200 text-gray-500 hover:border-gray-300')">
                      Own property
                    </button>
                    <button type="button" @click="propertyOwned = false"
                      class="flex-1 py-2 rounded-lg text-xs font-medium border transition"
                      :class="!propertyOwned
                        ? 'bg-orange-600 border-orange-600 text-white'
                        : (isDark ? 'border-slate-600 text-slate-400 hover:border-slate-500' : 'border-gray-200 text-gray-500 hover:border-gray-300')">
                      Renting
                    </button>
                  </div>
                </div>
                <div>
                  <div class="flex justify-between text-xs mb-2">
                    <span class="text-gray-400">Credit grade</span>
                    <span class="font-medium text-orange-500">{{ creditScoreRange }}</span>
                  </div>
                  <input type="range" min="550" max="850" step="10" v-model.number="creditScore"
                    class="w-full h-1 rounded-full appearance-none cursor-pointer accent-orange-500"
                    :class="isDark ? 'bg-slate-700' : 'bg-gray-200'" />
                </div>
                <div>
                  <label class="block text-xs text-gray-400 mb-2">Annual household income</label>
                  <input type="text" placeholder="₱1,200,000" v-model="annualIncome"
                    class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                    :class="isDark ? 'bg-slate-900 border-slate-600 text-slate-200 placeholder-slate-600' : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400'" />
                </div>
              </div>

              <div class="flex flex-col gap-4">
                <div class="flex-1 rounded-xl border p-4" :class="prequalRating.colorClass">
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-semibold uppercase tracking-wide">Approval status</span>
                    <span>{{ prequalRating.icon }}</span>
                  </div>
                  <p class="font-bold text-base mb-1.5">{{ prequalRating.status }}</p>
                  <p class="text-xs leading-relaxed opacity-80">{{ prequalRating.desc }}</p>
                </div>
                <router-link to="/messaging?financierId=f1"
                  class="flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium border transition"
                  :class="isDark ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'">
                  Message Financing Advisor
                </router-link>
              </div>
            </div>
          </div>
        </div>

        <!-- ── LEDGER ── -->
        <div v-else-if="activeTab === 'ledger'" class="space-y-5">

          <!-- Stats row -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div v-for="stat in ledgerStats" :key="stat.label"
              class="rounded-xl border p-4"
              :class="isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'">
              <p class="text-xs text-gray-400 mb-1.5">{{ stat.label }}</p>
              <p class="text-xl font-bold" :class="stat.color">{{ stat.value }}</p>
            </div>
          </div>

          <!-- Add form -->
          <div v-if="showAddForm" class="rounded-xl border p-5"
            :class="isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'">
            <div class="flex items-center justify-between mb-5">
              <p class="text-sm font-semibold" :class="isDark ? 'text-slate-200' : 'text-gray-800'">Record Transaction</p>
              <button @click="showAddForm = false" class="text-lg leading-none"
                :class="isDark ? 'text-slate-500 hover:text-slate-300' : 'text-gray-400 hover:text-gray-600'">&times;</button>
            </div>
            <form @submit.prevent="handleCreateTransaction" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs text-gray-400 mb-1.5">Type</label>
                <select v-model="form.type" required class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                  :class="isDark ? 'bg-slate-900 border-slate-600 text-slate-200' : 'bg-white border-gray-200 text-gray-800'">
                  <option value="">Select…</option>
                  <option value="income">Income / Savings</option>
                  <option value="expense">Expense</option>
                  <option value="credit">Tax Credit</option>
                  <option value="payment">Loan Payment</option>
                </select>
              </div>
              <div>
                <label class="block text-xs text-gray-400 mb-1.5">Category</label>
                <select v-model="form.category" required class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                  :class="isDark ? 'bg-slate-900 border-slate-600 text-slate-200' : 'bg-white border-gray-200 text-gray-800'">
                  <option value="">Select…</option>
                  <option value="energy_savings">Energy Savings</option>
                  <option value="equipment_purchase">Equipment Purchase</option>
                  <option value="installation_cost">Installation Cost</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="tax_credit">Tax Credit</option>
                  <option value="loan_payment">Loan Payment</option>
                  <option value="utility_bill">Utility Bill</option>
                  <option value="net_metering">Net Metering</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label class="block text-xs text-gray-400 mb-1.5">Amount (₱)</label>
                <input v-model.number="form.amount" type="number" step="0.01" placeholder="0.00" required
                  class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                  :class="isDark ? 'bg-slate-900 border-slate-600 text-slate-200' : 'bg-white border-gray-200 text-gray-800'" />
              </div>
              <div>
                <label class="block text-xs text-gray-400 mb-1.5">Date</label>
                <input v-model="form.transactionDate" type="date" required
                  class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                  :class="isDark ? 'bg-slate-900 border-slate-600 text-slate-200' : 'bg-white border-gray-200 text-gray-800'" />
              </div>
              <div class="sm:col-span-2">
                <label class="block text-xs text-gray-400 mb-1.5">Description</label>
                <input v-model="form.description" type="text" placeholder="e.g. Monthly electricity savings"
                  class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                  :class="isDark ? 'bg-slate-900 border-slate-600 text-slate-200 placeholder-slate-600' : 'bg-white border-gray-200 text-gray-800'" />
              </div>
              <div class="sm:col-span-2 flex gap-3 items-center">
                <button type="submit" :disabled="financeStore.loading"
                  class="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50">
                  {{ financeStore.loading ? 'Saving…' : 'Save' }}
                </button>
                <button type="button" @click="showAddForm = false"
                  class="px-5 py-2 rounded-lg text-sm font-medium border transition"
                  :class="isDark ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'">
                  Cancel
                </button>
                <p v-if="createSuccess" class="text-emerald-500 text-xs font-medium ml-1">✓ Saved</p>
                <p v-if="financeStore.error" class="text-red-500 text-xs ml-1">{{ financeStore.error }}</p>
              </div>
            </form>
          </div>

          <!-- Table -->
          <div class="rounded-xl border overflow-hidden"
            :class="isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'">
            <div class="flex items-center justify-between px-5 py-3.5 border-b"
              :class="isDark ? 'border-slate-700' : 'border-gray-100'">
              <p class="text-sm font-semibold" :class="isDark ? 'text-slate-200' : 'text-gray-800'">Transaction History</p>
              <div class="flex gap-2">
                <button @click="showAddForm = !showAddForm"
                  class="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-medium transition">
                  + Add
                </button>
                <button @click="loadData"
                  class="px-3 py-1.5 rounded-lg text-xs font-medium border transition"
                  :class="isDark ? 'border-slate-600 text-slate-400 hover:bg-slate-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'">
                  Refresh
                </button>
              </div>
            </div>

            <div v-if="financeStore.loading && !financeStore.transactions.length"
              class="flex items-center justify-center gap-2 py-14"
              :class="isDark ? 'text-slate-500' : 'text-gray-400'">
              <div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              <span class="text-sm">Loading…</span>
            </div>

            <div v-else-if="!financeStore.transactions.length" class="text-center py-14">
              <p class="text-sm font-medium mb-1" :class="isDark ? 'text-slate-300' : 'text-gray-700'">No transactions yet</p>
              <p class="text-xs" :class="isDark ? 'text-slate-500' : 'text-gray-400'">Add your first solar-related transaction above</p>
            </div>

            <div v-else class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="text-xs font-semibold uppercase tracking-wide border-b"
                    :class="isDark ? 'text-slate-500 border-slate-700 bg-slate-900/40' : 'text-gray-400 border-gray-100 bg-gray-50'">
                    <th class="px-5 py-3 text-left">Date</th>
                    <th class="px-5 py-3 text-left">Type</th>
                    <th class="px-5 py-3 text-left">Category</th>
                    <th class="px-5 py-3 text-left hidden md:table-cell">Note</th>
                    <th class="px-5 py-3 text-right">Amount</th>
                    <th class="px-5 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody :class="isDark ? 'divide-y divide-slate-700/60' : 'divide-y divide-gray-50'">
                  <tr v-for="txn in financeStore.transactions" :key="txn.id"
                    class="transition" :class="isDark ? 'hover:bg-slate-700/30' : 'hover:bg-gray-50'">
                    <td class="px-5 py-3.5 text-xs whitespace-nowrap" :class="isDark ? 'text-slate-400' : 'text-gray-500'">
                      {{ formatDate(txn.transaction_date) }}
                    </td>
                    <td class="px-5 py-3.5">
                      <span class="px-2 py-0.5 rounded text-xs font-medium capitalize" :class="typeBadgeClass(txn.type)">
                        {{ txn.type }}
                      </span>
                    </td>
                    <td class="px-5 py-3.5 text-xs capitalize" :class="isDark ? 'text-slate-400' : 'text-gray-500'">
                      {{ (txn.category || '').replace(/_/g, ' ') }}
                    </td>
                    <td class="px-5 py-3.5 text-xs max-w-45 truncate hidden md:table-cell"
                      :class="isDark ? 'text-slate-500' : 'text-gray-400'">
                      {{ txn.description || '—' }}
                    </td>
                    <td class="px-5 py-3.5 text-right text-sm font-semibold"
                      :class="isPositive(txn.type) ? 'text-emerald-500' : 'text-red-500'">
                      {{ isPositive(txn.type) ? '+' : '−' }}{{ php(txn.amount || 0) }}
                    </td>
                    <td class="px-5 py-3.5">
                      <span class="text-xs font-medium capitalize"
                        :class="txn.status === 'completed' ? 'text-emerald-500' : 'text-amber-500'">
                        {{ txn.status || 'pending' }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- ── SAVED ── -->
        <div v-else-if="activeTab === 'saved'" class="space-y-5">
          <div class="flex items-center justify-between">
            <p class="text-sm font-semibold" :class="isDark ? 'text-slate-200' : 'text-gray-800'">Saved Simulations</p>
            <button @click="assessmentStore.fetchAssessments()"
              class="text-xs font-medium px-3 py-1.5 rounded-lg border transition"
              :class="isDark ? 'border-slate-600 text-slate-400 hover:bg-slate-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'">
              Refresh
            </button>
          </div>

          <div v-if="assessmentStore.loading" class="flex items-center justify-center gap-2 py-20"
            :class="isDark ? 'text-slate-500' : 'text-gray-400'">
            <div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            <span class="text-sm">Loading…</span>
          </div>

          <div v-else-if="!assessmentStore.assessments.length" class="text-center py-20">
            <p class="text-sm font-medium mb-1" :class="isDark ? 'text-slate-300' : 'text-gray-700'">No simulations saved yet</p>
            <p class="text-xs mb-5" :class="isDark ? 'text-slate-500' : 'text-gray-400'">Go to the Calculator tab and click Save Simulation</p>
            <button @click="activeTab = 'advisor'"
              class="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition">
              Open Calculator
            </button>
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div v-for="item in assessmentStore.assessments" :key="item.id"
              class="rounded-xl border p-5 cursor-pointer transition hover:shadow-md"
              :class="isDark ? 'bg-slate-800 border-slate-700 hover:border-slate-500' : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'"
              @click="loadSavedSimulation(item)">
              <div class="flex items-start justify-between mb-4">
                <div>
                  <p class="text-xs text-orange-500 font-medium mb-0.5">Saved scenario</p>
                  <p class="text-sm font-semibold" :class="isDark ? 'text-slate-100' : 'text-gray-900'">
                    {{ item.savings_estimate?.description || 'Solar Simulation' }}
                  </p>
                </div>
                <p class="text-xs" :class="isDark ? 'text-slate-500' : 'text-gray-400'">{{ formatDate(item.created_at) }}</p>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div class="rounded-lg p-2.5" :class="isDark ? 'bg-slate-900' : 'bg-gray-50'">
                  <p class="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Size</p>
                  <p class="text-sm font-semibold" :class="isDark ? 'text-slate-200' : 'text-gray-700'">{{ item.recommended_capacity || '—' }} kWp</p>
                </div>
                <div class="rounded-lg p-2.5" :class="isDark ? 'bg-slate-900' : 'bg-gray-50'">
                  <p class="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Monthly savings</p>
                  <p class="text-sm font-semibold text-emerald-500">{{ php(item.savings_estimate?.monthlySavings || 0) }}/mo</p>
                </div>
                <div class="rounded-lg p-2.5" :class="isDark ? 'bg-slate-900' : 'bg-gray-50'">
                  <p class="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Payback</p>
                  <p class="text-sm font-semibold text-orange-500">{{ item.savings_estimate?.paybackYears || '—' }} yrs</p>
                </div>
                <div class="rounded-lg p-2.5" :class="isDark ? 'bg-slate-900' : 'bg-gray-50'">
                  <p class="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Financing</p>
                  <p class="text-sm font-semibold capitalize" :class="isDark ? 'text-slate-200' : 'text-gray-700'">{{ item.savings_estimate?.financingOption || 'Loan' }}</p>
                </div>
              </div>
              <p class="text-xs text-orange-500 mt-3 font-medium">Load into calculator →</p>
            </div>
          </div>
        </div>

      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import api from '../services/api'
import { useFinanceStore } from '../stores/financeStore'
import { useFinancingAssessmentStore } from '../stores/financingAssessmentStore'
import { useThemeStore } from '../stores/themeStore'
import { useUserStore } from '../stores/userStore'
import { formatCurrency } from '../utils/currency'

const financeStore = useFinanceStore()
const assessmentStore = useFinancingAssessmentStore()
const themeStore = useThemeStore()
const userStore = useUserStore()
const showAddForm = ref(false)
const createSuccess = ref(false)
const saveSuccess = ref(false)
const activeTab = ref('advisor')

const tabs = [
  { key: 'advisor', label: 'Calculator', icon: '🧮' },
  { key: 'ledger', label: 'Ledger', icon: '📑' },
  { key: 'saved', label: 'Saved', icon: '💾' }
]

// Interactive Calculator states
const inputBill = ref(15000)
const systemSizeKW = ref(5)
const inflationRate = ref(4.5)
const loanDownPaymentPct = ref(20)
const loanTenureYears = ref(5)
const propertyOwned = ref(true)
const creditScore = ref(720)
const annualIncome = ref('₱1,500,000')

const isDark = computed(() => themeStore.isDarkMode)

// Finance consent gate
const isElevatedRole = computed(() => ['admin', 'superadmin'].includes(userStore.userRole))
const consentLoading = ref(false)
const hasFinanceConsent = computed(() =>
  isElevatedRole.value || userStore.hasConsent('finance_data')
)

const grantingConsent = ref(false)
const consentError = ref(null)

async function grantFinanceConsent() {
  grantingConsent.value = true
  consentError.value = null
  try {
    // Directly grant finance_data consent via PATCH — no redirect needed
    await api.patch('/auth/consents/finance_data', { decision: 'granted' })
    // Refresh consent status in the store so hasFinanceConsent becomes true
    await userStore.getConsentStatus()
    // Now load the finance data
    await Promise.all([
      financeStore.fetchTransactions(),
      financeStore.fetchSummary(),
      assessmentStore.fetchAssessments()
    ])
  } catch (err) {
    consentError.value = err.response?.data?.error || 'Failed to enable finance access. Please try again.'
  } finally {
    grantingConsent.value = false
  }
}

function php(amount) {
  return formatCurrency(Number(amount || 0), { fromUSD: false, currency: 'PHP', decimals: 0 })
}

const assessmentsCount = computed(() => assessmentStore.assessments?.length || 0)
const hasAssessments = computed(() => assessmentsCount.value > 0)

// Calculations
const systemCost = computed(() => {
  // Approximate custom cost based on kW scale index
  return (systemSizeKW.value || 5) * 72000
})

const estimatedMonthlySavings = computed(() => {
  // Monthly output estimate in kWh multiplied by solar unit rates vs grid rates index
  const monthlyKwh = (systemSizeKW.value || 5) * 125 // 125 kWh generated per kW solar per month in PH
  const gridRateKwh = 12.5 // Average grid price
  const solarSavingsVal = monthlyKwh * gridRateKwh
  return Math.min((inputBill.value || 15000) * 0.85, solarSavingsVal) // Up to 85% peak utility deflection
})

const estimatedRoi = computed(() => {
  if (systemCost.value === 0) return 0
  return Math.round((lifetimeProfit.value / systemCost.value) * 100)
})

const calculatedDownPayment = computed(() => {
  return (systemCost.value * (loanDownPaymentPct.value || 20)) / 100
})

const calculatedEMI = computed(() => {
  const principal = systemCost.value - calculatedDownPayment.value
  const yearlyRate = 0.0625 // 6.25% APR
  const monthlyRate = yearlyRate / 12
  const totalMonths = (loanTenureYears.value || 5) * 12
  
  if (principal <= 0) return 0
  if (!monthlyRate) return principal / totalMonths
  
  const factor = Math.pow(1 + monthlyRate, totalMonths)
  return (principal * monthlyRate * factor) / (factor - 1)
})

const computedPaybackYears = computed(() => {
  const annualSavings = estimatedMonthlySavings.value * 12
  if (!annualSavings) return 0
  const years = systemCost.value / annualSavings
  return parseFloat(years.toFixed(1))
})

const lifetimeProfit = computed(() => {
  const totalOutlay = systemCost.value
  const annualSavings = estimatedMonthlySavings.value * 12
  let compoundedSavings = 0
  let currentMultiplier = 1
  
  for (let year = 1; year <= 25; year++) {
    compoundedSavings += annualSavings * currentMultiplier
    currentMultiplier *= (1 + ((inflationRate.value || 4.5) / 100))
  }
  return compoundedSavings - totalOutlay
})

// Payback visual Curve Data for Pure SVG Rendering
const paybackPath = computed(() => {
  const pts = []
  const initialCost = systemCost.value
  const annualSavings = estimatedMonthlySavings.value * 12
  let netGain = -initialCost
  
  const divisor = Math.max(1, lifetimeProfit.value + initialCost * 1.5)
  
  for (let i = 0; i <= 25; i++) {
    if (i > 0) {
      netGain += annualSavings * Math.pow(1 + ((inflationRate.value || 4.5) / 100), i - 1)
    }
    const x = 40 + (i / 25) * 440
    // Normalize logic: maps min/max of ROI projections within grid vertical heights (20-180px)
    const normalizedY = 180 - ((netGain + initialCost) / divisor) * 160
    pts.push(`${x},${Math.min(180, Math.max(20, normalizedY))}`)
  }
  return `M ${pts.join(' L ')}`
})

const paybackPathFill = computed(() => {
  return `${paybackPath.value} L 480,180 L 40,180 Z`
})

const paybackIntersectX = computed(() => {
  const pct = Math.min(1, computedPaybackYears.value / 25)
  return 40 + (pct * 440)
})

const paybackIntersectY = computed(() => {
  // Find relative point on the 25-yr payoff coordinate system
  const initialCost = systemCost.value
  const breakEvenHeightFactor = initialCost / (lifetimeProfit.value + initialCost * 1.5)
  return 180 - (breakEvenHeightFactor * 160)
})

// Prequalification calculations
const creditScoreRange = computed(() => {
  const score = creditScore.value
  if (score >= 780) return 'Excellent (Grade A)'
  if (score >= 700) return 'Very Good (Grade B)'
  if (score >= 650) return 'Good / Fair (Grade C)'
  return 'Subprime (Requires Guarantee)'
})

const prequalRating = computed(() => {
  if (!propertyOwned.value) {
    return {
      status: 'Secondary Review Needed',
      desc: 'Subscriptions (PPA) / Leases do not require property ownership, but custom solar installations require landlord proof.',
      icon: '🔒',
      colorClass: isDark.value ? 'bg-purple-950/40 text-purple-400 border-purple-800' : 'bg-purple-50 text-purple-700 border-purple-200'
    }
  }
  if (creditScore.value < 650) {
    return {
      status: 'Co-Signer Recommended',
      desc: 'Based on credit tier, adding a co-owner or providing a security deposit guarantees approval with 7.5% baseline APR.',
      icon: '🤝',
      colorClass: isDark.value ? 'bg-amber-950/40 text-amber-400 border-amber-800' : 'bg-yellow-50 text-yellow-700 border-yellow-200'
    }
  }
  return {
    status: '🎉 Pre-Approved !',
    desc: 'Congratulations! Your profile meets Apolaki PowerLoan metrics. Outstanding approval index with 6.25% fixed interest rates over premium panels.',
    icon: '✨',
    colorClass: isDark.value ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
  }
})

const cardClass = computed(() =>
  isDark.value
    ? 'bg-[#1e232a] border-slate-700/80'
    : 'bg-white border-gray-200'
)

const inputClass = computed(() =>
  isDark.value
    ? 'bg-slate-900 border-slate-600 text-slate-100 placeholder-slate-500'
    : 'border-gray-300 text-gray-900'
)

const form = reactive({
  type: '',
  category: '',
  amount: '',
  transactionDate: new Date().toISOString().split('T')[0],
  description: ''
})

function typeIcon(type) {
  const icons = { income: '💵', savings: '💵', expense: '💳', payment: '💳', credit: '🏛️' }
  return icons[type] || '📄'
}

function typeBadgeClass(type) {
  return {
    income: 'bg-green-100 text-green-800',
    savings: 'bg-green-100 text-green-800',
    credit: 'bg-blue-100 text-blue-800',
    expense: 'bg-red-100 text-red-800',
    payment: 'bg-yellow-100 text-yellow-800',
  }[type] || 'bg-gray-100 text-gray-800'
}

function isPositive(type) {
  return ['income', 'savings', 'credit'].includes(type)
}

function formatDate(date) {
  return date ? new Date(date).toLocaleDateString() : '—'
}

function selectFinancingOption(option) {
  if (option === 'cash') {
    loanDownPaymentPct.value = 100
  } else if (option === 'loan') {
    loanDownPaymentPct.value = 20
  } else if (option === 'lease') {
    loanDownPaymentPct.value = 0
  }
  // Bounce tab view dynamically
  activeTab.value = 'advisor'
}

async function handleCreateTransaction() {
  createSuccess.value = false
  try {
    await financeStore.createTransaction({
      type: form.type,
      category: form.category,
      amount: form.amount,
      transactionDate: form.transactionDate,
      description: form.description
    })
    createSuccess.value = true
    // Reset form
    Object.assign(form, { type: '', category: '', amount: '', transactionDate: new Date().toISOString().split('T')[0], description: '' })
    showAddForm.value = false
    // Refresh summary
    await financeStore.fetchSummary()
  } catch (err) {
    console.error('Failed to create transaction:', err)
  }
}

async function loadData() {
  // Ensure consent status is loaded before checking gate
  if (!userStore.consentStatus && userStore.isAuthenticated) {
    consentLoading.value = true
    try {
      await userStore.getConsentStatus()
    } catch (e) {
      console.warn('Failed to load consent status in Finance view', e)
    } finally {
      consentLoading.value = false
    }
  }

  // Only fetch finance data if consent is granted (or elevated role)
  if (!hasFinanceConsent.value) return

  // Restore assessment context if available
  const saved = localStorage.getItem('financingAssessmentState')
  if (saved) {
    try {
      const state = JSON.parse(saved)
      if (state.monthlyBill) inputBill.value = state.monthlyBill
      if (state.systemSize) systemSizeKW.value = state.systemSize
      // Default tenure and downpayment if coming from assessment
      loanTenureYears.value = 7 // Matches assessmentDomain.js LOAN_YEARS
      loanDownPaymentPct.value = 20
    } catch (e) {
      console.warn('Failed to restore assessment context in Finance view', e)
    }
  }

  await Promise.all([
    financeStore.fetchTransactions(),
    financeStore.fetchSummary(),
    assessmentStore.fetchAssessments()
  ])
}

async function saveCurrentSimulation() {
  saveSuccess.value = false
  await assessmentStore.saveAssessment({
    address: 'Philippines',
    city: 'Manila',
    state: 'NCR',
    zipCode: '1000',
    roofCondition: 'good',
    roofArea: systemSizeKW.value * 6,
    annualUsage: Math.round(systemSizeKW.value * 125 * 12),
    sunExposure: 'high',
    obstructionLevel: 'low',
    recommendedCapacity: systemSizeKW.value,
    estimatedCost: systemCost.value,
    savingsEstimate: {
      monthlySavings: Math.round(estimatedMonthlySavings.value),
      paybackYears: computedPaybackYears.value,
      roi: estimatedRoi.value,
      lifetimeProfit: lifetimeProfit.value,
      financingOption: loanDownPaymentPct.value === 100 ? 'cash' : loanDownPaymentPct.value === 0 ? 'lease' : 'loan',
      description: `${systemSizeKW.value} kWp Solar — ${new Date().toLocaleDateString()}`
    }
  })
  saveSuccess.value = true
  setTimeout(() => { saveSuccess.value = false }, 3000)
}

function loadSavedSimulation(item) {
  if (item.recommended_capacity) systemSizeKW.value = parseFloat(item.recommended_capacity)
  const option = item.savings_estimate?.financingOption || item.financing_option || 'loan'
  if (option === 'cash') loanDownPaymentPct.value = 100
  else if (option === 'lease') loanDownPaymentPct.value = 0
  else loanDownPaymentPct.value = 20
  activeTab.value = 'advisor'
}

onMounted(loadData)

// Re-fetch data if consent becomes granted after mount (e.g. returning from consent flow)
watch(hasFinanceConsent, (granted) => {
  if (granted && !financeStore.transactions.length && !financeStore.loading) {
    financeStore.fetchTransactions()
    financeStore.fetchSummary()
    assessmentStore.fetchAssessments()
  }
})
</script>
