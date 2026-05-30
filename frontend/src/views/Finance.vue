<template>
  <div class="min-h-screen py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-200"
    :class="isDark ? 'bg-slate-900' : 'bg-gray-50'">
    <div class="max-w-5xl mx-auto">

      <!-- Loading consent -->
      <div v-if="consentLoading" class="flex flex-col items-center justify-center py-40 gap-4">
        <div class="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <p class="text-xs" :class="isDark ? 'text-slate-500' : 'text-gray-400'">Loading…</p>
      </div>

      <!-- Dealer blocked -->
      <div v-else-if="isDealer" class="max-w-sm mx-auto text-center py-32">
        <div class="w-10 h-10 rounded-xl mx-auto mb-5 flex items-center justify-center"
          :class="isDark ? 'bg-slate-800' : 'bg-gray-100'">
          <svg class="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
          </svg>
        </div>
        <h2 class="text-base font-semibold mb-2" :class="isDark ? 'text-slate-100' : 'text-gray-900'">Not Available</h2>
        <p class="text-sm leading-relaxed" :class="isDark ? 'text-slate-400' : 'text-gray-500'">
          The Finance module is not available for Dealer accounts. Your financial activity is managed through your project contracts.
        </p>
        <router-link to="/dashboard"
          class="inline-block mt-6 text-xs font-medium text-orange-500 hover:text-orange-400 transition">
          Back to Dashboard →
        </router-link>
      </div>

      <!-- Consent gate -->
      <div v-else-if="!hasFinanceConsent" class="max-w-sm mx-auto text-center py-32">
        <div class="w-10 h-10 rounded-xl mx-auto mb-5 flex items-center justify-center"
          :class="isDark ? 'bg-slate-800' : 'bg-orange-50'">
          <svg class="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75"/>
          </svg>
        </div>
        <h2 class="text-base font-semibold mb-2" :class="isDark ? 'text-slate-100' : 'text-gray-900'">Finance Access</h2>
        <p class="text-sm leading-relaxed mb-7" :class="isDark ? 'text-slate-400' : 'text-gray-500'">
          Enable Finance Data access to view ROI projections, transactions, and financing options.
        </p>
        <button @click="grantFinanceConsent" :disabled="grantingConsent"
          class="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50">
          <span v-if="grantingConsent" class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          {{ grantingConsent ? 'Enabling…' : 'Enable Access' }}
        </button>
        <p v-if="consentError" class="mt-4 text-xs text-red-500">{{ consentError }}</p>
        <p class="mt-5 text-xs" :class="isDark ? 'text-slate-600' : 'text-gray-400'">Revoke anytime from Profile → Privacy</p>
      </div>

      <!-- Main content -->
      <template v-if="!consentLoading && !isDealer && hasFinanceConsent">

        <!-- Page header -->
        <div class="mb-7">
          <p class="text-xs font-semibold uppercase tracking-widest mb-1 text-orange-500">Solar Financing</p>
          <h1 class="text-xl font-bold" :class="isDark ? 'text-slate-100' : 'text-gray-900'">Financial Advisor</h1>
          <p v-if="isAdmin" class="text-xs mt-0.5 text-orange-500/70">Admin — full platform view</p>
        </div>

        <!-- Tab bar — slim underline, orange only -->
        <div class="flex gap-0 border-b mb-7" :class="isDark ? 'border-slate-700/70' : 'border-gray-200'">
          <button
            v-for="tab in visibleTabs" :key="tab.key"
            @click="activeTab = tab.key"
            class="px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap"
            :class="activeTab === tab.key
              ? 'border-orange-500 text-orange-500'
              : (isDark ? 'border-transparent text-slate-500 hover:text-slate-300' : 'border-transparent text-gray-400 hover:text-gray-700')">
            {{ tab.label }}
            <span v-if="tab.key === 'saved' && assessmentStore.assessments.length"
              class="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold bg-orange-500/15 text-orange-500">
              {{ assessmentStore.assessments.length }}
            </span>
          </button>
        </div>

        <!-- ─── CALCULATOR ─── -->
        <div v-if="activeTab === 'advisor'" class="space-y-6">

          <div class="grid grid-cols-1 lg:grid-cols-5 gap-5">

            <!-- Sliders -->
            <div class="lg:col-span-3 rounded-xl border p-5 space-y-5" :class="cardClass">
              <p class="text-xs font-semibold uppercase tracking-widest" :class="isDark ? 'text-slate-500' : 'text-gray-400'">Bill Swap Calculator</p>

              <div>
                <div class="flex justify-between text-sm mb-2">
                  <span :class="isDark ? 'text-slate-300' : 'text-gray-700'">Monthly electricity bill</span>
                  <span class="font-semibold text-orange-500">{{ formatCurrency(inputBill) }}/mo</span>
                </div>
                <input type="range" min="2000" max="40000" step="500" v-model.number="inputBill"
                  class="w-full h-1 rounded-full appearance-none cursor-pointer accent-orange-500"
                  :class="isDark ? 'bg-slate-700' : 'bg-gray-200'" />
                <div class="flex justify-between text-xs mt-1" :class="isDark ? 'text-slate-600' : 'text-gray-400'">
                  <span>₱2k</span><span>₱40k</span>
                </div>
              </div>

              <div>
                <div class="flex justify-between text-sm mb-2">
                  <span :class="isDark ? 'text-slate-300' : 'text-gray-700'">Solar system size</span>
                  <span class="font-semibold text-orange-500">{{ systemSizeKW }} kWp</span>
                </div>
                <input type="range" min="1.5" max="20" step="0.5" v-model.number="systemSizeKW"
                  class="w-full h-1 rounded-full appearance-none cursor-pointer accent-orange-500"
                  :class="isDark ? 'bg-slate-700' : 'bg-gray-200'" />
                <div class="flex justify-between text-xs mt-1" :class="isDark ? 'text-slate-600' : 'text-gray-400'">
                  <span>1.5 kWp</span><span>20 kWp</span>
                </div>
              </div>

              <div class="grid grid-cols-3 gap-3 pt-4 border-t" :class="isDark ? 'border-slate-700' : 'border-gray-100'">
                <div>
                  <label class="block text-xs mb-1.5" :class="isDark ? 'text-slate-500' : 'text-gray-400'">Inflation</label>
                  <select v-model.number="inflationRate" class="w-full text-xs rounded-lg border px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                    :class="isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-gray-200 text-gray-700'">
                    <option :value="3">3%</option>
                    <option :value="4.5">4.5%</option>
                    <option :value="6">6%</option>
                    <option :value="7.5">7.5%</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs mb-1.5" :class="isDark ? 'text-slate-500' : 'text-gray-400'">Down %</label>
                  <input type="number" min="0" max="90" v-model.number="loanDownPaymentPct"
                    class="w-full text-xs rounded-lg border px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                    :class="isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-gray-200 text-gray-700'" />
                </div>
                <div>
                  <label class="block text-xs mb-1.5" :class="isDark ? 'text-slate-500' : 'text-gray-400'">Term</label>
                  <select v-model.number="loanTenureYears" class="w-full text-xs rounded-lg border px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                    :class="isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-gray-200 text-gray-700'">
                    <option :value="3">3 yrs</option>
                    <option :value="5">5 yrs</option>
                    <option :value="7">7 yrs</option>
                    <option :value="10">10 yrs</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Stats -->
            <div class="lg:col-span-2 flex flex-col gap-3">
              <div class="rounded-xl border p-4 flex-1" :class="cardClass">
                <p class="text-xs mb-1" :class="isDark ? 'text-slate-500' : 'text-gray-400'">Monthly savings</p>
                <p class="text-2xl font-bold text-emerald-500">{{ php(estimatedMonthlySavings) }}</p>
                <p class="text-xs mt-0.5" :class="isDark ? 'text-slate-600' : 'text-gray-400'">{{ Math.round((estimatedMonthlySavings / inputBill) * 100) }}% off current bill</p>
              </div>
              <div class="rounded-xl border p-4 flex-1" :class="cardClass">
                <p class="text-xs mb-1" :class="isDark ? 'text-slate-500' : 'text-gray-400'">Payback period</p>
                <p class="text-2xl font-bold text-orange-500">{{ computedPaybackYears }} yrs</p>
                <p class="text-xs mt-0.5" :class="isDark ? 'text-slate-600' : 'text-gray-400'">Until free energy</p>
              </div>
              <div class="rounded-xl border p-4 flex-1" :class="cardClass">
                <p class="text-xs mb-1" :class="isDark ? 'text-slate-500' : 'text-gray-400'">25-year profit</p>
                <p class="text-2xl font-bold text-emerald-500">{{ php(lifetimeProfit) }}</p>
                <p class="text-xs mt-0.5" :class="isDark ? 'text-slate-600' : 'text-gray-400'">Est. lifetime gain</p>
              </div>
              <button @click="saveCurrentSimulation" :disabled="assessmentStore.saving"
                class="w-full py-2.5 rounded-lg text-sm font-medium transition border"
                :class="saveSuccess
                  ? 'bg-emerald-600 border-emerald-600 text-white'
                  : (isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-gray-300 text-gray-600 hover:bg-gray-100')">
                {{ assessmentStore.saving ? 'Saving…' : saveSuccess ? '✓ Saved' : 'Save Simulation' }}
              </button>
            </div>
          </div>

          <!-- ROI chart -->
          <div class="rounded-xl border overflow-hidden" :class="cardClass">
            <div class="flex items-center justify-between px-5 py-4 border-b" :class="isDark ? 'border-slate-700' : 'border-gray-100'">
              <div>
                <p class="text-sm font-semibold" :class="isDark ? 'text-slate-200' : 'text-gray-800'">25-Year ROI Projection</p>
                <p class="text-xs mt-0.5" :class="isDark ? 'text-slate-500' : 'text-gray-400'">Gold dot marks your payback year</p>
              </div>
              <span class="text-xs font-medium px-2.5 py-1 rounded-full" :class="isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-600'">
                {{ estimatedRoi }}% ROI
              </span>
            </div>
            <div :class="isDark ? 'bg-slate-900/80' : 'bg-slate-950'" class="px-4 pt-4 pb-2">
              <svg viewBox="0 0 500 160" class="w-full" preserveAspectRatio="none" style="height:150px">
                <defs>
                  <linearGradient id="fg" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#ea580c" stop-opacity="0.2"/>
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

          <!-- Financing options -->
          <div>
            <p class="text-xs font-semibold uppercase tracking-widest mb-3" :class="isDark ? 'text-slate-500' : 'text-gray-400'">Financing Options</p>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div v-for="opt in financingOptions" :key="opt.key"
                class="rounded-xl border p-4 flex flex-col gap-3 cursor-pointer transition-colors"
                :class="opt.featured
                  ? (isDark ? 'border-orange-500/50 bg-orange-500/5 hover:bg-orange-500/10' : 'border-orange-400/70 bg-orange-50/40 hover:bg-orange-50')
                  : (isDark ? 'border-slate-700 bg-slate-800/50 hover:border-slate-600' : 'border-gray-200 bg-white hover:border-gray-300')"
                @click="selectFinancingOption(opt.key)">
                <div class="flex items-center justify-between">
                  <p class="text-sm font-semibold" :class="isDark ? 'text-slate-100' : 'text-gray-900'">{{ opt.name }}</p>
                  <span class="text-[10px] font-semibold uppercase tracking-wide"
                    :class="opt.featured ? 'text-orange-500' : (isDark ? 'text-slate-500' : 'text-gray-400')">
                    {{ opt.badge }}
                  </span>
                </div>
                <p class="text-xs leading-relaxed" :class="isDark ? 'text-slate-400' : 'text-gray-500'">{{ opt.desc }}</p>
                <div class="space-y-1 pt-2 border-t" :class="isDark ? 'border-slate-700' : 'border-gray-100'">
                  <div class="flex justify-between text-xs">
                    <span :class="isDark ? 'text-slate-500' : 'text-gray-400'">{{ opt.line1Label }}</span>
                    <span class="font-medium" :class="isDark ? 'text-slate-200' : 'text-gray-800'">{{ opt.line1Value }}</span>
                  </div>
                  <div class="flex justify-between text-xs">
                    <span :class="isDark ? 'text-slate-500' : 'text-gray-400'">{{ opt.line2Label }}</span>
                    <span class="font-medium" :class="opt.line2Color || (isDark ? 'text-slate-200' : 'text-gray-800')">{{ opt.line2Value }}</span>
                  </div>
                </div>
                <button class="w-full py-1.5 rounded-lg text-xs font-semibold transition mt-auto"
                  :class="opt.featured
                    ? 'bg-orange-600 hover:bg-orange-700 text-white'
                    : (isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700')">
                  Select
                </button>
              </div>
            </div>
          </div>

          <!-- Prequalifier -->
          <div class="rounded-xl border p-5" :class="cardClass">
            <p class="text-xs font-semibold uppercase tracking-widest mb-5" :class="isDark ? 'text-slate-500' : 'text-gray-400'">Instant Prequalification</p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-4">
                <div>
                  <label class="block text-xs mb-2" :class="isDark ? 'text-slate-400' : 'text-gray-500'">Property ownership</label>
                  <div class="flex gap-2">
                    <button type="button" @click="propertyOwned = true"
                      class="flex-1 py-2 rounded-lg text-xs font-medium border transition"
                      :class="propertyOwned
                        ? 'bg-orange-600 border-orange-600 text-white'
                        : (isDark ? 'border-slate-700 text-slate-400 hover:border-slate-600' : 'border-gray-200 text-gray-500 hover:border-gray-300')">
                      Own property
                    </button>
                    <button type="button" @click="propertyOwned = false"
                      class="flex-1 py-2 rounded-lg text-xs font-medium border transition"
                      :class="!propertyOwned
                        ? 'bg-orange-600 border-orange-600 text-white'
                        : (isDark ? 'border-slate-700 text-slate-400 hover:border-slate-600' : 'border-gray-200 text-gray-500 hover:border-gray-300')">
                      Renting
                    </button>
                  </div>
                </div>
                <div>
                  <div class="flex justify-between text-xs mb-2">
                    <span :class="isDark ? 'text-slate-400' : 'text-gray-500'">Credit grade</span>
                    <span class="font-medium text-orange-500">{{ creditScoreRange }}</span>
                  </div>
                  <input type="range" min="550" max="850" step="10" v-model.number="creditScore"
                    class="w-full h-1 rounded-full appearance-none cursor-pointer accent-orange-500"
                    :class="isDark ? 'bg-slate-700' : 'bg-gray-200'" />
                </div>
                <div>
                  <label class="block text-xs mb-2" :class="isDark ? 'text-slate-400' : 'text-gray-500'">Annual household income</label>
                  <input type="text" placeholder="₱1,200,000" v-model="annualIncome"
                    class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                    :class="isDark ? 'bg-slate-900 border-slate-700 text-slate-200 placeholder-slate-600' : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400'" />
                </div>
              </div>

              <div class="flex flex-col gap-3">
                <div class="flex-1 rounded-xl border p-4" :class="prequalRating.colorClass">
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-semibold uppercase tracking-wide">Approval status</span>
                    <span class="text-base">{{ prequalRating.icon }}</span>
                  </div>
                  <p class="font-bold text-sm mb-1">{{ prequalRating.status }}</p>
                  <p class="text-xs leading-relaxed opacity-80">{{ prequalRating.desc }}</p>
                </div>
                <router-link to="/messaging?financierId=f1"
                  class="flex items-center justify-center py-2.5 rounded-lg text-sm font-medium border transition"
                  :class="isDark ? 'border-slate-700 text-slate-400 hover:bg-slate-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50'">
                  Message Financing Advisor
                </router-link>
              </div>
            </div>
          </div>
        </div>

        <!-- ─── LEDGER ─── -->
        <div v-else-if="activeTab === 'ledger'" class="space-y-5">

          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div v-for="stat in ledgerStats" :key="stat.label" class="rounded-xl border p-4" :class="cardClass">
              <p class="text-xs mb-1.5" :class="isDark ? 'text-slate-500' : 'text-gray-400'">{{ stat.label }}</p>
              <p class="text-xl font-bold" :class="stat.color">{{ stat.value }}</p>
            </div>
          </div>

          <div v-if="showAddForm" class="rounded-xl border p-5" :class="cardClass">
            <div class="flex items-center justify-between mb-5">
              <p class="text-sm font-semibold" :class="isDark ? 'text-slate-200' : 'text-gray-800'">Record Transaction</p>
              <button @click="showAddForm = false" class="text-lg leading-none"
                :class="isDark ? 'text-slate-500 hover:text-slate-300' : 'text-gray-400 hover:text-gray-600'">&times;</button>
            </div>
            <form @submit.prevent="handleCreateTransaction" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs mb-1.5" :class="isDark ? 'text-slate-400' : 'text-gray-400'">Type</label>
                <select v-model="form.type" required class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                  :class="isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-gray-200 text-gray-800'">
                  <option value="">Select…</option>
                  <option value="income">Income / Savings</option>
                  <option value="expense">Expense</option>
                  <option value="credit">Tax Credit</option>
                  <option value="payment">Loan Payment</option>
                </select>
              </div>
              <div>
                <label class="block text-xs mb-1.5" :class="isDark ? 'text-slate-400' : 'text-gray-400'">Category</label>
                <select v-model="form.category" required class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                  :class="isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-gray-200 text-gray-800'">
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
                <label class="block text-xs mb-1.5" :class="isDark ? 'text-slate-400' : 'text-gray-400'">Amount (₱)</label>
                <input v-model.number="form.amount" type="number" step="0.01" placeholder="0.00" required
                  class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                  :class="isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-gray-200 text-gray-800'" />
              </div>
              <div>
                <label class="block text-xs mb-1.5" :class="isDark ? 'text-slate-400' : 'text-gray-400'">Date</label>
                <input v-model="form.transactionDate" type="date" required
                  class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                  :class="isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-gray-200 text-gray-800'" />
              </div>
              <div class="sm:col-span-2">
                <label class="block text-xs mb-1.5" :class="isDark ? 'text-slate-400' : 'text-gray-400'">Description</label>
                <input v-model="form.description" type="text" placeholder="e.g. Monthly electricity savings"
                  class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                  :class="isDark ? 'bg-slate-900 border-slate-700 text-slate-200 placeholder-slate-600' : 'bg-white border-gray-200 text-gray-800'" />
              </div>
              <div class="sm:col-span-2 flex gap-3 items-center">
                <button type="submit" :disabled="financeStore.loading"
                  class="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50">
                  {{ financeStore.loading ? 'Saving…' : 'Save' }}
                </button>
                <button type="button" @click="showAddForm = false"
                  class="px-5 py-2 rounded-lg text-sm font-medium border transition"
                  :class="isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50'">
                  Cancel
                </button>
                <p v-if="createSuccess" class="text-emerald-500 text-xs font-medium ml-1">✓ Saved</p>
                <p v-if="financeStore.error" class="text-red-500 text-xs ml-1">{{ financeStore.error }}</p>
              </div>
            </form>
          </div>

          <div class="rounded-xl border overflow-hidden" :class="cardClass">
            <div class="flex items-center justify-between px-5 py-3.5 border-b" :class="isDark ? 'border-slate-700' : 'border-gray-100'">
              <div>
                <p class="text-sm font-semibold" :class="isDark ? 'text-slate-200' : 'text-gray-800'">Transaction History</p>
                <p class="text-xs mt-0.5" :class="isAdmin ? 'text-orange-500/80' : (isDark ? 'text-slate-500' : 'text-gray-400')">
                  {{ isAdmin ? 'All users' : 'Your records' }}
                </p>
              </div>
              <div class="flex gap-2">
                <button @click="showAddForm = !showAddForm"
                  class="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-medium transition">
                  + Add
                </button>
                <button @click="loadData"
                  class="px-3 py-1.5 rounded-lg text-xs font-medium border transition"
                  :class="isDark ? 'border-slate-700 text-slate-400 hover:bg-slate-800' : 'border-gray-200 text-gray-500 hover:bg-gray-50'">
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
              <p class="text-xs" :class="isDark ? 'text-slate-500' : 'text-gray-400'">Add your first solar-related transaction</p>
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
                <tbody :class="isDark ? 'divide-y divide-slate-700/50' : 'divide-y divide-gray-50'">
                  <tr v-for="txn in financeStore.transactions" :key="txn.id"
                    class="transition" :class="isDark ? 'hover:bg-slate-800/60' : 'hover:bg-gray-50'">
                    <td class="px-5 py-3.5 text-xs whitespace-nowrap" :class="isDark ? 'text-slate-400' : 'text-gray-500'">{{ formatDate(txn.transaction_date) }}</td>
                    <td class="px-5 py-3.5">
                      <span class="px-2 py-0.5 rounded text-xs font-medium capitalize" :class="typeBadgeClass(txn.type)">{{ txn.type }}</span>
                    </td>
                    <td class="px-5 py-3.5 text-xs capitalize" :class="isDark ? 'text-slate-400' : 'text-gray-500'">{{ (txn.category || '').replace(/_/g, ' ') }}</td>
                    <td class="px-5 py-3.5 text-xs max-w-45 truncate hidden md:table-cell" :class="isDark ? 'text-slate-500' : 'text-gray-400'">{{ txn.description || '—' }}</td>
                    <td class="px-5 py-3.5 text-right text-sm font-semibold" :class="isPositive(txn.type) ? 'text-emerald-500' : 'text-red-500'">
                      {{ isPositive(txn.type) ? '+' : '−' }}{{ php(txn.amount || 0) }}
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

        <!-- ─── SAVED ─── -->
        <div v-else-if="activeTab === 'saved'" class="space-y-5">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-semibold" :class="isDark ? 'text-slate-200' : 'text-gray-800'">Saved Simulations</p>
              <p class="text-xs mt-0.5" :class="isDark ? 'text-slate-500' : 'text-gray-400'">Click any scenario to reload it in the calculator</p>
            </div>
            <button @click="assessmentStore.fetchAssessments()"
              class="text-xs font-medium px-3 py-1.5 rounded-lg border transition"
              :class="isDark ? 'border-slate-700 text-slate-400 hover:bg-slate-800' : 'border-gray-200 text-gray-500 hover:bg-gray-50'">
              Refresh
            </button>
          </div>

          <div v-if="assessmentStore.loading" class="flex items-center justify-center gap-2 py-20" :class="isDark ? 'text-slate-500' : 'text-gray-400'">
            <div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            <span class="text-sm">Loading…</span>
          </div>

          <div v-else-if="!assessmentStore.assessments.length" class="text-center py-20">
            <p class="text-sm font-medium mb-1" :class="isDark ? 'text-slate-300' : 'text-gray-700'">No simulations saved yet</p>
            <p class="text-xs mb-5" :class="isDark ? 'text-slate-500' : 'text-gray-400'">Go to the Calculator tab and click Save Simulation</p>
            <button @click="activeTab = 'advisor'" class="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition">
              Open Calculator
            </button>
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div v-for="item in assessmentStore.assessments" :key="item.id"
              class="rounded-xl border p-5 cursor-pointer transition"
              :class="isDark ? 'bg-slate-800/70 border-slate-700 hover:border-orange-500/40' : 'bg-white border-gray-200 hover:border-orange-300 shadow-sm'"
              @click="loadSavedSimulation(item)">
              <div class="flex items-start justify-between mb-4">
                <div>
                  <p class="text-xs text-orange-500 font-medium mb-0.5">Saved scenario</p>
                  <p class="text-sm font-semibold" :class="isDark ? 'text-slate-100' : 'text-gray-900'">{{ item.savings_estimate?.description || 'Solar Simulation' }}</p>
                </div>
                <p class="text-xs" :class="isDark ? 'text-slate-500' : 'text-gray-400'">{{ formatDate(item.created_at) }}</p>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div class="rounded-lg p-2.5" :class="isDark ? 'bg-slate-900' : 'bg-gray-50'">
                  <p class="text-[10px] uppercase tracking-wide mb-0.5" :class="isDark ? 'text-slate-500' : 'text-gray-400'">Size</p>
                  <p class="text-sm font-semibold" :class="isDark ? 'text-slate-200' : 'text-gray-700'">{{ item.recommended_capacity || '—' }} kWp</p>
                </div>
                <div class="rounded-lg p-2.5" :class="isDark ? 'bg-slate-900' : 'bg-gray-50'">
                  <p class="text-[10px] uppercase tracking-wide mb-0.5" :class="isDark ? 'text-slate-500' : 'text-gray-400'">Monthly savings</p>
                  <p class="text-sm font-semibold text-emerald-500">{{ php(item.savings_estimate?.monthlySavings || 0) }}/mo</p>
                </div>
                <div class="rounded-lg p-2.5" :class="isDark ? 'bg-slate-900' : 'bg-gray-50'">
                  <p class="text-[10px] uppercase tracking-wide mb-0.5" :class="isDark ? 'text-slate-500' : 'text-gray-400'">Payback</p>
                  <p class="text-sm font-semibold text-orange-500">{{ item.savings_estimate?.paybackYears || '—' }} yrs</p>
                </div>
                <div class="rounded-lg p-2.5" :class="isDark ? 'bg-slate-900' : 'bg-gray-50'">
                  <p class="text-[10px] uppercase tracking-wide mb-0.5" :class="isDark ? 'text-slate-500' : 'text-gray-400'">Financing</p>
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

// ── Role helpers ────────────────────────────────────────────────
const isDark = computed(() => themeStore.isDarkMode)
const isAdmin = computed(() => ['admin', 'superadmin'].includes(userStore.userRole))
// dealer (installer/contractor) persona — no finance tab
const isDealer = computed(() => ['dealer', 'installer'].includes(userStore.userRole))

// All roles that pass the gate see all three tabs.
// Dealer is stopped at the page level before rendering.
const visibleTabs = [
  { key: 'advisor', label: 'Calculator' },
  { key: 'ledger',  label: 'Ledger' },
  { key: 'saved',   label: 'Saved' }
]

// ── Consent gate ────────────────────────────────────────────────
// Admin/superadmin bypass consent. Customer/operations must grant finance_data.
const consentLoading = ref(false)
const hasFinanceConsent = computed(() =>
  isAdmin.value || userStore.hasConsent('finance_data')
)
const grantingConsent = ref(false)
const consentError = ref(null)

async function grantFinanceConsent() {
  grantingConsent.value = true
  consentError.value = null
  try {
    await api.patch('/auth/consents/finance_data', { decision: 'granted' })
    await userStore.getConsentStatus()
    await Promise.all([
      financeStore.fetchTransactions(),
      financeStore.fetchSummary(),
      assessmentStore.fetchAssessments()
    ])
  } catch (err) {
    consentError.value = err.response?.data?.error || 'Failed to enable finance access.'
  } finally {
    grantingConsent.value = false
  }
}

// ── Calculator inputs ───────────────────────────────────────────
const inputBill = ref(15000)
const systemSizeKW = ref(5)
const inflationRate = ref(4.5)
const loanDownPaymentPct = ref(20)
const loanTenureYears = ref(5)
const propertyOwned = ref(true)
const creditScore = ref(720)
const annualIncome = ref('₱1,500,000')

function php(amount) {
  return formatCurrency(Number(amount || 0), { fromUSD: false, currency: 'PHP', decimals: 0 })
}

// ── Calculations ────────────────────────────────────────────────
const systemCost = computed(() => (systemSizeKW.value || 5) * 72000)

const estimatedMonthlySavings = computed(() => {
  const solarSavingsVal = (systemSizeKW.value || 5) * 125 * 12.5
  return Math.min((inputBill.value || 15000) * 0.85, solarSavingsVal)
})

const estimatedRoi = computed(() => {
  if (!systemCost.value) return 0
  return Math.round((lifetimeProfit.value / systemCost.value) * 100)
})

const calculatedDownPayment = computed(() =>
  (systemCost.value * (loanDownPaymentPct.value || 20)) / 100
)

const calculatedEMI = computed(() => {
  const principal = systemCost.value - calculatedDownPayment.value
  const monthlyRate = 0.0625 / 12
  const totalMonths = (loanTenureYears.value || 5) * 12
  if (principal <= 0) return 0
  const factor = Math.pow(1 + monthlyRate, totalMonths)
  return (principal * monthlyRate * factor) / (factor - 1)
})

const computedPaybackYears = computed(() => {
  const annualSavings = estimatedMonthlySavings.value * 12
  if (!annualSavings) return 0
  return parseFloat((systemCost.value / annualSavings).toFixed(1))
})

const lifetimeProfit = computed(() => {
  const annualSavings = estimatedMonthlySavings.value * 12
  let total = 0, m = 1
  for (let y = 1; y <= 25; y++) {
    total += annualSavings * m
    m *= 1 + (inflationRate.value || 4.5) / 100
  }
  return total - systemCost.value
})

// ── Chart paths ─────────────────────────────────────────────────
const paybackPath = computed(() => {
  const pts = []
  const ic = systemCost.value, as_ = estimatedMonthlySavings.value * 12
  let net = -ic
  const div = Math.max(1, lifetimeProfit.value + ic * 1.5)
  for (let i = 0; i <= 25; i++) {
    if (i > 0) net += as_ * Math.pow(1 + (inflationRate.value || 4.5) / 100, i - 1)
    const x = 40 + (i / 25) * 440
    const y = 180 - ((net + ic) / div) * 160
    pts.push(`${x},${Math.min(180, Math.max(20, y))}`)
  }
  return `M ${pts.join(' L ')}`
})
const paybackPathFill = computed(() => `${paybackPath.value} L 480,180 L 40,180 Z`)
const paybackIntersectX = computed(() => 40 + Math.min(1, computedPaybackYears.value / 25) * 440)
const paybackIntersectY = computed(() => {
  const f = systemCost.value / (lifetimeProfit.value + systemCost.value * 1.5)
  return 180 - f * 160
})

// ── Financing options (computed for reactive values) ────────────
const financingOptions = computed(() => [
  {
    key: 'cash', name: 'Cash Purchase', badge: 'Best ROI', featured: false,
    desc: 'Full upfront payment. Maximum lifetime savings, zero interest.',
    line1Label: 'Upfront cost', line1Value: php(systemCost.value),
    line2Label: 'Payback', line2Value: `${computedPaybackYears.value} yrs`, line2Color: 'text-orange-500'
  },
  {
    key: 'loan', name: 'Apolaki PowerLoan', badge: 'Popular', featured: true,
    desc: '6.25% APR — own your system, monthly payments replace your bill.',
    line1Label: 'Down payment', line1Value: php(calculatedDownPayment.value),
    line2Label: 'Monthly EMI', line2Value: `${php(calculatedEMI.value)}/mo`, line2Color: 'text-orange-500'
  },
  {
    key: 'lease', name: 'Zero-Down Lease', badge: '₱0 down', featured: false,
    desc: 'Pay 30% less than your current bill. No ownership, no maintenance.',
    line1Label: 'Monthly', line1Value: `${php(inputBill.value * 0.7)}/mo`,
    line2Label: 'Maintenance', line2Value: 'Included', line2Color: 'text-emerald-500'
  }
])

// ── Prequalification ────────────────────────────────────────────
const creditScoreRange = computed(() => {
  const s = creditScore.value
  if (s >= 780) return 'Excellent (A)'
  if (s >= 700) return 'Very Good (B)'
  if (s >= 650) return 'Good (C)'
  return 'Subprime'
})

const prequalRating = computed(() => {
  if (!propertyOwned.value) {
    return {
      status: 'Secondary Review',
      desc: 'Leases / PPAs available without ownership. Custom installs need landlord consent.',
      icon: '🔒',
      colorClass: isDark.value
        ? 'bg-amber-950/30 text-amber-400 border-amber-800/60'
        : 'bg-amber-50 text-amber-700 border-amber-200'
    }
  }
  if (creditScore.value < 650) {
    return {
      status: 'Co-Signer Recommended',
      desc: 'A co-owner or security deposit ensures approval at 7.5% APR.',
      icon: '🤝',
      colorClass: isDark.value
        ? 'bg-slate-700/60 text-slate-300 border-slate-600'
        : 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }
  return {
    status: 'Pre-Approved',
    desc: 'Your profile qualifies for Apolaki PowerLoan at 6.25% fixed APR.',
    icon: '✓',
    colorClass: isDark.value
      ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60'
      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
  }
})

// ── Ledger stats ────────────────────────────────────────────────
const ledgerStats = computed(() => [
  { label: 'Income & Savings', value: php(financeStore.totalIncome || 0), color: 'text-emerald-500' },
  { label: 'Expenses', value: php(financeStore.totalExpenses || 0), color: 'text-red-500' },
  { label: 'Net Balance', value: php(financeStore.netBalance || 0), color: (financeStore.netBalance || 0) >= 0 ? 'text-emerald-500' : 'text-red-500' },
  { label: 'Transactions', value: String(financeStore.transactions.length), color: isDark.value ? 'text-slate-200' : 'text-gray-800' }
])

// ── Card class ──────────────────────────────────────────────────
const cardClass = computed(() =>
  isDark.value ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-gray-200'
)

// ── Transaction form ────────────────────────────────────────────
const form = reactive({
  type: '', category: '', amount: '',
  transactionDate: new Date().toISOString().split('T')[0],
  description: ''
})

function typeBadgeClass(type) {
  const d = isDark.value
  return {
    income:  d ? 'bg-emerald-900/40 text-emerald-400' : 'bg-emerald-50 text-emerald-700',
    savings: d ? 'bg-emerald-900/40 text-emerald-400' : 'bg-emerald-50 text-emerald-700',
    credit:  d ? 'bg-orange-900/30 text-orange-400'   : 'bg-orange-50 text-orange-700',
    expense: d ? 'bg-red-900/30 text-red-400'         : 'bg-red-50 text-red-700',
    payment: d ? 'bg-slate-700 text-slate-300'        : 'bg-gray-100 text-gray-600',
  }[type] || (d ? 'bg-slate-700 text-slate-400' : 'bg-gray-100 text-gray-500')
}

function isPositive(type) { return ['income', 'savings', 'credit'].includes(type) }
function formatDate(date) { return date ? new Date(date).toLocaleDateString() : '—' }

function selectFinancingOption(option) {
  if (option === 'cash') loanDownPaymentPct.value = 100
  else if (option === 'loan') loanDownPaymentPct.value = 20
  else loanDownPaymentPct.value = 0
  activeTab.value = 'advisor'
}

async function handleCreateTransaction() {
  createSuccess.value = false
  try {
    await financeStore.createTransaction({
      type: form.type, category: form.category,
      amount: form.amount, transactionDate: form.transactionDate,
      description: form.description
    })
    createSuccess.value = true
    Object.assign(form, { type: '', category: '', amount: '', transactionDate: new Date().toISOString().split('T')[0], description: '' })
    showAddForm.value = false
    await financeStore.fetchSummary()
  } catch (err) { console.error('Failed to create transaction:', err) }
}

async function loadData() {
  if (!userStore.consentStatus && userStore.isAuthenticated) {
    consentLoading.value = true
    try { await userStore.getConsentStatus() }
    catch (e) { console.warn('Failed to load consent status', e) }
    finally { consentLoading.value = false }
  }
  if (isDealer.value || !hasFinanceConsent.value) return

  const saved = localStorage.getItem('financingAssessmentState')
  if (saved) {
    try {
      const state = JSON.parse(saved)
      if (state.monthlyBill) inputBill.value = state.monthlyBill
      if (state.systemSize) systemSizeKW.value = state.systemSize
      loanTenureYears.value = 7
      loanDownPaymentPct.value = 20
    } catch (e) { /* ignore */ }
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
    address: 'Philippines', city: 'Manila', state: 'NCR', zipCode: '1000',
    roofCondition: 'good', roofArea: systemSizeKW.value * 6,
    annualUsage: Math.round(systemSizeKW.value * 125 * 12),
    sunExposure: 'high', obstructionLevel: 'low',
    recommendedCapacity: systemSizeKW.value, estimatedCost: systemCost.value,
    savingsEstimate: {
      monthlySavings: Math.round(estimatedMonthlySavings.value),
      paybackYears: computedPaybackYears.value, roi: estimatedRoi.value,
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

watch(hasFinanceConsent, (granted) => {
  if (granted && !financeStore.transactions.length && !financeStore.loading) {
    financeStore.fetchTransactions()
    financeStore.fetchSummary()
    assessmentStore.fetchAssessments()
  }
})
</script>
