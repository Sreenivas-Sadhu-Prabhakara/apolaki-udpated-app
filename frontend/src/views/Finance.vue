<template>
  <div class="min-h-screen transition-colors duration-300" :class="isDark ? 'bg-[#0d1117]' : 'bg-slate-50'">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      <!-- Loading -->
      <div v-if="consentLoading" class="flex flex-col items-center justify-center py-32 gap-3">
        <div class="w-8 h-8 border-2 border-[#0F6CBD] border-t-transparent rounded-full animate-spin"></div>
        <p class="text-sm" :class="isDark ? 'text-slate-500' : 'text-gray-400'">Loading your finance settings…</p>
      </div>

      <!-- Consent Gate -->
      <div v-else-if="!hasFinanceConsent" class="max-w-md mx-auto mt-20 text-center">
        <div class="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl"
          :class="isDark ? 'bg-slate-800' : 'bg-amber-50'">💰</div>
        <h2 class="text-2xl font-bold mb-2" :class="isDark ? 'text-white' : 'text-gray-900'">Finance Access Required</h2>
        <p class="text-sm leading-relaxed mb-8" :class="isDark ? 'text-slate-400' : 'text-gray-500'">
          Enable Finance Data access to view your ROI projections, transaction history, and financing options.
        </p>
        <button @click="grantFinanceConsent" :disabled="grantingConsent"
          class="inline-flex items-center gap-2 bg-[#0F6CBD] text-white px-8 py-3 rounded-xl font-semibold text-sm hover:bg-[#0a5aa0] transition disabled:opacity-60 disabled:cursor-not-allowed">
          <span v-if="grantingConsent" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          {{ grantingConsent ? 'Enabling…' : 'Enable Finance Access' }}
        </button>
        <p v-if="consentError" class="mt-4 text-xs text-red-500">{{ consentError }}</p>
        <p class="mt-4 text-xs" :class="isDark ? 'text-slate-600' : 'text-gray-400'">Revoke anytime from Profile → Privacy Settings</p>
      </div>

      <!-- Main Content -->
      <template v-if="hasFinanceConsent">

        <!-- Page Header -->
        <div class="mb-8">
          <p class="text-xs font-semibold tracking-widest uppercase mb-1" :class="isDark ? 'text-amber-500' : 'text-amber-600'">Solar Financing & ROI</p>
          <h1 class="text-3xl font-bold tracking-tight" :class="isDark ? 'text-white' : 'text-gray-900'">Financial Advisor</h1>
          <p class="mt-1 text-sm" :class="isDark ? 'text-slate-400' : 'text-gray-500'">Simulate, evaluate, and manage your solar investment.</p>
        </div>

        <!-- Tab Bar -->
        <div class="flex items-center gap-1 p-1 rounded-xl w-fit mb-8" :class="isDark ? 'bg-slate-800' : 'bg-gray-100'">
          <button v-for="tab in tabs" :key="tab.key" @click="activeTab = tab.key"
            class="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all relative"
            :class="activeTab === tab.key
              ? (isDark ? 'bg-slate-700 text-white shadow-sm' : 'bg-white text-gray-900 shadow-sm')
              : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-gray-500 hover:text-gray-700')">
            {{ tab.icon }} {{ tab.label }}
            <span v-if="tab.key === 'saved' && assessmentStore.assessments.length"
              class="ml-1 bg-[#0F6CBD] text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
              {{ assessmentStore.assessments.length }}
            </span>
          </button>
        </div>

        <!-- ─── TAB: CALCULATOR ─── -->
        <div v-if="activeTab === 'advisor'" class="space-y-6">

          <!-- Sliders + Key Metrics row -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Sliders -->
            <div class="rounded-2xl border p-6 space-y-6" :class="cardClass">
              <h2 class="font-semibold text-base" :class="isDark ? 'text-white' : 'text-gray-900'">Bill Swap Calculator</h2>

              <div class="space-y-5">
                <div>
                  <div class="flex justify-between text-sm font-medium mb-2" :class="isDark ? 'text-slate-300' : 'text-gray-700'">
                    <span>Monthly Electricity Bill</span>
                    <span class="text-[#0F6CBD] font-bold">{{ formatCurrency(inputBill) }}/mo</span>
                  </div>
                  <input type="range" min="2000" max="40000" step="500" v-model.number="inputBill"
                    class="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-[#0F6CBD]"
                    :class="isDark ? 'bg-slate-700' : 'bg-gray-200'" />
                  <div class="flex justify-between text-xs mt-1" :class="isDark ? 'text-slate-500' : 'text-gray-400'">
                    <span>₱2k</span><span>₱40k+</span>
                  </div>
                </div>

                <div>
                  <div class="flex justify-between text-sm font-medium mb-2" :class="isDark ? 'text-slate-300' : 'text-gray-700'">
                    <span>Solar System Size</span>
                    <span class="text-[#0F6CBD] font-bold">{{ systemSizeKW }} kWp</span>
                  </div>
                  <input type="range" min="1.5" max="20" step="0.5" v-model.number="systemSizeKW"
                    class="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-[#0F6CBD]"
                    :class="isDark ? 'bg-slate-700' : 'bg-gray-200'" />
                  <div class="flex justify-between text-xs mt-1" :class="isDark ? 'text-slate-500' : 'text-gray-400'">
                    <span>1.5 kWp</span><span>20 kWp</span>
                  </div>
                </div>

                <div class="grid grid-cols-3 gap-3 pt-2 border-t" :class="isDark ? 'border-slate-700' : 'border-gray-100'">
                  <div>
                    <label class="block text-xs text-gray-400 mb-1">Inflation</label>
                    <select v-model.number="inflationRate" class="w-full text-xs rounded-lg border px-2 py-1.5"
                      :class="isDark ? 'bg-slate-900 border-slate-600 text-slate-200' : 'bg-white border-gray-200 text-gray-800'">
                      <option :value="3">3%</option>
                      <option :value="4.5">4.5%</option>
                      <option :value="6">6%</option>
                      <option :value="7.5">7.5%</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-xs text-gray-400 mb-1">Down %</label>
                    <input type="number" min="0" max="90" v-model.number="loanDownPaymentPct"
                      class="w-full text-xs rounded-lg border px-2 py-1.5"
                      :class="isDark ? 'bg-slate-900 border-slate-600 text-slate-200' : 'bg-white border-gray-200 text-gray-800'" />
                  </div>
                  <div>
                    <label class="block text-xs text-gray-400 mb-1">Term</label>
                    <select v-model.number="loanTenureYears" class="w-full text-xs rounded-lg border px-2 py-1.5"
                      :class="isDark ? 'bg-slate-900 border-slate-600 text-slate-200' : 'bg-white border-gray-200 text-gray-800'">
                      <option :value="3">3 yrs</option>
                      <option :value="5">5 yrs</option>
                      <option :value="7">7 yrs</option>
                      <option :value="10">10 yrs</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <!-- Key Metrics -->
            <div class="grid grid-cols-2 gap-4">
              <div class="rounded-2xl border p-5 flex flex-col justify-between" :class="cardClass">
                <p class="text-xs font-medium uppercase tracking-wide text-emerald-500">Monthly Savings</p>
                <div>
                  <p class="text-2xl font-bold text-emerald-500 mt-1">{{ php(estimatedMonthlySavings) }}</p>
                  <p class="text-xs mt-1" :class="isDark ? 'text-slate-500' : 'text-gray-400'">{{ Math.round((estimatedMonthlySavings / inputBill) * 100) }}% off current bill</p>
                </div>
              </div>
              <div class="rounded-2xl border p-5 flex flex-col justify-between" :class="cardClass">
                <p class="text-xs font-medium uppercase tracking-wide" :class="isDark ? 'text-amber-400' : 'text-amber-600'">Payback Period</p>
                <div>
                  <p class="text-2xl font-bold mt-1" :class="isDark ? 'text-amber-400' : 'text-amber-600'">{{ computedPaybackYears }} yrs</p>
                  <p class="text-xs mt-1" :class="isDark ? 'text-slate-500' : 'text-gray-400'">Until free energy</p>
                </div>
              </div>
              <div class="rounded-2xl border p-5 flex flex-col justify-between" :class="cardClass">
                <p class="text-xs font-medium uppercase tracking-wide" :class="isDark ? 'text-blue-400' : 'text-blue-600'">System Cost</p>
                <div>
                  <p class="text-2xl font-bold mt-1" :class="isDark ? 'text-blue-400' : 'text-blue-600'">{{ php(systemCost) }}</p>
                  <p class="text-xs mt-1" :class="isDark ? 'text-slate-500' : 'text-gray-400'">{{ systemSizeKW }} kWp estimated</p>
                </div>
              </div>
              <div class="rounded-2xl border p-5 flex flex-col justify-between" :class="cardClass">
                <p class="text-xs font-medium uppercase tracking-wide text-emerald-500">25-Yr Profit</p>
                <div>
                  <p class="text-2xl font-bold text-emerald-500 mt-1">{{ php(lifetimeProfit) }}</p>
                  <p class="text-xs mt-1" :class="isDark ? 'text-slate-500' : 'text-gray-400'">Net lifetime gain</p>
                </div>
              </div>

              <!-- Save simulation -->
              <div class="col-span-2">
                <button @click="saveCurrentSimulation" :disabled="assessmentStore.saving"
                  class="w-full py-3 rounded-xl font-semibold text-sm transition-all"
                  :class="saveSuccess
                    ? 'bg-emerald-500 text-white'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-900 disabled:opacity-60'">
                  {{ assessmentStore.saving ? 'Saving…' : saveSuccess ? '✓ Saved!' : 'Save This Simulation' }}
                </button>
              </div>
            </div>
          </div>

          <!-- ROI Chart -->
          <div class="rounded-2xl border p-6" :class="cardClass">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h2 class="font-semibold text-base" :class="isDark ? 'text-white' : 'text-gray-900'">25-Year ROI Projection</h2>
                <p class="text-xs mt-0.5" :class="isDark ? 'text-slate-500' : 'text-gray-400'">Break-even point marked in gold</p>
              </div>
              <span class="text-xs px-3 py-1 rounded-full font-medium" :class="isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-600'">
                ROI {{ estimatedRoi }}%
              </span>
            </div>
            <div class="rounded-xl overflow-hidden" :class="isDark ? 'bg-slate-900' : 'bg-slate-950'">
              <svg viewBox="0 0 500 180" class="w-full" preserveAspectRatio="none" style="height:180px">
                <defs>
                  <linearGradient id="chart-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#0F6CBD" stop-opacity="0.3"/>
                    <stop offset="100%" stop-color="#0F6CBD" stop-opacity="0"/>
                  </linearGradient>
                </defs>
                <line x1="40" y1="20" x2="480" y2="20" stroke="#1e293b" stroke-dasharray="3,3"/>
                <line x1="40" y1="70" x2="480" y2="70" stroke="#1e293b" stroke-dasharray="3,3"/>
                <line x1="40" y1="120" x2="480" y2="120" stroke="#1e293b" stroke-dasharray="3,3"/>
                <line x1="40" y1="160" x2="480" y2="160" stroke="#334155" stroke-width="1"/>
                <path :d="paybackPathFill" fill="url(#chart-grad)"/>
                <path :d="paybackPath" fill="none" stroke="#0F6CBD" stroke-width="2.5" stroke-linecap="round"/>
                <line :x1="paybackIntersectX" y1="20" :x2="paybackIntersectX" y2="160" stroke="#F4C94C" stroke-width="1" stroke-dasharray="3,3"/>
                <circle :cx="paybackIntersectX" :cy="paybackIntersectY" r="5" fill="#F4C94C" stroke="#0d1117" stroke-width="2"/>
                <text :x="Math.min(paybackIntersectX + 8, 430)" :y="paybackIntersectY - 8" fill="#F4C94C" font-size="9" font-weight="bold">Yr {{ computedPaybackYears }}</text>
              </svg>
              <div class="flex justify-between text-[10px] px-10 py-2 text-slate-500">
                <span>Yr 0</span><span>Yr 5</span><span>Yr 10</span><span>Yr 15</span><span>Yr 20</span><span>Yr 25</span>
              </div>
            </div>
          </div>

          <!-- Financing Options -->
          <div>
            <h2 class="font-semibold text-base mb-4" :class="isDark ? 'text-white' : 'text-gray-900'">Financing Options</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <!-- Cash -->
              <div class="rounded-2xl border p-5 flex flex-col gap-4 transition hover:shadow-md"
                :class="isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200 shadow-sm'">
                <div class="flex items-center justify-between">
                  <span class="text-xl">⚡</span>
                  <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500">Best ROI</span>
                </div>
                <div>
                  <h3 class="font-bold" :class="isDark ? 'text-slate-100' : 'text-gray-900'">Cash Purchase</h3>
                  <p class="text-xs mt-1" :class="isDark ? 'text-slate-400' : 'text-gray-500'">Maximum lifetime savings with no interest.</p>
                </div>
                <div class="space-y-1.5 text-sm">
                  <div class="flex justify-between"><span :class="isDark ? 'text-slate-400' : 'text-gray-400'">Upfront</span><span class="font-semibold">{{ formatCurrency(systemCost) }}</span></div>
                  <div class="flex justify-between"><span :class="isDark ? 'text-slate-400' : 'text-gray-400'">Payback</span><span class="font-semibold text-amber-500">{{ computedPaybackYears }} yrs</span></div>
                </div>
                <button @click="selectFinancingOption('cash')" class="mt-auto w-full py-2 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition">
                  Select
                </button>
              </div>

              <!-- Loan — highlighted -->
              <div class="rounded-2xl border-2 p-5 flex flex-col gap-4 transition hover:shadow-md relative"
                :class="isDark ? 'bg-slate-800 border-[#0F6CBD]' : 'bg-white border-[#0F6CBD] shadow-md'">
                <span class="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0F6CBD] text-white text-[10px] font-bold uppercase px-3 py-0.5 rounded-full">Most Popular</span>
                <div class="flex items-center justify-between">
                  <span class="text-xl">🏦</span>
                  <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500">Bill Swap</span>
                </div>
                <div>
                  <h3 class="font-bold" :class="isDark ? 'text-slate-100' : 'text-gray-900'">Apolaki PowerLoan</h3>
                  <p class="text-xs mt-1" :class="isDark ? 'text-slate-400' : 'text-gray-500'">6.25% APR — own your system, payments replace your bill.</p>
                </div>
                <div class="space-y-1.5 text-sm">
                  <div class="flex justify-between"><span :class="isDark ? 'text-slate-400' : 'text-gray-400'">Down</span><span class="font-semibold">{{ formatCurrency(calculatedDownPayment) }}</span></div>
                  <div class="flex justify-between"><span :class="isDark ? 'text-slate-400' : 'text-gray-400'">Monthly EMI</span><span class="font-semibold text-orange-400">{{ formatCurrency(calculatedEMI) }}/mo</span></div>
                </div>
                <button @click="selectFinancingOption('loan')" class="mt-auto w-full py-2 rounded-lg text-sm font-semibold bg-[#0F6CBD] hover:bg-[#0c5ea2] text-white transition">
                  Configure
                </button>
              </div>

              <!-- Lease -->
              <div class="rounded-2xl border p-5 flex flex-col gap-4 transition hover:shadow-md"
                :class="isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200 shadow-sm'">
                <div class="flex items-center justify-between">
                  <span class="text-xl">📜</span>
                  <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-500">₱0 Down</span>
                </div>
                <div>
                  <h3 class="font-bold" :class="isDark ? 'text-slate-100' : 'text-gray-900'">Zero-Down Lease</h3>
                  <p class="text-xs mt-1" :class="isDark ? 'text-slate-400' : 'text-gray-500'">Pay 30% less than your current bill, no ownership.</p>
                </div>
                <div class="space-y-1.5 text-sm">
                  <div class="flex justify-between"><span :class="isDark ? 'text-slate-400' : 'text-gray-400'">Monthly</span><span class="font-semibold">{{ formatCurrency(inputBill * 0.7) }}/mo</span></div>
                  <div class="flex justify-between"><span :class="isDark ? 'text-slate-400' : 'text-gray-400'">Maintenance</span><span class="font-semibold text-emerald-500">Included</span></div>
                </div>
                <button @click="selectFinancingOption('lease')" class="mt-auto w-full py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition">
                  Select
                </button>
              </div>
            </div>
          </div>

          <!-- Prequalifier -->
          <div class="rounded-2xl border p-6" :class="cardClass">
            <h2 class="font-semibold text-base mb-5" :class="isDark ? 'text-white' : 'text-gray-900'">Instant Prequalification</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div class="space-y-5">
                <div>
                  <label class="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Property Ownership</label>
                  <div class="flex gap-2">
                    <button type="button" @click="propertyOwned = true"
                      class="flex-1 py-2 rounded-lg text-xs font-semibold border transition"
                      :class="propertyOwned ? 'bg-[#0F6CBD] text-white border-[#0F6CBD]' : (isDark ? 'bg-slate-800 text-slate-400 border-slate-600' : 'bg-white text-gray-500 border-gray-200')">
                      Own Property
                    </button>
                    <button type="button" @click="propertyOwned = false"
                      class="flex-1 py-2 rounded-lg text-xs font-semibold border transition"
                      :class="!propertyOwned ? 'bg-[#0F6CBD] text-white border-[#0F6CBD]' : (isDark ? 'bg-slate-800 text-slate-400 border-slate-600' : 'bg-white text-gray-500 border-gray-200')">
                      Renting
                    </button>
                  </div>
                </div>
                <div>
                  <div class="flex justify-between text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                    <span>Credit Grade</span>
                    <span class="text-[#F4C94C] normal-case">{{ creditScoreRange }}</span>
                  </div>
                  <input type="range" min="550" max="850" step="10" v-model.number="creditScore"
                    class="w-full accent-[#0F6CBD]" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Annual Household Income</label>
                  <input type="text" placeholder="₱1,200,000" v-model="annualIncome"
                    class="w-full rounded-lg border px-3 py-2 text-sm"
                    :class="isDark ? 'bg-slate-900 border-slate-700 text-slate-200 placeholder-slate-600' : 'bg-white border-gray-200 text-gray-800'" />
                </div>
              </div>

              <div class="flex flex-col gap-4">
                <div class="flex-1 rounded-xl border p-5" :class="prequalRating.colorClass">
                  <div class="flex justify-between items-start mb-2">
                    <span class="text-xs font-bold uppercase tracking-wide">Approval Status</span>
                    <span class="text-xl">{{ prequalRating.icon }}</span>
                  </div>
                  <p class="text-lg font-black mb-2">{{ prequalRating.status }}</p>
                  <p class="text-xs leading-relaxed">{{ prequalRating.desc }}</p>
                </div>
                <router-link to="/messaging?financierId=f1"
                  class="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition"
                  :class="isDark ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-gray-200 text-gray-700 hover:bg-gray-50'">
                  💬 Message Financing Advisor
                </router-link>
              </div>
            </div>
          </div>
        </div>

        <!-- ─── TAB: LEDGER ─── -->
        <div v-else-if="activeTab === 'ledger'" class="space-y-6">

          <!-- Summary Row -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="rounded-2xl border p-5" :class="cardClass">
              <p class="text-xs font-medium text-gray-400 mb-1">Income & Savings</p>
              <p class="text-xl font-bold text-emerald-500">{{ php(financeStore.totalIncome) }}</p>
            </div>
            <div class="rounded-2xl border p-5" :class="cardClass">
              <p class="text-xs font-medium text-gray-400 mb-1">Total Expenses</p>
              <p class="text-xl font-bold text-red-500">{{ php(financeStore.totalExpenses) }}</p>
            </div>
            <div class="rounded-2xl border p-5" :class="cardClass">
              <p class="text-xs font-medium text-gray-400 mb-1">Net Balance</p>
              <p class="text-xl font-bold" :class="financeStore.netBalance >= 0 ? 'text-emerald-500' : 'text-red-500'">{{ php(financeStore.netBalance) }}</p>
            </div>
            <div class="rounded-2xl border p-5" :class="cardClass">
              <p class="text-xs font-medium text-gray-400 mb-1">Transactions</p>
              <p class="text-xl font-bold" :class="isDark ? 'text-blue-400' : 'text-blue-600'">{{ financeStore.transactions.length }}</p>
            </div>
          </div>

          <!-- Add Transaction Form -->
          <div v-if="showAddForm" class="rounded-2xl border p-6" :class="cardClass">
            <div class="flex justify-between items-center mb-5">
              <h2 class="font-semibold" :class="isDark ? 'text-white' : 'text-gray-900'">Record Transaction</h2>
              <button @click="showAddForm = false" class="text-xl leading-none" :class="isDark ? 'text-slate-500 hover:text-slate-300' : 'text-gray-400 hover:text-gray-600'">&times;</button>
            </div>
            <form @submit.prevent="handleCreateTransaction" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-gray-400 mb-1.5 uppercase">Type</label>
                <select v-model="form.type" required class="w-full rounded-lg border px-3 py-2 text-sm" :class="isDark ? 'bg-slate-900 border-slate-600 text-slate-200' : 'bg-white border-gray-200 text-gray-800'">
                  <option value="">Select…</option>
                  <option value="income">Income / Savings</option>
                  <option value="expense">Expense</option>
                  <option value="credit">Tax Credit</option>
                  <option value="payment">Loan Payment</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-400 mb-1.5 uppercase">Category</label>
                <select v-model="form.category" required class="w-full rounded-lg border px-3 py-2 text-sm" :class="isDark ? 'bg-slate-900 border-slate-600 text-slate-200' : 'bg-white border-gray-200 text-gray-800'">
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
                <label class="block text-xs font-medium text-gray-400 mb-1.5 uppercase">Amount (₱)</label>
                <input v-model.number="form.amount" type="number" step="0.01" placeholder="0.00" required
                  class="w-full rounded-lg border px-3 py-2 text-sm" :class="isDark ? 'bg-slate-900 border-slate-600 text-slate-200' : 'bg-white border-gray-200 text-gray-800'" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-400 mb-1.5 uppercase">Date</label>
                <input v-model="form.transactionDate" type="date" required
                  class="w-full rounded-lg border px-3 py-2 text-sm" :class="isDark ? 'bg-slate-900 border-slate-600 text-slate-200' : 'bg-white border-gray-200 text-gray-800'" />
              </div>
              <div class="sm:col-span-2">
                <label class="block text-xs font-medium text-gray-400 mb-1.5 uppercase">Description</label>
                <input v-model="form.description" type="text" placeholder="Monthly electricity savings from solar"
                  class="w-full rounded-lg border px-3 py-2 text-sm" :class="isDark ? 'bg-slate-900 border-slate-600 text-slate-200' : 'bg-white border-gray-200 text-gray-800'" />
              </div>
              <div class="sm:col-span-2 flex gap-3">
                <button type="submit" :disabled="financeStore.loading"
                  class="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50">
                  {{ financeStore.loading ? 'Saving…' : 'Save Transaction' }}
                </button>
                <button type="button" @click="showAddForm = false"
                  class="px-5 py-2 rounded-lg text-sm font-semibold border transition"
                  :class="isDark ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-gray-200 text-gray-700 hover:bg-gray-50'">
                  Cancel
                </button>
              </div>
              <p v-if="financeStore.error" class="sm:col-span-2 text-red-500 text-sm">{{ financeStore.error }}</p>
              <p v-if="createSuccess" class="sm:col-span-2 text-emerald-500 text-sm font-medium">✓ Transaction recorded</p>
            </form>
          </div>

          <!-- Transactions Table -->
          <div class="rounded-2xl border overflow-hidden" :class="cardClass">
            <div class="flex items-center justify-between px-5 py-4 border-b" :class="isDark ? 'border-slate-700' : 'border-gray-100'">
              <h2 class="font-semibold text-sm" :class="isDark ? 'text-white' : 'text-gray-900'">Transaction History</h2>
              <div class="flex gap-2">
                <button @click="showAddForm = true"
                  class="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold transition">
                  + Add
                </button>
                <button @click="loadData" class="px-3 py-1.5 rounded-lg text-xs font-semibold border transition"
                  :class="isDark ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'">
                  Refresh
                </button>
              </div>
            </div>

            <div v-if="financeStore.loading && !financeStore.transactions.length" class="flex items-center justify-center py-16 gap-2" :class="isDark ? 'text-slate-500' : 'text-gray-400'">
              <div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              <span class="text-sm">Loading…</span>
            </div>

            <div v-else-if="!financeStore.transactions.length" class="text-center py-16">
              <p class="text-3xl mb-3">💸</p>
              <p class="font-medium text-sm" :class="isDark ? 'text-slate-300' : 'text-gray-700'">No transactions yet</p>
              <p class="text-xs mt-1" :class="isDark ? 'text-slate-500' : 'text-gray-400'">Add your first solar-related transaction</p>
            </div>

            <div v-else class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="text-xs uppercase font-semibold border-b"
                    :class="isDark ? 'text-slate-500 border-slate-700 bg-slate-800/50' : 'text-gray-400 border-gray-100 bg-gray-50'">
                    <th class="px-5 py-3 text-left">Date</th>
                    <th class="px-5 py-3 text-left">Type</th>
                    <th class="px-5 py-3 text-left">Category</th>
                    <th class="px-5 py-3 text-left hidden md:table-cell">Description</th>
                    <th class="px-5 py-3 text-right">Amount</th>
                    <th class="px-5 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="txn in financeStore.transactions" :key="txn.id"
                    class="border-b transition"
                    :class="isDark ? 'border-slate-700/60 hover:bg-slate-800/40' : 'border-gray-50 hover:bg-gray-50'">
                    <td class="px-5 py-3.5 whitespace-nowrap" :class="isDark ? 'text-slate-300' : 'text-gray-700'">{{ formatDate(txn.transaction_date) }}</td>
                    <td class="px-5 py-3.5">
                      <span class="px-2 py-0.5 rounded-full text-xs font-semibold capitalize" :class="typeBadgeClass(txn.type)">{{ txn.type }}</span>
                    </td>
                    <td class="px-5 py-3.5 capitalize text-xs" :class="isDark ? 'text-slate-400' : 'text-gray-500'">{{ (txn.category || '').replace(/_/g, ' ') }}</td>
                    <td class="px-5 py-3.5 max-w-[200px] truncate text-xs hidden md:table-cell" :class="isDark ? 'text-slate-500' : 'text-gray-400'">{{ txn.description || '—' }}</td>
                    <td class="px-5 py-3.5 text-right font-semibold" :class="isPositive(txn.type) ? 'text-emerald-500' : 'text-red-500'">
                      {{ isPositive(txn.type) ? '+' : '-' }}{{ php(txn.amount || 0) }}
                    </td>
                    <td class="px-5 py-3.5">
                      <span class="text-xs font-medium capitalize" :class="txn.status === 'completed' ? 'text-emerald-500' : 'text-amber-500'">{{ txn.status || 'pending' }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- ─── TAB: SAVED SIMULATIONS ─── -->
        <div v-else-if="activeTab === 'saved'" class="space-y-6">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="font-semibold" :class="isDark ? 'text-white' : 'text-gray-900'">Saved Simulations</h2>
              <p class="text-xs mt-0.5" :class="isDark ? 'text-slate-500' : 'text-gray-400'">Click any scenario to reload it into the calculator.</p>
            </div>
            <button @click="assessmentStore.fetchAssessments()"
              class="text-xs font-semibold px-3 py-1.5 rounded-lg border transition"
              :class="isDark ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'">
              Refresh
            </button>
          </div>

          <div v-if="assessmentStore.loading" class="flex items-center justify-center py-20 gap-2" :class="isDark ? 'text-slate-500' : 'text-gray-400'">
            <div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            <span class="text-sm">Loading…</span>
          </div>

          <div v-else-if="!assessmentStore.assessments.length" class="text-center py-20 rounded-2xl border" :class="isDark ? 'border-slate-800' : 'border-gray-100'">
            <p class="text-3xl mb-3">🗂️</p>
            <p class="font-medium text-sm" :class="isDark ? 'text-slate-300' : 'text-gray-700'">No simulations saved yet</p>
            <p class="text-xs mt-1 mb-5" :class="isDark ? 'text-slate-500' : 'text-gray-400'">Use the calculator tab and hit Save</p>
            <button @click="activeTab = 'advisor'" class="px-5 py-2 bg-[#0F6CBD] text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition">
              Open Calculator
            </button>
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div v-for="item in assessmentStore.assessments" :key="item.id"
              class="rounded-2xl border p-5 cursor-pointer transition hover:shadow-md"
              :class="isDark ? 'bg-slate-800/60 border-slate-700 hover:border-[#0F6CBD]/50' : 'bg-white border-gray-100 shadow-sm hover:border-[#0F6CBD]/40'"
              @click="loadSavedSimulation(item)">
              <div class="flex items-start justify-between mb-4">
                <div>
                  <p class="text-xs font-semibold text-amber-500 uppercase tracking-wide">Saved Scenario</p>
                  <p class="font-semibold text-sm mt-0.5" :class="isDark ? 'text-slate-100' : 'text-slate-800'">{{ item.savings_estimate?.description || 'Solar Simulation' }}</p>
                </div>
                <span class="text-xs" :class="isDark ? 'text-slate-500' : 'text-gray-400'">{{ formatDate(item.created_at) }}</span>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div class="rounded-lg p-2.5" :class="isDark ? 'bg-slate-900' : 'bg-slate-50'">
                  <p class="text-[10px] text-gray-400 uppercase tracking-wide">Size</p>
                  <p class="font-bold text-sm mt-0.5" :class="isDark ? 'text-slate-200' : 'text-slate-700'">{{ item.recommended_capacity || '—' }} kWp</p>
                </div>
                <div class="rounded-lg p-2.5" :class="isDark ? 'bg-slate-900' : 'bg-slate-50'">
                  <p class="text-[10px] text-gray-400 uppercase tracking-wide">Savings</p>
                  <p class="font-bold text-sm mt-0.5 text-emerald-500">{{ php(item.savings_estimate?.monthlySavings || 0) }}/mo</p>
                </div>
                <div class="rounded-lg p-2.5" :class="isDark ? 'bg-slate-900' : 'bg-slate-50'">
                  <p class="text-[10px] text-gray-400 uppercase tracking-wide">Payback</p>
                  <p class="font-bold text-sm mt-0.5" :class="isDark ? 'text-amber-400' : 'text-amber-600'">{{ item.savings_estimate?.paybackYears || '—' }} yrs</p>
                </div>
                <div class="rounded-lg p-2.5" :class="isDark ? 'bg-slate-900' : 'bg-slate-50'">
                  <p class="text-[10px] text-gray-400 uppercase tracking-wide">Financing</p>
                  <p class="font-bold text-sm mt-0.5 capitalize" :class="isDark ? 'text-slate-200' : 'text-slate-700'">{{ item.savings_estimate?.financingOption || 'Loan' }}</p>
                </div>
              </div>
              <p class="text-xs text-[#0F6CBD] mt-3 font-medium">Load into calculator →</p>
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
