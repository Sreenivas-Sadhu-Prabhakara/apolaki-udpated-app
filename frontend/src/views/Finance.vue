<template>
  <div class="min-h-screen py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-300" :class="isDark ? 'bg-[#111418]' : 'bg-gray-50'">
    <div class="max-w-7xl mx-auto">

      <!-- Consent banner for users with finance_data declined/pending -->
      <div v-if="!hasFinanceConsent" class="mb-8 rounded-2xl border p-8 text-center shadow-lg"
        :class="isDark ? 'bg-slate-800 border-amber-700/50' : 'bg-amber-50 border-amber-200'">
        <div class="text-4xl mb-3">💰</div>
        <h2 class="text-xl font-bold mb-2" :class="isDark ? 'text-slate-100' : 'text-gray-900'">Enable Finance Features</h2>
        <p class="mb-5 text-sm" :class="isDark ? 'text-slate-400' : 'text-gray-600'">
          To view your transactions, ROI calculations, and financing options, you need to enable <strong>Finance Data</strong> access in your privacy settings.
        </p>
        <button @click="grantFinanceConsent"
          class="inline-flex items-center gap-2 bg-[#0F6CBD] text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-[#0a5aa0] transition shadow-md">
          🔓 Enable Finance Access
        </button>
        <p class="mt-3 text-xs" :class="isDark ? 'text-slate-500' : 'text-gray-400'">You can revoke this any time from Profile → Privacy Settings</p>
      </div>

      <!-- Main content — only shown when consent is granted -->
      <template v-if="hasFinanceConsent">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <span class="text-amber-500 font-semibold text-xs tracking-wider uppercase">PRD 2 • Solar Financing & Evaluation</span>
          <h1 class="text-4xl font-extrabold tracking-tight mt-1" :class="isDark ? 'text-slate-100' : 'text-gray-900'">💰 Solar Financing & ROI Advisor</h1>
          <p class="mt-2 text-sm" :class="isDark ? 'text-slate-400' : 'text-gray-600'">Simulate loan payment swaps, evaluate real payback period, pre-qualify for loans, and manage your billing transactions.</p>
        </div>
        <div class="flex items-center gap-2">
          <button @click="activeTab = 'advisor'" 
            class="px-4 py-2.5 rounded-lg font-medium text-sm transition-all shadow-sm"
            :class="activeTab === 'advisor' ? 'bg-[#0F6CBD] text-white' : (isDark ? 'bg-slate-800 text-slate-300' : 'bg-white text-gray-700 border border-gray-200')">
            🧮 Interactive Calculator
          </button>
          <button @click="activeTab = 'ledger'" 
            class="px-4 py-2.5 rounded-lg font-medium text-sm transition-all shadow-sm"
            :class="activeTab === 'ledger' ? 'bg-[#0F6CBD] text-white' : (isDark ? 'bg-slate-800 text-slate-300' : 'bg-white text-gray-700 border border-gray-200')">
            📑 Transaction Ledger
          </button>
          <button @click="activeTab = 'saved'" 
            class="px-4 py-2.5 rounded-lg font-medium text-sm transition-all shadow-sm relative"
            :class="activeTab === 'saved' ? 'bg-amber-500 text-white' : (isDark ? 'bg-slate-800 text-slate-300' : 'bg-white text-gray-700 border border-gray-200')">
            💾 Saved Simulations
            <span v-if="assessmentStore.assessments.length" class="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">{{ assessmentStore.assessments.length }}</span>
          </button>
        </div>
      </div>

      <!-- TAB 1: INTERACTIVE ADVISOR & CALCULATOR -->
      <div v-if="activeTab === 'advisor'" class="space-y-8">
        <!-- Live Bill-Swap Calculator Hero -->
        <div class="rounded-2xl p-6 md:p-8 border shadow-lg relative overflow-hidden" 
          :class="isDark ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 border-slate-700' : 'bg-gradient-to-br from-[#0F6CBD]/5 via-white to-orange-50/5 border-[#0F6CBD]/10'">
          <div class="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div class="lg:col-span-7">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 mb-4">
                🔥 Hot Option: Payment Swap Model
              </span>
              <h2 class="text-3xl font-extrabold tracking-tight mb-3" :class="isDark ? 'text-white' : 'text-slate-900'">
                Replace your electricity bill with a lower monthly solar payment
              </h2>
              <p class="text-base leading-relaxed mb-6" :class="isDark ? 'text-slate-300' : 'text-slate-600'">
                Instead of paying for ever-rising utility power, swap that bill for an equity-accruing Solar Plan. Pay off the system in 5-7 years and get free energy for the next 20+ years.
              </p>

              <!-- Sliders Panel -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-800/10 dark:bg-slate-950/40 p-5 rounded-xl border border-slate-200/50 dark:border-slate-800/80 mb-6">
                <div>
                  <div class="flex justify-between text-sm font-semibold mb-2" :class="isDark ? 'text-slate-200' : 'text-slate-700'">
                    <span>Current Electricity Bill:</span>
                    <span class="text-[#0F6CBD] dark:text-[#F4C94C] font-bold">{{ formatCurrency(inputBill) }}/mo</span>
                  </div>
                  <input type="range" min="2000" max="40000" step="500" v-model.number="inputBill" class="w-full h-2 rounded-lg appearance-none cursor-pointer accent-[#0F6CBD] dark:accent-[#F4C94C] bg-slate-300 dark:bg-slate-800" />
                  <div class="flex justify-between text-xs text-gray-400 mt-1">
                    <span>₱2k</span>
                    <span>₱20k</span>
                    <span>₱40k+</span>
                  </div>
                </div>

                <div>
                  <div class="flex justify-between text-sm font-semibold mb-2" :class="isDark ? 'text-slate-200' : 'text-slate-700'">
                    <span>Desired Solar System Size:</span>
                    <span class="text-[#0F6CBD] dark:text-[#F4C94C] font-bold">{{ systemSizeKW }} kWp</span>
                  </div>
                  <input type="range" min="1.5" max="20" step="0.5" v-model.number="systemSizeKW" class="w-full h-2 rounded-lg appearance-none cursor-pointer accent-[#0F6CBD] dark:accent-[#F4C94C] bg-slate-300 dark:bg-slate-800" />
                  <div class="flex justify-between text-xs text-gray-400 mt-1">
                    <span>1.5 kWp (Starter)</span>
                    <span>10 kWp</span>
                    <span>20 kWp (SME)</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Calculated Metrics Cards -->
            <div class="lg:col-span-5 flex flex-col gap-4">
              <div class="p-6 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/10 border border-emerald-500/30">
                <span class="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Monthly Net Savings</span>
                <p class="text-4xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                  {{ php(estimatedMonthlySavings) }}
                </p>
                <p class="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-1">That's {{ Math.round((estimatedMonthlySavings / inputBill) * 100) }}% off your current utility profile bill.</p>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div class="p-4 rounded-xl" :class="isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white border border-gray-100 shadow-sm'">
                  <span class="text-xs text-gray-400 font-medium block">Payback Period</span>
                  <span class="text-xl font-bold" :class="isDark ? 'text-amber-400' : 'text-slate-800'">{{ computedPaybackYears }} Years</span>
                  <span class="text-[10px] text-gray-400 block mt-0.5">Until 100% Free Energy</span>
                </div>
                <div class="p-4 rounded-xl" :class="isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white border border-gray-100 shadow-sm'">
                  <span class="text-xs text-gray-400 font-medium block">25-Yr System Profit</span>
                  <span class="text-xl font-bold text-emerald-500">{{ php(lifetimeProfit) }}</span>
                  <span class="text-[10px] text-gray-400 block mt-0.5">Estimated Net Gain</span>
                </div>
              </div>

              <!-- Save Simulation CTA -->
              <button @click="saveCurrentSimulation"
                :disabled="assessmentStore.saving"
                class="mt-4 w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                :class="saveSuccess ? 'bg-emerald-500 text-white' : 'bg-amber-500 hover:bg-amber-400 text-slate-900'">
                <span v-if="assessmentStore.saving">⏳ Saving...</span>
                <span v-else-if="saveSuccess">✅ Simulation Saved!</span>
                <span v-else>💾 Save This Simulation</span>
              </button>
              <p v-if="assessmentStore.lastSaved" class="text-[10px] text-center mt-1 text-gray-400">
                Last saved: {{ formatDate(assessmentStore.lastSaved) }}
              </p>
            </div>
          </div>
        </div>

        <!-- 3 Pillars of Solar Financing Options -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Option A: Cash Purchase -->
          <div class="rounded-xl border p-6 flex flex-col justify-between transition-all" 
            :class="isDark ? 'bg-slate-800/50 border-slate-700 hover:border-[#0F6CBD]' : 'bg-white border-gray-200 hover:border-[#0F6CBD] shadow-sm'">
            <div>
              <div class="flex justify-between items-start mb-4">
                <span class="text-2xl">⚡</span>
                <span class="text-xs font-semibold px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 rounded-md">Best Lifetime ROI</span>
              </div>
              <h3 class="text-xl font-bold mb-2" :class="isDark ? 'text-slate-100' : 'text-gray-900'">Cash Purchase</h3>
              <p class="text-xs mb-4" :class="isDark ? 'text-slate-400' : 'text-gray-500'">Pay upfront for maximum lifetime savings without interest payments or debt burdens.</p>
              <div class="space-y-2 mb-6">
                <div class="flex justify-between text-sm"><span class="text-gray-400">Est. Upfront Cost:</span><span class="font-bold">{{ formatCurrency(systemCost) }}</span></div>
                <div class="flex justify-between text-sm"><span class="text-gray-400">Monthly Power Bill:</span><span class="font-semibold text-emerald-500">₱0 (Free)</span></div>
                <div class="flex justify-between text-sm"><span class="text-gray-400">Payback Period:</span><span class="font-semibold text-[#F4C94C]">{{ computedPaybackYears }} yrs</span></div>
              </div>
            </div>
            <button @click="selectFinancingOption('cash')" class="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition">
              Select Cash Simulation
            </button>
          </div>

          <!-- Option B: Green Solar Loan -->
          <div class="rounded-xl border p-6 flex flex-col justify-between transition-all relative ring-2 ring-[#0F6CBD] ring-offset-2 ring-offset-transparent"
            :class="isDark ? 'bg-slate-800/80 border-[#0F6CBD]' : 'bg-white border-[#0F6CBD] shadow-sm'">
            <div class="absolute -top-3 right-4 bg-[#0F6CBD] text-white text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full shadow-sm">
              Most Popular
            </div>
            <div>
              <div class="flex justify-between items-start mb-4">
                <span class="text-2xl">🏦</span>
                <span class="text-xs font-semibold px-2 py-1 bg-[#F4C94C]/20 text-yellow-700 dark:bg-yellow-900/40 dark:text-[#F4C94C] rounded-md">Immediate Swap</span>
              </div>
              <h3 class="text-xl font-bold mb-2" :class="isDark ? 'text-slate-100' : 'text-gray-900'">Apolaki PowerLoan</h3>
              <p class="text-xs mb-4" :class="isDark ? 'text-slate-400' : 'text-gray-500'">Own your solar system with low interest payments matching or lower than your current bill.</p>
              <div class="space-y-2 mb-6">
                <div class="flex justify-between text-sm"><span class="text-gray-400">Down Payment:</span><span class="font-semibold">{{ formatCurrency(calculatedDownPayment) }}</span></div>
                <div class="flex justify-between text-sm"><span class="text-gray-400">Monthly EMI Payment:</span><span class="font-bold text-orange-500">{{ formatCurrency(calculatedEMI) }}/mo</span></div>
                <div class="flex justify-between text-sm"><span class="text-gray-400">Annual Percentage APR:</span><span class="font-semibold">6.25%</span></div>
              </div>
            </div>
            <button @click="selectFinancingOption('loan')" class="w-full py-2 bg-[#0F6CBD] hover:bg-[#0c5ea2] text-white rounded-lg text-sm font-semibold transition animate-pulse">
              Configure Loan Sliders
            </button>
          </div>

          <!-- Option C: Solar Lease / PPA -->
          <div class="rounded-xl border p-6 flex flex-col justify-between transition-all" 
            :class="isDark ? 'bg-slate-800/50 border-slate-700 hover:border-[#0F6CBD]' : 'bg-white border-gray-200 hover:border-[#0F6CBD] shadow-sm'">
            <div>
              <div class="flex justify-between items-start mb-4">
                <span class="text-2xl">📜</span>
                <span class="text-xs font-semibold px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 rounded-md">Zero Downpayment</span>
              </div>
              <h3 class="text-xl font-bold mb-2" :class="isDark ? 'text-slate-100' : 'text-gray-900'">Zero-Down Subscription</h3>
              <p class="text-xs mb-4" :class="isDark ? 'text-slate-400' : 'text-gray-500'">Let our partners build the arrays. You just subscribe to energy costing 25-35% less than your utility.</p>
              <div class="space-y-2 mb-6">
                <div class="flex justify-between text-sm"><span class="text-gray-400">Upfront Capital:</span><span class="font-semibold text-emerald-500">₱0 (Free Setup)</span></div>
                <div class="flex justify-between text-sm"><span class="text-gray-400">Lease Payment Rate:</span><span class="font-semibold">{{ formatCurrency(inputBill * 0.7) }}/mo</span></div>
                <div class="flex justify-between text-sm"><span class="text-gray-400">Maintenance & Insurance:</span><span class="font-semibold">Included</span></div>
              </div>
            </div>
            <button @click="selectFinancingOption('lease')" class="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition">
              Select Subscription
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <!-- Interactive Adjusters and ROI Projections Graph -->
          <div class="lg:col-span-8 rounded-2xl border p-6 space-y-6" :class="cardClass">
            <h3 class="text-lg font-bold" :class="isDark ? 'text-white' : 'text-slate-900'">📈 Payback & Cumulative Growth Graph (25 Years)</h3>
            <p class="text-xs text-gray-400">Adjust the inputs to see when your break-even point occurs. Total initial balance turns positive permanently as savings stack.</p>

            <!-- Pure SVG Interactive Payback Chart -->
            <div class="relative h-[250px] w-full rounded-xl bg-slate-950/60 p-4 border border-slate-800 overflow-hidden">
              <svg viewBox="0 0 500 200" class="w-full h-full text-xs overflow-visible" preserveAspectRatio="none">
                <!-- Grid Lines -->
                <line x1="40" y1="20" x2="480" y2="20" stroke="#334155" stroke-dasharray="4,4" />
                <line x1="40" y1="80" x2="480" y2="80" stroke="#334155" stroke-dasharray="4,4" />
                <line x1="40" y1="140" x2="480" y2="140" stroke="#334155" stroke-dasharray="4,4" />
                <line x1="40" y1="180" x2="480" y2="180" class="stroke-slate-500" stroke-width="1.5" />

                <!-- Payback Curve Paths -->
                <path :d="paybackPath" fill="none" class="stroke-[#0F6CBD]" stroke-width="3" />
                <path :d="paybackPathFill" fill="url(#blue-grad)" opacity="0.15" />

                <!-- Payback Break-Even Intersect Circle -->
                <circle :cx="paybackIntersectX" :cy="paybackIntersectY" r="6" fill="#F4C94C" class="animate-ping" />
                <circle :cx="paybackIntersectX" :cy="paybackIntersectY" r="5" fill="#F4C94C" stroke="#fff" stroke-width="1.5" />

                <!-- Tooltip line -->
                <line :x1="paybackIntersectX" y1="20" :x2="paybackIntersectX" y2="180" stroke="#F4C94C" stroke-width="1" stroke-dasharray="2,2" />

                <!-- Text Labels -->
                <text x="45" y="15" fill="#94A3B8" class="text-[9px]">Lifetime Savings Projections</text>
                <text :x="paybackIntersectX + 10" :y="paybackIntersectY - 10" fill="#F4C94C" class="text-[10px] font-bold">Payback Point (Yr {{ computedPaybackYears }})</text>

                <!-- Gradients -->
                <defs>
                  <linearGradient id="blue-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#0F6CBD" />
                    <stop offset="100%" stop-color="#0F6CBD" stop-opacity="0" />
                  </linearGradient>
                </defs>
              </svg>
              <!-- Timeline Steps -->
              <div class="flex justify-between text-[10px] mt-2 text-slate-400 font-semibold px-4">
                <span>Year 0</span>
                <span>Year 5 (Payoff)</span>
                <span>Year 10</span>
                <span>Year 15</span>
                <span>Year 20</span>
                <span>Year 25 (ROI)</span>
              </div>
            </div>

            <!-- Custom Financial Parameters -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t" :class="isDark ? 'border-slate-700' : 'border-gray-100'">
              <div>
                <label class="block text-xs font-semibold text-gray-400 uppercase mb-1">Local Inflation Rate</label>
                <select v-model.number="inflationRate" class="w-full text-sm bg-transparent rounded-lg border border-slate-700 px-3 py-2 text-slate-100">
                  <option :value="3">3.0% (Stable)</option>
                  <option :value="4.5">4.5% (Baseline)</option>
                  <option :value="6">6.0% (High Inflation)</option>
                  <option :value="7.5">7.5% (Volatile)</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-400 uppercase mb-1">System Down payment %</label>
                <input type="number" min="0" max="90" v-model.number="loanDownPaymentPct" class="w-full text-sm bg-transparent rounded-lg border border-slate-700 px-3 py-2 text-slate-100" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-400 uppercase mb-1">Loan Term / Tenure</label>
                <select v-model.number="loanTenureYears" class="w-full text-sm bg-transparent rounded-lg border border-slate-700 px-3 py-2 text-slate-100">
                  <option :value="3">3 Years (Short Term)</option>
                  <option :value="5">5 Years (Standard)</option>
                  <option :value="7">7 Years (Low Monthly)</option>
                  <option :value="10">10 Years (Max Stretch)</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Solar Financial Prequalifier -->
          <div class="lg:col-span-4 rounded-2xl border p-6 flex flex-col justify-between" :class="cardClass">
            <div>
              <div class="flex items-center gap-2 mb-4">
                <span class="text-xl">📋</span>
                <h3 class="text-lg font-bold" :class="isDark ? 'text-white' : 'text-slate-900'">Prequalify Instantly</h3>
              </div>
              <p class="text-xs mb-6" :class="isDark ? 'text-slate-400' : 'text-slate-500'">Confirm your indicators to determine instant solar project eligibility approval with Apolaki Financing.</p>

              <form @submit.prevent="checkPrequalify" class="space-y-4">
                <div>
                  <label class="block text-xs font-semibold text-gray-400 uppercase mb-1">Property Ownership</label>
                  <div class="grid grid-cols-2 gap-2">
                    <button type="button" @click="propertyOwned = true" 
                      class="py-2 rounded-lg text-xs font-bold border transition-colors"
                      :class="propertyOwned ? 'bg-[#0F6CBD] text-white border-[#0F6CBD]' : 'bg-slate-800 text-slate-400 border-slate-700'">
                      I Own Property
                    </button>
                    <button type="button" @click="propertyOwned = false" 
                      class="py-2 rounded-lg text-xs font-bold border transition-colors"
                      :class="!propertyOwned ? 'bg-[#0F6CBD] text-white border-[#0F6CBD]' : 'bg-slate-800 text-slate-400 border-slate-700'">
                      I rent / tenants
                    </button>
                  </div>
                </div>

                <div>
                  <div class="flex justify-between text-xs font-semibold text-gray-400 uppercase mb-1">
                    <span>Est. Credit Grade:</span>
                    <span class="font-bold text-[#F4C94C]">{{ creditScoreRange }}</span>
                  </div>
                  <input type="range" min="550" max="850" step="10" v-model.number="creditScore" class="w-full accent-[#0F6CBD]" />
                </div>

                <div>
                  <label class="block text-xs font-semibold text-gray-400 uppercase mb-1">Annual Combined Household Income</label>
                  <input type="text" placeholder="₱1,200,000" v-model="annualIncome" class="w-full bg-slate-900/50 border border-slate-700 rounded-lg py-2 px-3 text-sm" />
                </div>
              </form>
            </div>

            <!-- Qualification Rating Status -->
            <div class="mt-6 p-4 rounded-xl space-y-2 border" :class="prequalRating.colorClass">
              <div class="flex justify-between items-center">
                <span class="text-xs font-bold uppercase tracking-wider">Simulated Approval Status</span>
                <span class="text-lg">{{ prequalRating.icon }}</span>
              </div>
              <p class="text-xl font-black">{{ prequalRating.status }}</p>
              <p class="text-[10px] leading-snug">{{ prequalRating.desc }}</p>
            </div>

            <!-- Contact Financing Advisor CTA -->
            <router-link to="/messaging?financierId=f1" class="mt-4 w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 border"
              :class="isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm'">
              💬 Message Financing Advisor
            </router-link>
          </div>
        </div>
      </div>

      <!-- TAB 2: GENERAL TRANSACTION LEDGER -->
      <div v-else-if="activeTab === 'ledger'" class="space-y-8">
        <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div class="rounded-xl shadow-sm border p-6" :class="cardClass">
            <p class="text-sm font-medium" :class="isDark ? 'text-slate-400' : 'text-gray-500'">Total Income / Savings</p>
            <p class="text-3xl font-bold text-green-600 dark:text-emerald-400">{{ php(financeStore.totalIncome) }}</p>
          </div>
          <div class="rounded-xl shadow-sm border p-6" :class="cardClass">
            <p class="text-sm font-medium" :class="isDark ? 'text-slate-400' : 'text-gray-500'">Total Expenses</p>
            <p class="text-3xl font-bold text-red-600 dark:text-red-400">{{ php(financeStore.totalExpenses) }}</p>
          </div>
          <div class="rounded-xl shadow-sm border p-6" :class="cardClass">
            <p class="text-sm font-medium" :class="isDark ? 'text-slate-400' : 'text-gray-500'">Net Balance</p>
            <p class="text-3xl font-bold" :class="financeStore.netBalance >= 0 ? 'text-green-600' : 'text-red-600'">
              {{ php(financeStore.netBalance) }}
            </p>
          </div>
          <div class="rounded-xl shadow-sm border p-6" :class="cardClass">
            <p class="text-sm font-medium" :class="isDark ? 'text-slate-400' : 'text-gray-500'">Transactions</p>
            <p class="text-3xl font-bold" :class="isDark ? 'text-blue-400' : 'text-blue-600'">{{ financeStore.transactions.length }}</p>
          </div>
        </div>

        <!-- Summary by Type -->
        <div v-if="financeStore.summary.length > 0" class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div v-for="s in financeStore.summary" :key="s.type" class="rounded-xl shadow-sm border p-6" :class="cardClass">
            <div class="flex items-center gap-3 mb-2">
              <span class="text-2xl">{{ typeIcon(s.type) }}</span>
              <p class="text-sm font-medium capitalize" :class="isDark ? 'text-slate-400' : 'text-gray-500'">{{ s.type }}</p>
            </div>
            <p class="text-2xl font-bold" :class="isDark ? 'text-slate-100' : 'text-gray-900'">{{ php(s.total || 0) }}</p>
            <p class="text-sm" :class="isDark ? 'text-slate-500' : 'text-gray-400'">{{ s.count }} transaction{{ s.count != 1 ? 's' : '' }} · Avg {{ php(s.average || 0) }}</p>
          </div>
        </div>

        <!-- Add Transaction Form -->
        <div v-if="showAddForm" class="rounded-xl shadow-lg border p-6" :class="cardClass">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold" :class="isDark ? 'text-slate-100' : 'text-gray-900'">Record Transaction</h2>
            <button @click="showAddForm = false" class="text-2xl" :class="isDark ? 'text-slate-500 hover:text-slate-300' : 'text-gray-400 hover:text-gray-600'">&times;</button>
          </div>
          <form @submit.prevent="handleCreateTransaction" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1" :class="isDark ? 'text-slate-300' : 'text-gray-700'">Type</label>
              <select v-model="form.type" required class="w-full rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500" :class="isDark ? 'bg-slate-900 border-slate-600 text-slate-100 placeholder-slate-500' : 'border-gray-300 text-gray-900'">
                <option value="">Select type...</option>
                <option value="income">Income / Savings</option>
                <option value="expense">Expense / Payment</option>
                <option value="credit">Tax Credit</option>
                <option value="payment">Loan Payment</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium mb-1" :class="isDark ? 'text-slate-300' : 'text-gray-700'">Category</label>
              <select v-model="form.category" required class="w-full rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500" :class="isDark ? 'bg-slate-900 border-slate-600 text-slate-100 placeholder-slate-500' : 'border-gray-300 text-gray-900'">
                <option value="">Select category...</option>
                <option value="energy_savings">Energy Savings</option>
                <option value="equipment_purchase">Equipment Purchase</option>
                <option value="installation_cost">Installation Cost</option>
                <option value="maintenance">Maintenance</option>
                <option value="tax_credit">Tax Credit</option>
                <option value="loan_payment">Loan Payment</option>
                <option value="utility_bill">Utility Bill</option>
                <option value="net_metering">Net Metering Income</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium mb-1" :class="isDark ? 'text-slate-300' : 'text-gray-700'">Amount (₱)</label>
              <input v-model.number="form.amount" type="number" step="0.01" placeholder="1000.00" required class="w-full rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500" :class="inputClass" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1" :class="isDark ? 'text-slate-300' : 'text-gray-700'">Date</label>
              <input v-model="form.transactionDate" type="date" required class="w-full rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500" :class="inputClass" />
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-medium mb-1" :class="isDark ? 'text-slate-300' : 'text-gray-700'">Description</label>
              <input v-model="form.description" type="text" placeholder="Monthly electricity savings from solar" class="w-full rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500" :class="inputClass" />
            </div>
            <div class="md:col-span-2 flex gap-3">
              <button type="submit" :disabled="financeStore.loading" class="bg-orange-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 transition">
                {{ financeStore.loading ? 'Saving...' : 'Save Transaction' }}
              </button>
              <button type="button" @click="showAddForm = false" class="border px-6 py-3 rounded-lg font-medium transition" :class="isDark ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'">
                Cancel
              </button>
            </div>
            <p v-if="financeStore.error" class="md:col-span-2 text-red-500 text-sm">{{ financeStore.error }}</p>
            <p v-if="createSuccess" class="md:col-span-2 text-green-500 text-sm font-medium">✓ Transaction recorded</p>
          </form>
        </div>

        <!-- Transactions Table -->
        <div class="rounded-xl shadow-sm border overflow-hidden" :class="cardClass">
          <div class="px-6 py-4 border-b flex justify-between items-center" :class="isDark ? 'border-slate-700' : 'border-gray-200'">
            <h2 class="text-xl font-bold" :class="isDark ? 'text-slate-100' : 'text-gray-900'">Transaction History</h2>
            <div class="flex items-center gap-3">
              <button @click="showAddForm = true" class="bg-orange-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-orange-700 transition">
                + Add Entry
              </button>
              <button @click="loadData" class="text-sm font-medium" :class="isDark ? 'text-amber-400 hover:text-amber-300' : 'text-orange-600 hover:text-orange-800'">🔄 Refresh</button>
            </div>
          </div>

          <div v-if="financeStore.loading && !financeStore.transactions.length" class="text-center py-16" :class="isDark ? 'text-slate-400' : 'text-gray-500'">
            Loading transactions...
          </div>

          <div v-else-if="financeStore.transactions.length === 0" class="text-center py-16">
            <div class="text-5xl mb-4">💸</div>
            <h3 class="text-lg font-semibold" :class="isDark ? 'text-slate-200' : 'text-gray-700'">No transactions yet</h3>
            <p class="mt-2" :class="isDark ? 'text-slate-400' : 'text-gray-500'">Record your first solar-related transaction to start tracking</p>
          </div>

          <table v-else class="w-full text-sm">
            <thead>
              <tr class="border-b text-left uppercase text-xs" :class="isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-gray-50 text-gray-500 border-gray-200'">
                <th class="px-6 py-3">Date</th>
                <th class="px-6 py-3">Type</th>
                <th class="px-6 py-3">Category</th>
                <th class="px-6 py-3">Description</th>
                <th class="px-6 py-3 text-right">Amount</th>
                <th class="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="txn in financeStore.transactions" :key="txn.id" class="border-b transition" :class="isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-gray-200 hover:bg-gray-50'">
                <td class="px-6 py-4">{{ formatDate(txn.transaction_date) }}</td>
                <td class="px-6 py-4">
                  <span :class="typeBadgeClass(txn.type)" class="px-2 py-1 rounded text-xs font-medium capitalize">
                    {{ txn.type }}
                  </span>
                </td>
                <td class="px-6 py-4 capitalize">{{ (txn.category || '').replace(/_/g, ' ') }}</td>
                <td class="px-6 py-4 max-w-xs truncate" :class="isDark ? 'text-slate-400' : 'text-gray-600'">{{ txn.description || '—' }}</td>
                <td class="px-6 py-4 text-right font-semibold" :class="isPositive(txn.type) ? 'text-green-500' : 'text-red-500'">
                  {{ isPositive(txn.type) ? '+' : '-' }}{{ php(txn.amount || 0) }}
                </td>
                <td class="px-6 py-4">
                  <span :class="txn.status === 'completed' ? 'text-green-500' : 'text-yellow-500'" class="text-xs font-medium capitalize">
                    {{ txn.status || 'pending' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- TAB 3: SAVED SIMULATIONS -->
      <div v-if="activeTab === 'saved'" class="space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-bold" :class="isDark ? 'text-slate-100' : 'text-gray-900'">💾 My Saved Simulations</h2>
            <p class="text-sm mt-1" :class="isDark ? 'text-slate-400' : 'text-gray-500'">Retrieve and compare your past financing scenarios across sessions.</p>
          </div>
          <button @click="assessmentStore.fetchAssessments()" class="text-sm font-medium flex items-center gap-1" :class="isDark ? 'text-amber-400 hover:text-amber-300' : 'text-orange-600 hover:text-orange-800'">
            🔄 Refresh
          </button>
        </div>

        <div v-if="assessmentStore.loading" class="text-center py-20" :class="isDark ? 'text-slate-400' : 'text-gray-500'">
          Loading saved simulations...
        </div>

        <div v-else-if="!assessmentStore.assessments.length" class="text-center py-20 rounded-2xl border" :class="isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-100'">
          <div class="text-5xl mb-4">🗂️</div>
          <h3 class="text-lg font-semibold" :class="isDark ? 'text-slate-200' : 'text-gray-700'">No simulations saved yet</h3>
          <p class="mt-2 text-sm" :class="isDark ? 'text-slate-400' : 'text-gray-500'">Use the Interactive Calculator and hit <strong>💾 Save This Simulation</strong> to store results here.</p>
          <button @click="activeTab = 'advisor'" class="mt-4 px-5 py-2 bg-[#0F6CBD] text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition">
            Go to Calculator
          </button>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div v-for="item in assessmentStore.assessments" :key="item.id"
            class="rounded-2xl border p-5 flex flex-col gap-3 transition hover:shadow-lg cursor-pointer"
            :class="isDark ? 'bg-slate-900 border-slate-700 hover:border-amber-500/50' : 'bg-white border-gray-100 shadow-sm hover:border-blue-300'"
            @click="loadSavedSimulation(item)">
            <div class="flex items-start justify-between">
              <div>
                <span class="text-xs font-bold uppercase tracking-wider text-amber-500">Saved Scenario</span>
                <h3 class="font-bold mt-0.5" :class="isDark ? 'text-slate-100' : 'text-slate-800'">{{ item.description || 'Solar Simulation' }}</h3>
              </div>
              <span class="text-xs px-2 py-1 rounded-full font-semibold" :class="isDark ? 'bg-slate-800 text-slate-300' : 'bg-gray-100 text-gray-600'">
                {{ formatDate(item.created_at || item.createdAt) }}
              </span>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div class="rounded-lg p-3" :class="isDark ? 'bg-slate-800' : 'bg-gray-50'">
                <p class="text-[10px] text-gray-400 font-medium uppercase tracking-wide">System Size</p>
                <p class="font-bold text-sm" :class="isDark ? 'text-slate-100' : 'text-slate-700'">{{ item.recommended_capacity || item.annualUsage ? (item.recommended_capacity || '—') + ' kWp' : '—' }}</p>
              </div>
              <div class="rounded-lg p-3" :class="isDark ? 'bg-slate-800' : 'bg-gray-50'">
                <p class="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Financing</p>
                <p class="font-bold text-sm capitalize" :class="isDark ? 'text-slate-100' : 'text-slate-700'">{{ item.financing_option || item.financingOption || 'Loan' }}</p>
              </div>
              <div class="rounded-lg p-3" :class="isDark ? 'bg-slate-800' : 'bg-gray-50'">
                <p class="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Est. Savings</p>
                <p class="font-bold text-sm text-emerald-500">{{ php(item.savings_estimate?.monthlySavings || 0) }}/mo</p>
              </div>
              <div class="rounded-lg p-3" :class="isDark ? 'bg-slate-800' : 'bg-gray-50'">
                <p class="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Payback</p>
                <p class="font-bold text-sm" :class="isDark ? 'text-amber-400' : 'text-slate-700'">{{ item.payback_years || item.paybackYears || '—' }} yrs</p>
              </div>
            </div>
            <button class="mt-1 text-xs font-semibold text-[#0F6CBD] hover:underline text-left">▶ Load this scenario into calculator →</button>
          </div>
        </div>
      </div>
      </template><!-- end v-if="hasFinanceConsent" -->
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useFinanceStore } from '../stores/financeStore'
import { useFinancingAssessmentStore } from '../stores/financingAssessmentStore'
import { useThemeStore } from '../stores/themeStore'
import { useUserStore } from '../stores/userStore'
import { formatCurrency } from '../utils/currency'

const financeStore = useFinanceStore()
const assessmentStore = useFinancingAssessmentStore()
const themeStore = useThemeStore()
const userStore = useUserStore()
const router = useRouter()
const showAddForm = ref(false)
const createSuccess = ref(false)
const saveSuccess = ref(false)
const activeTab = ref('advisor')

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
const hasFinanceConsent = computed(() =>
  isElevatedRole.value || userStore.hasConsent('finance_data')
)

function grantFinanceConsent() {
  router.push({ name: 'ConsentOnboarding', query: { required: 'finance_data', next: '/finance' } })
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
</script>
