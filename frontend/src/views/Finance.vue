<template>
  <div class="min-h-screen transition-colors duration-200"
    :class="isDark ? 'bg-slate-900' : 'bg-gray-50'">

    <!-- ── Gate states (full-screen centered) ─────────────────── -->

    <!-- Loading -->
    <div v-if="consentLoading"
      class="flex flex-col items-center justify-center min-h-screen gap-4">
      <div class="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p class="text-sm" :class="isDark ? 'text-slate-400' : 'text-gray-500'">Loading…</p>
    </div>

    <!-- Contractor / dealer blocked -->
    <div v-else-if="isDealer"
      class="flex flex-col items-center justify-center min-h-screen px-6">
      <div class="max-w-sm w-full text-center">
        <div class="w-12 h-12 rounded-2xl mx-auto mb-6 flex items-center justify-center"
          :class="isDark ? 'bg-slate-800' : 'bg-slate-100'">
          <svg class="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
          </svg>
        </div>
        <h2 class="text-lg font-semibold mb-2"
          :class="isDark ? 'text-slate-100' : 'text-gray-900'">Not Available</h2>
        <p class="text-sm leading-relaxed"
          :class="isDark ? 'text-slate-400' : 'text-gray-500'">
          The Finance module is not available for Contractor accounts.
          Financial activity is managed through your project contracts.
        </p>
        <router-link to="/dashboard"
          class="inline-block mt-6 text-sm font-medium text-blue-600 hover:text-blue-700 transition">
          ← Back to Dashboard
        </router-link>
      </div>
    </div>

    <!-- Consent gate -->
    <div v-else-if="!hasFinanceConsent"
      class="flex flex-col items-center justify-center min-h-screen px-6">
      <div class="max-w-sm w-full text-center">
        <div class="w-12 h-12 rounded-2xl mx-auto mb-6 flex items-center justify-center bg-blue-50">
          <svg class="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75"/>
          </svg>
        </div>
        <h2 class="text-lg font-semibold mb-2"
          :class="isDark ? 'text-slate-100' : 'text-gray-900'">Finance Access Required</h2>
        <p class="text-sm leading-relaxed mb-7"
          :class="isDark ? 'text-slate-400' : 'text-gray-500'">
          Enable finance data access to view your ROI projections,
          transaction history, and financing options.
        </p>
        <button @click="grantFinanceConsent" :disabled="grantingConsent"
          class="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white
                 px-6 py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-50">
          <span v-if="grantingConsent"
            class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin">
          </span>
          {{ grantingConsent ? 'Enabling…' : 'Enable Finance Access' }}
        </button>
        <p v-if="consentError" class="mt-4 text-xs text-red-500">{{ consentError }}</p>
        <p class="mt-5 text-xs" :class="isDark ? 'text-slate-600' : 'text-gray-400'">
          Revoke anytime from Profile → Privacy Settings
        </p>
      </div>
    </div>

    <!-- ── Main page ───────────────────────────────────────────── -->
    <div v-if="!consentLoading && !isDealer && hasFinanceConsent"
      class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      <!-- Page header -->
      <div class="mb-8">
        <p class="text-xs font-semibold uppercase tracking-widest mb-1 text-blue-600">
          Solar Financing
        </p>
        <div class="flex items-end justify-between">
          <h1 class="text-2xl font-bold"
            :class="isDark ? 'text-slate-100' : 'text-gray-900'">Financial Advisor</h1>
          <span v-if="isAdmin"
            class="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
            Admin · All users
          </span>
        </div>
      </div>

      <!-- Tab bar — clean underline style, blue accent -->
      <div class="border-b mb-8" :class="isDark ? 'border-slate-700' : 'border-gray-200'">
        <div class="grid grid-cols-3 gap-20 justify-between max-w-4xl mx-auto">
          <button
            v-for="tab in visibleTabs" :key="tab.key"
            @click="activeTab = tab.key"
            class="relative px-5 py-3 text-sm font-medium transition-colors whitespace-nowrap w-full"
            :class="activeTab === tab.key
              ? (isDark ? 'text-white' : 'text-blue-700')
              : (isDark ? 'text-slate-500 hover:text-slate-300' : 'text-gray-500 hover:text-gray-700')">
            {{ tab.label }}
            <!-- Active underline -->
            <span v-if="activeTab === tab.key"
              class="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"></span>
            <!-- Count badge -->
            <span v-if="tab.key === 'saved' && assessmentStore.assessments.length"
              class="ml-1.5 inline-flex items-center justify-center min-w-4.5 h-4.5
                     rounded-full text-[10px] font-bold"
              :class="activeTab === tab.key
                ? 'bg-blue-600 text-white'
                : (isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-200 text-gray-600')">
              {{ assessmentStore.assessments.length }}
            </span>
          </button>
        </div>
      </div>

      <!-- ─────────────────────────────────────────────────────── -->
      <!-- TAB: CALCULATOR                                         -->
      <!-- ─────────────────────────────────────────────────────── -->
      <div v-if="activeTab === 'advisor'" class="space-y-8">

        <!-- Two-column: Inputs LEFT · Results RIGHT -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <!-- ── LEFT: Sliders ──────────────────────────────── -->
          <div class="rounded-2xl border p-7 space-y-7" :class="cardClass">
            <div>
              <p class="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-0.5">
                Bill Swap Calculator
              </p>
              <p class="text-xs" :class="isDark ? 'text-slate-500' : 'text-gray-400'">
                Drag the sliders — results update in real time
              </p>
            </div>

            <!-- Bill slider -->
            <div class="space-y-3">
              <div class="flex justify-between items-baseline">
                <span class="text-sm font-medium" :class="isDark ? 'text-slate-200' : 'text-gray-800'">
                  Monthly Electricity Bill
                </span>
                <span class="text-lg font-bold text-blue-600">{{ php(inputBill) }}<span class="text-xs font-normal">/mo</span></span>
              </div>
              <input type="range" min="1000" max="20000" step="500" v-model.number="inputBill"
                class="w-full h-2 rounded-full appearance-none cursor-pointer accent-blue-600"
                :class="isDark ? 'bg-slate-700' : 'bg-blue-100'" />
              <div class="flex justify-between text-xs" :class="isDark ? 'text-slate-600' : 'text-gray-400'">
                <span>₱1,000</span>
                <span class="text-amber-500 font-bold text-base md:text-lg tracking-tight drop-shadow-sm" style="letter-spacing:-0.01em;">
                  Recommended size: {{ recommendedKwp }} kWp
                </span>
                <span>₱20,000</span>
              </div>
            </div>

            <!-- System size & cost slider -->
            <div class="space-y-3">
              <div class="flex justify-between items-baseline">
                <span class="text-sm font-medium" :class="isDark ? 'text-slate-200' : 'text-gray-800'">
                  Solar System Size &amp; Cost
                </span>
                <div class="text-right">
                  <p class="text-lg font-bold text-blue-600">{{ systemSizeKW }} kWp</p>
                  <p class="text-xs font-semibold text-amber-600">{{ php(systemCost) }}</p>
                </div>
              </div>
              <input type="range" min="1" max="20" step="0.5" v-model.number="systemSizeKW"
                class="w-full h-2 rounded-full appearance-none cursor-pointer accent-blue-600"
                :class="isDark ? 'bg-slate-700' : 'bg-blue-100'" />
              <div class="flex justify-between text-xs" :class="isDark ? 'text-slate-600' : 'text-gray-400'">
                <span>1 kWp · {{ php(45000) }}</span>
                <span class="text-[10px]">@ ₱45,000/kWp</span>
                <span>20 kWp · {{ php(900000) }}</span>
              </div>
              <!-- Sizing insight banner -->
              <div class="rounded-lg px-3 py-2 text-xs flex items-start gap-2"
                :class="isDark ? 'bg-blue-950/40 text-blue-300 border border-blue-800/50' : 'bg-blue-50 text-blue-700 border border-blue-100'">
                <svg class="w-3.5 h-3.5 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd"/>
                </svg>
                <span>
                  Your ₱{{ inputBill.toLocaleString() }}/mo bill ≈
                  <strong>{{ Math.round(inputBill / PH_TARIFF) }} kWh/mo</strong>.
                  A {{ recommendedKwp }} kWp system covers ~100% at
                  {{ php(recommendedKwp * COST_PER_KWP) }}.
                </span>
              </div>
            </div>

            <!-- Loan / inflation controls -->
            <div class="grid grid-cols-3 gap-3 pt-5 border-t"
              :class="isDark ? 'border-slate-700' : 'border-gray-100'">
              <div>
                <label class="block text-xs mb-1.5 font-medium"
                  :class="isDark ? 'text-slate-400' : 'text-gray-600'">Inflation rate</label>
                <select v-model.number="inflationRate"
                  class="w-full text-xs rounded-lg border px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  :class="inputClass">
                  <option :value="3">3%</option>
                  <option :value="4.5">4.5%</option>
                  <option :value="6">6%</option>
                  <option :value="7.5">7.5%</option>
                </select>
              </div>
              <div>
                <label class="block text-xs mb-1.5 font-medium"
                  :class="isDark ? 'text-slate-400' : 'text-gray-600'">Down payment %</label>
                <input type="number" min="0" max="90" v-model.number="loanDownPaymentPct"
                  class="w-full text-xs rounded-lg border px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  :class="inputClass" />
              </div>
              <div>
                <label class="block text-xs mb-1.5 font-medium"
                  :class="isDark ? 'text-slate-400' : 'text-gray-600'">Loan term</label>
                <select v-model.number="loanTenureYears"
                  class="w-full text-xs rounded-lg border px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  :class="inputClass">
                  <option :value="3">3 yrs</option>
                  <option :value="5">5 yrs</option>
                  <option :value="7">7 yrs</option>
                  <option :value="10">10 yrs</option>
                </select>
              </div>
            </div>
          </div>

          <!-- ── RIGHT: Result metrics ──────────────────────── -->
          <div class="flex flex-col gap-4">

            <!-- Key metrics grid -->
            <div class="grid grid-cols-2 gap-4">
              <div class="rounded-2xl border p-5" :class="cardClass">
                <p class="text-xs font-medium mb-2" :class="isDark ? 'text-slate-500' : 'text-gray-400'">Monthly savings</p>
                <p class="text-2xl font-bold text-emerald-600">{{ php(estimatedMonthlySavings) }}</p>
                <div class="mt-2 flex items-center gap-1.5">
                  <div class="flex-1 h-1.5 rounded-full overflow-hidden"
                    :class="isDark ? 'bg-slate-700' : 'bg-gray-100'">
                    <div class="h-full rounded-full bg-emerald-500 transition-all"
                      :style="`width:${Math.min(100, Math.round((estimatedMonthlySavings / inputBill) * 100))}%`">
                    </div>
                  </div>
                  <span class="text-xs font-semibold text-emerald-600">
                    {{ Math.round((estimatedMonthlySavings / inputBill) * 100) }}%
                  </span>
                </div>
                <p class="text-[10px] mt-1" :class="isDark ? 'text-slate-600' : 'text-gray-400'">of current bill offset</p>
              </div>

              <div class="rounded-2xl border p-5" :class="cardClass">
                <p class="text-xs font-medium mb-2" :class="isDark ? 'text-slate-500' : 'text-gray-400'">System cost</p>
                <p class="text-2xl font-bold text-amber-600">{{ php(systemCost) }}</p>
                <p class="text-[10px] mt-1.5" :class="isDark ? 'text-slate-600' : 'text-gray-400'">
                  {{ systemSizeKW }} kWp × ₱45,000/kWp
                </p>
                <p class="text-xs mt-1 font-medium" :class="isDark ? 'text-slate-400' : 'text-gray-500'">
                  Down: {{ php(calculatedDownPayment) }}
                </p>
              </div>

              <div class="rounded-2xl border p-5" :class="cardClass">
                <p class="text-xs font-medium mb-2" :class="isDark ? 'text-slate-500' : 'text-gray-400'">Payback period</p>
                <p class="text-2xl font-bold text-blue-600">{{ computedPaybackYears }} <span class="text-sm font-medium">yrs</span></p>
                <p class="text-[10px] mt-1.5" :class="isDark ? 'text-slate-600' : 'text-gray-400'">Until free energy</p>
                <p class="text-xs mt-1 font-medium" :class="isDark ? 'text-slate-400' : 'text-gray-500'">
                  EMI: {{ php(calculatedEMI) }}/mo
                </p>
              </div>

              <div class="rounded-2xl border p-5" :class="cardClass">
                <p class="text-xs font-medium mb-2" :class="isDark ? 'text-slate-500' : 'text-gray-400'">10-year net profit</p>
                <p class="text-2xl font-bold"
                  :class="lifetimeProfit >= 0 ? 'text-emerald-600' : 'text-red-500'">
                  {{ php(lifetimeProfit) }}
                </p>
                <p class="text-[10px] mt-1.5" :class="isDark ? 'text-slate-600' : 'text-gray-400'">Est. decade gain incl. inflation</p>
                <p class="text-xs mt-1 font-medium"
                  :class="estimatedRoi >= 0 ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : 'text-red-500'">
                  {{ estimatedRoi }}% ROI over 10 yrs
                </p>
              </div>
            </div>

            <!-- Solar generation summary -->
            <div class="rounded-2xl border p-5" :class="cardClass">
              <p class="text-xs font-semibold uppercase tracking-widest mb-4 text-blue-600">Generation Breakdown</p>
              <div class="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p class="text-xs mb-1" :class="isDark ? 'text-slate-500' : 'text-gray-400'">Daily output</p>
                  <p class="text-base font-bold" :class="isDark ? 'text-slate-100' : 'text-gray-900'">
                    {{ (systemSizeKW * 4.5).toFixed(1) }} kWh
                  </p>
                </div>
                <div class="border-x" :class="isDark ? 'border-slate-700' : 'border-gray-200'">
                  <p class="text-xs mb-1" :class="isDark ? 'text-slate-500' : 'text-gray-400'">Monthly output</p>
                  <p class="text-base font-bold" :class="isDark ? 'text-slate-100' : 'text-gray-900'">
                    {{ Math.round(systemSizeKW * 4.5 * 30) }} kWh
                  </p>
                </div>
                <div>
                  <p class="text-xs mb-1" :class="isDark ? 'text-slate-500' : 'text-gray-400'">Annual output</p>
                  <p class="text-base font-bold" :class="isDark ? 'text-slate-100' : 'text-gray-900'">
                    {{ Math.round(systemSizeKW * 4.5 * 365 / 1000) }} MWh
                  </p>
                </div>
              </div>
              <div class="mt-4 pt-4 border-t text-xs" :class="isDark ? 'border-slate-700 text-slate-500' : 'border-gray-100 text-gray-400'">
                Based on 4.5 peak sun hrs/day · ₱{{ PH_TARIFF }}/kWh grid tariff · ₱45,000/kWp installed cost
              </div>
            </div>

            <button @click="saveCurrentSimulation" :disabled="assessmentStore.saving"
              class="w-full py-3 rounded-xl text-sm font-semibold transition border"
              :class="saveSuccess
                ? 'bg-emerald-600 border-emerald-600 text-white'
                : (isDark ? 'border-slate-600 text-slate-300 hover:bg-slate-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50')">
              {{ assessmentStore.saving ? 'Saving…' : saveSuccess ? '✓ Saved to Simulations' : 'Save This Simulation' }}
            </button>
          </div>
        </div>

        <!-- ROI Chart — 10-year, Y starts at 0, X in 6-month steps -->
        <div class="rounded-2xl border overflow-hidden" :class="cardClass">
          <div class="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b"
            :class="isDark ? 'border-slate-700' : 'border-gray-100'">
            <div>
              <p class="text-sm font-semibold" :class="isDark ? 'text-slate-200' : 'text-gray-900'">
                10-Year Cumulative Savings
              </p>
              <p class="text-xs mt-0.5" :class="isDark ? 'text-slate-500' : 'text-gray-400'">
                How your savings stack up month by month · gold line = break-even point
              </p>
            </div>
            <div class="flex items-center gap-2 flex-wrap">
              <span class="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                <span class="w-2 h-2 rounded-full bg-blue-600 inline-block"></span>{{ estimatedRoi }}% ROI
              </span>
              <span class="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                <span class="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>Break-even Yr {{ computedPaybackYears }}
              </span>
            </div>
          </div>
          <div class="px-6 pt-6 pb-4" :class="isDark ? 'bg-slate-900/40' : 'bg-white'">
            <!--
              Canvas: x 56→510 (454px), y 15→165 (150px)
              Y: 0 (bottom=165) → maxSavings (top=15)
              X: 0 → 10 years in 0.5-yr (6-month) steps = 20 intervals
            -->
            <svg viewBox="0 0 560 185" class="w-full" style="max-height:210px" preserveAspectRatio="xMidYMid meet">
              <defs>
                <linearGradient id="savGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stop-color="#0066CC" stop-opacity="0.20"/>
                  <stop offset="100%" stop-color="#0066CC" stop-opacity="0.02"/>
                </linearGradient>
              </defs>

              <!-- Y-axis labels (4 grid lines: 0, 33%, 66%, 100%) -->
              <g :fill="isDark ? '#475569' : '#94a3b8'" font-size="8.5" text-anchor="end">
                <text x="50" y="168">₱0</text>
                <text x="50" y="118">{{ yAxisThird }}</text>
                <text x="50" y="68">{{ yAxisTwoThird }}</text>
                <text x="50" y="18">{{ yAxisMax }}</text>
              </g>
              <!-- Grid lines -->
              <line x1="56" y1="165" x2="510" y2="165" :stroke="isDark ? '#334155' : '#e2e8f0'" stroke-width="1"/>
              <line x1="56" y1="115" x2="510" y2="115" :stroke="isDark ? '#1e293b' : '#f1f5f9'" stroke-dasharray="4,4" stroke-width="1"/>
              <line x1="56" y1="65"  x2="510" y2="65"  :stroke="isDark ? '#1e293b' : '#f1f5f9'" stroke-dasharray="4,4" stroke-width="1"/>
              <line x1="56" y1="15"  x2="510" y2="15"  :stroke="isDark ? '#1e293b' : '#f1f5f9'" stroke-dasharray="4,4" stroke-width="1"/>
              <!-- Y axis -->
              <line x1="56" y1="10" x2="56" y2="168" :stroke="isDark ? '#334155' : '#e2e8f0'" stroke-width="1"/>

              <!-- System cost reference line (horizontal, dashed amber) -->
              <line x1="56" :y1="costLineY" x2="510" :y2="costLineY"
                stroke="#FFB81C" stroke-width="1" stroke-dasharray="6,4" opacity="0.7"/>
              <text x="513" :y="costLineY + 4" fill="#FFB81C" font-size="7.5" font-weight="600">Cost</text>

              <!-- Filled area under savings line -->
              <path :d="savingsPathFill" fill="url(#savGrad)"/>
              <!-- Savings line -->
              <path :d="savingsPath" fill="none" stroke="#0066CC" stroke-width="2.5"
                stroke-linecap="round" stroke-linejoin="round"/>

              <!-- Break-even circle where savings crosses cost -->
              <circle v-if="computedPaybackYears <= 10"
                :cx="savBreakEvenX" :cy="costLineY" r="5"
                fill="#FFB81C" stroke="#0f172a" stroke-width="2"/>
              <text v-if="computedPaybackYears <= 10"
                :x="Math.min(savBreakEvenX + 7, 490)" :y="costLineY - 7"
                fill="#FFB81C" font-size="9" font-weight="700">Yr {{ computedPaybackYears }}</text>

              <!-- X-axis ticks every 6 months (0.5 yr intervals) -->
              <g :fill="isDark ? '#475569' : '#94a3b8'" font-size="8">
                <text v-for="i in 21" :key="i-1"
                  :x="56 + ((i-1)/20)*454"
                  y="178"
                  text-anchor="middle">
                  {{ (i-1) % 2 === 0 ? ((i-1)/2) + 'y' : '' }}
                </text>
              </g>
              <!-- 6-month tick marks -->
              <g :stroke="isDark ? '#334155' : '#e2e8f0'" stroke-width="1">
                <line v-for="i in 21" :key="i-1"
                  :x1="56 + ((i-1)/20)*454" y1="165"
                  :x2="56 + ((i-1)/20)*454" :y2="(i-1) % 2 === 0 ? 170 : 167"/>
              </g>
            </svg>
          </div>
        </div>

        <!-- Financing options -->
        <div class="rounded-2xl border overflow-hidden" :class="cardClass">
          <div class="px-6 py-5 border-b flex flex-col gap-3 md:flex-row md:items-end md:justify-between"
            :class="isDark ? 'border-slate-700' : 'border-gray-100'">
            <div>
              <p class="text-sm font-semibold" :class="isDark ? 'text-slate-200' : 'text-gray-900'">
                Choose Your Financing
              </p>
              <p class="text-xs mt-0.5" :class="isDark ? 'text-slate-500' : 'text-gray-400'">
                Compare only what changes your monthly cash flow.
              </p>
            </div>
            <div class="text-xs font-semibold px-3 py-2 rounded-lg"
              :class="isDark ? 'bg-slate-900 text-slate-300' : 'bg-blue-50 text-blue-700'">
              Current bill {{ php(inputBill) }}/mo
            </div>
          </div>

          <div class="p-5 space-y-5">
            <div class="overflow-x-auto">
              <div class="grid gap-3 items-stretch min-w-[860px]" style="grid-template-columns: repeat(3, minmax(0, 1fr));">
                <button v-for="opt in financingOptions" :key="opt.key"
                  type="button"
                  :aria-pressed="selectedFinancing === opt.key"
                  @click="selectFinancingOption(opt.key)"
                  class="h-full text-left rounded-xl border p-4 transition focus:outline-none focus:ring-2 focus:ring-blue-500/30 flex flex-col"
                  :class="selectedFinancing === opt.key
                    ? (isDark ? 'bg-blue-950/40 border-blue-600 shadow-lg shadow-blue-950/20' : 'bg-blue-50 border-blue-300 shadow-sm')
                    : (isDark ? 'bg-slate-900/40 border-slate-700 hover:border-slate-500' : 'bg-white border-gray-200 hover:border-blue-200 hover:bg-blue-50/40')">
                  <div class="min-h-12 flex items-start justify-between gap-3">
                    <div>
                      <p class="text-sm font-bold" :class="selectedFinancing === opt.key ? 'text-blue-600' : (isDark ? 'text-slate-100' : 'text-gray-900')">
                        {{ opt.name }}
                      </p>
                      <p class="text-[11px] mt-1" :class="isDark ? 'text-slate-500' : 'text-gray-400'">{{ opt.badge }}</p>
                    </div>
                    <span class="w-5 h-5 rounded-full border flex items-center justify-center text-[11px] font-bold"
                      :class="selectedFinancing === opt.key
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : (isDark ? 'border-slate-600 text-slate-600' : 'border-gray-300 text-gray-300')">
                      {{ selectedFinancing === opt.key ? '✓' : '' }}
                    </span>
                  </div>
                  <p class="mt-3 text-xs leading-relaxed flex-1" :class="isDark ? 'text-slate-400' : 'text-gray-500'">
                    {{ opt.desc }}
                  </p>
                  <div class="mt-4 grid grid-cols-2 gap-3 pt-4 border-t"
                    :class="isDark ? 'border-slate-700/70' : 'border-gray-100'">
                    <div>
                      <p class="text-[10px] uppercase tracking-wide" :class="isDark ? 'text-slate-500' : 'text-gray-400'">{{ opt.line1Label }}</p>
                      <p class="text-sm font-bold" :class="isDark ? 'text-slate-100' : 'text-gray-900'">{{ opt.line1Value }}</p>
                    </div>
                    <div>
                      <p class="text-[10px] uppercase tracking-wide" :class="isDark ? 'text-slate-500' : 'text-gray-400'">{{ opt.line2Label }}</p>
                      <p class="text-sm font-bold" :class="opt.line2Color">{{ opt.line2Value }}</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div class="rounded-xl border p-4"
              :class="isDark ? 'border-blue-800/50 bg-blue-950/20' : 'border-blue-100 bg-blue-50'">
              <div class="grid grid-cols-1 lg:grid-cols-[1.1fr_2fr] gap-4 lg:items-center">
                <div>
                  <p class="text-xs font-semibold uppercase tracking-widest text-blue-600">Selected plan</p>
                  <h3 class="mt-1 text-xl font-bold" :class="isDark ? 'text-slate-100' : 'text-gray-900'">
                    {{ selectedFinancingOption.name }}
                  </h3>
                  <p class="mt-1 text-xs leading-relaxed" :class="isDark ? 'text-slate-400' : 'text-gray-600'">
                    {{ selectedFinancingOption.desc }}
                  </p>
                </div>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div v-for="item in selectedPlanDetails" :key="item.label"
                    class="rounded-lg p-3 min-h-20"
                    :class="isDark ? 'bg-slate-900/60' : 'bg-white'">
                    <p class="text-[10px] uppercase tracking-wide" :class="isDark ? 'text-slate-500' : 'text-gray-400'">{{ item.label }}</p>
                    <p class="mt-1 text-base font-bold leading-tight" :class="item.color || (isDark ? 'text-slate-100' : 'text-gray-900')">
                      {{ item.value }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div class="overflow-x-auto rounded-xl border"
              :class="isDark ? 'border-slate-700 bg-slate-900/40' : 'border-gray-200 bg-white'">
              <table class="w-full min-w-[780px] table-fixed text-sm">
                <colgroup>
                  <col style="width: 30%" />
                  <col style="width: 23.333%" />
                  <col style="width: 23.333%" />
                  <col style="width: 23.333%" />
                </colgroup>
                <thead>
                  <tr :class="isDark ? 'bg-slate-800/70 text-slate-400' : 'bg-gray-50 text-gray-500'">
                    <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Decision point</th>
                    <th v-for="opt in financingOptions" :key="opt.key"
                      class="px-3 py-3 text-center text-xs font-semibold align-middle"
                      :class="selectedFinancing === opt.key ? 'text-blue-600' : ''">
                      <span class="block leading-tight">{{ opt.name }}</span>
                    </th>
                  </tr>
                </thead>
                <tbody :class="isDark ? 'divide-y divide-slate-700/70' : 'divide-y divide-gray-100'">
                  <tr v-for="row in comparisonRows" :key="row.label">
                    <td class="px-4 py-3 text-xs font-medium align-middle"
                      :class="isDark ? 'text-slate-400' : 'text-gray-500'">{{ row.label }}</td>
                    <td v-for="opt in financingOptions" :key="opt.key"
                      class="px-3 py-3 text-center font-semibold align-middle"
                      :class="[
                        selectedFinancing === opt.key
                          ? (isDark ? 'bg-blue-950/30 text-blue-300' : 'bg-blue-50 text-blue-700')
                          : (isDark ? 'text-slate-200' : 'text-gray-800'),
                        row.highlight?.[opt.key] || ''
                      ]">
                      <span class="block leading-tight">{{ row.values[opt.key] }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p class="text-xs" :class="isDark ? 'text-slate-500' : 'text-gray-400'">
                You can adjust the sliders above and these terms update immediately.
              </p>
              <router-link to="/messaging?financierId=f1"
                class="inline-flex items-center justify-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition">
                Talk to a Financing Advisor
              </router-link>
            </div>
          </div>
        </div>

        <!-- Prequalifier -->
        <div class="rounded-xl border p-6" :class="cardClass">
          <p class="text-xs font-semibold uppercase tracking-widest mb-5 text-blue-600">
            Instant Prequalification
          </p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div class="space-y-5">
              <div>
                <p class="text-xs mb-2"
                  :class="isDark ? 'text-slate-400' : 'text-gray-600'">Property ownership</p>
                <div class="flex gap-2">
                  <button type="button" @click="propertyOwned = true"
                    class="flex-1 py-2 rounded-lg text-xs font-medium border transition"
                    :class="propertyOwned
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : (isDark ? 'border-slate-600 text-slate-400 hover:border-slate-500' : 'border-gray-200 text-gray-600 hover:border-gray-300')">
                    Own property
                  </button>
                  <button type="button" @click="propertyOwned = false"
                    class="flex-1 py-2 rounded-lg text-xs font-medium border transition"
                    :class="!propertyOwned
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : (isDark ? 'border-slate-600 text-slate-400 hover:border-slate-500' : 'border-gray-200 text-gray-600 hover:border-gray-300')">
                    Renting
                  </button>
                </div>
              </div>
              <div>
                <div class="flex justify-between text-xs mb-2">
                  <span :class="isDark ? 'text-slate-400' : 'text-gray-600'">Credit grade</span>
                  <span class="font-semibold text-blue-600">{{ creditScore }} · {{ creditScoreRange }}</span>
                </div>
                <input type="range" min="550" max="850" step="10" v-model.number="creditScore"
                  class="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-blue-600"
                  :class="isDark ? 'bg-slate-700' : 'bg-blue-100'" />
                <div class="mt-2 flex justify-between text-[10px] font-semibold"
                  :class="isDark ? 'text-slate-600' : 'text-gray-400'">
                  <span>550</span>
                  <span>650</span>
                  <span>700</span>
                  <span>780</span>
                  <span>850</span>
                </div>
                <div class="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div v-for="step in creditGradeSteps" :key="step.label"
                    class="rounded-lg border px-2.5 py-2"
                    :class="isCreditStepActive(step)
                      ? (isDark ? 'border-blue-600 bg-blue-950/40 text-blue-300' : 'border-blue-200 bg-blue-50 text-blue-700')
                      : (isDark ? 'border-slate-700 bg-slate-900/40 text-slate-500' : 'border-gray-200 bg-white text-gray-500')">
                    <p class="text-[11px] font-bold leading-tight">{{ step.label }}</p>
                    <p class="mt-0.5 text-[10px] opacity-75">{{ step.range }}</p>
                  </div>
                </div>
              </div>
              <div>
                <label class="block text-xs mb-2"
                  :class="isDark ? 'text-slate-400' : 'text-gray-600'">Annual household income</label>
                <input type="text" placeholder="₱1,200,000" v-model="annualIncome"
                  class="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  :class="inputClass" />
              </div>
            </div>
            <div class="flex flex-col gap-3">
              <div class="flex-1 rounded-xl border p-4" :class="prequalRating.colorClass">
                <div class="flex items-center justify-between mb-2.5">
                  <span class="text-xs font-semibold uppercase tracking-wide">Approval status</span>
                  <span class="text-lg">{{ prequalRating.icon }}</span>
                </div>
                <p class="font-bold text-sm mb-1.5">{{ prequalRating.status }}</p>
                <p class="text-xs leading-relaxed opacity-75">{{ prequalRating.desc }}</p>
              </div>
              <router-link to="/messaging?financierId=f1"
                class="flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium border transition"
                :class="isDark
                  ? 'border-slate-600 text-slate-300 hover:bg-slate-800'
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50'">
                Message Financing Advisor
              </router-link>
            </div>
          </div>
        </div>
      </div>

      <!-- ─────────────────────────────────────────────────────── -->
      <!-- TAB: LEDGER                                              -->
      <!-- ─────────────────────────────────────────────────────── -->
      <div v-else-if="activeTab === 'ledger'" class="space-y-5">

        <!-- Summary row -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div v-for="stat in ledgerStats" :key="stat.label"
            class="rounded-xl border p-4" :class="cardClass">
            <p class="text-xs mb-1.5" :class="isDark ? 'text-slate-500' : 'text-gray-400'">
              {{ stat.label }}
            </p>
            <p class="text-xl font-bold" :class="stat.color">{{ stat.value }}</p>
          </div>
        </div>

        <!-- Add transaction form -->
        <div v-if="showAddForm" class="rounded-xl border p-6" :class="cardClass">
          <div class="flex items-center justify-between mb-5">
            <p class="text-sm font-semibold"
              :class="isDark ? 'text-slate-200' : 'text-gray-900'">Record Transaction</p>
            <button @click="showAddForm = false" class="text-xl leading-none opacity-40 hover:opacity-70 transition"
              :class="isDark ? 'text-slate-200' : 'text-gray-900'">&times;</button>
          </div>
          <form @submit.prevent="handleCreateTransaction"
            class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs mb-1.5"
                :class="isDark ? 'text-slate-400' : 'text-gray-500'">Type</label>
              <select v-model="form.type" required
                class="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                :class="inputClass">
                <option value="">Select…</option>
                <option value="income">Income / Savings</option>
                <option value="expense">Expense</option>
                <option value="credit">Tax Credit</option>
                <option value="payment">Loan Payment</option>
              </select>
            </div>
            <div>
              <label class="block text-xs mb-1.5"
                :class="isDark ? 'text-slate-400' : 'text-gray-500'">Category</label>
              <select v-model="form.category" required
                class="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                :class="inputClass">
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
              <label class="block text-xs mb-1.5"
                :class="isDark ? 'text-slate-400' : 'text-gray-500'">Amount (₱)</label>
              <input v-model.number="form.amount" type="number" step="0.01"
                placeholder="0.00" required
                class="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                :class="inputClass" />
            </div>
            <div>
              <label class="block text-xs mb-1.5"
                :class="isDark ? 'text-slate-400' : 'text-gray-500'">Date</label>
              <input v-model="form.transactionDate" type="date" required
                class="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                :class="inputClass" />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-xs mb-1.5"
                :class="isDark ? 'text-slate-400' : 'text-gray-500'">Description</label>
              <input v-model="form.description" type="text"
                placeholder="e.g. Monthly electricity savings"
                class="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                :class="inputClass" />
            </div>
            <div class="sm:col-span-2 flex flex-wrap gap-3 items-center">
              <button type="submit" :disabled="financeStore.loading"
                class="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg
                       text-sm font-medium transition disabled:opacity-50">
                {{ financeStore.loading ? 'Saving…' : 'Save' }}
              </button>
              <button type="button" @click="showAddForm = false"
                class="px-5 py-2 rounded-lg text-sm font-medium border transition"
                :class="isDark
                  ? 'border-slate-600 text-slate-300 hover:bg-slate-800'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'">
                Cancel
              </button>
              <p v-if="createSuccess"
                class="text-emerald-600 text-xs font-medium">✓ Transaction saved</p>
              <p v-if="financeStore.error"
                class="text-red-500 text-xs">{{ financeStore.error }}</p>
            </div>
          </form>
        </div>

        <!-- Transactions table card -->
        <div class="rounded-xl border overflow-hidden" :class="cardClass">
          <div class="flex items-center justify-between px-6 py-4 border-b"
            :class="isDark ? 'border-slate-700' : 'border-gray-100'">
            <div>
              <p class="text-sm font-semibold"
                :class="isDark ? 'text-slate-200' : 'text-gray-900'">Transaction History</p>
              <p class="text-xs mt-0.5"
                :class="isAdmin
                  ? 'text-blue-600'
                  : (isDark ? 'text-slate-500' : 'text-gray-400')">
                {{ isAdmin ? 'All users · Platform-wide' : 'Your records only' }}
              </p>
            </div>
            <div class="flex gap-2">
              <button @click="showAddForm = !showAddForm"
                class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white
                       rounded-lg text-xs font-medium transition">
                + Add
              </button>
              <button @click="loadData"
                class="px-3 py-1.5 rounded-lg text-xs font-medium border transition"
                :class="isDark
                  ? 'border-slate-600 text-slate-400 hover:bg-slate-800'
                  : 'border-gray-200 text-gray-500 hover:bg-gray-50'">
                Refresh
              </button>
            </div>
          </div>

          <!-- Loading -->
          <div v-if="financeStore.loading && !financeStore.transactions.length"
            class="flex items-center justify-center gap-2 py-16"
            :class="isDark ? 'text-slate-500' : 'text-gray-400'">
            <div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            <span class="text-sm">Loading transactions…</span>
          </div>

          <!-- Empty -->
          <div v-else-if="!financeStore.transactions.length" class="text-center py-16">
            <p class="text-sm font-medium mb-1"
              :class="isDark ? 'text-slate-300' : 'text-gray-700'">No transactions yet</p>
            <p class="text-xs"
              :class="isDark ? 'text-slate-500' : 'text-gray-400'">
              Add your first solar-related transaction above
            </p>
          </div>

          <!-- Table -->
          <div v-else class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="text-xs font-semibold uppercase tracking-wide border-b"
                  :class="isDark
                    ? 'text-slate-500 border-slate-700 bg-slate-900/30'
                    : 'text-gray-400 border-gray-100 bg-gray-50/80'">
                  <th class="px-6 py-3 text-left font-semibold">Date</th>
                  <th class="px-6 py-3 text-left font-semibold">Type</th>
                  <th class="px-6 py-3 text-left font-semibold">Category</th>
                  <th class="px-6 py-3 text-left font-semibold hidden md:table-cell">Note</th>
                  <th class="px-6 py-3 text-right font-semibold">Amount</th>
                  <th class="px-6 py-3 text-left font-semibold">Status</th>
                </tr>
              </thead>
              <tbody :class="isDark ? 'divide-y divide-slate-700/50' : 'divide-y divide-gray-100'">
                <tr v-for="txn in financeStore.transactions" :key="txn.id"
                  class="text-sm transition"
                  :class="isDark ? 'hover:bg-slate-800/50' : 'hover:bg-blue-50/30'">
                  <td class="px-6 py-4 text-xs whitespace-nowrap"
                    :class="isDark ? 'text-slate-300' : 'text-gray-700'">
                    {{ formatDate(txn.transaction_date) }}
                  </td>
                  <td class="px-6 py-4">
                    <span class="px-2 py-0.5 rounded-full text-xs font-medium capitalize"
                      :class="typeBadgeClass(txn.type)">
                      {{ txn.type }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-xs capitalize"
                    :class="isDark ? 'text-slate-400' : 'text-gray-600'">
                    {{ (txn.category || '').replace(/_/g, ' ') }}
                  </td>
                  <td class="px-6 py-4 text-xs max-w-45 truncate hidden md:table-cell"
                    :class="isDark ? 'text-slate-500' : 'text-gray-400'">
                    {{ txn.description || '—' }}
                  </td>
                  <td class="px-6 py-4 text-right text-sm font-semibold"
                    :class="isPositive(txn.type) ? 'text-emerald-600' : 'text-red-500'">
                    {{ isPositive(txn.type) ? '+' : '−' }}{{ php(txn.amount || 0) }}
                  </td>
                  <td class="px-6 py-4">
                    <span class="text-xs font-medium capitalize"
                      :class="txn.status === 'completed' ? 'text-emerald-600' : 'text-amber-500'">
                      {{ txn.status || 'pending' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ─────────────────────────────────────────────────────── -->
      <!-- TAB: SAVED SIMULATIONS — collapsible accordion         -->
      <!-- ─────────────────────────────────────────────────────── -->
      <div v-else-if="activeTab === 'saved'" class="space-y-4">
        <div class="flex items-start justify-between mb-2">
          <div>
            <p class="text-sm font-semibold" :class="isDark ? 'text-slate-200' : 'text-gray-900'">
              Saved Simulations
            </p>
            <p class="text-xs mt-0.5" :class="isDark ? 'text-slate-500' : 'text-gray-400'">
              Expand any row to see details · click Load to restore it in the Calculator
            </p>
          </div>
          <button @click="assessmentStore.fetchAssessments()"
            class="text-xs font-medium px-3 py-1.5 rounded-lg border transition"
            :class="isDark ? 'border-slate-600 text-slate-400 hover:bg-slate-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50'">
            Refresh
          </button>
        </div>

        <div v-if="assessmentStore.loading"
          class="flex items-center justify-center gap-2 py-20"
          :class="isDark ? 'text-slate-500' : 'text-gray-400'">
          <div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          <span class="text-sm">Loading…</span>
        </div>

        <div v-else-if="!assessmentStore.assessments.length"
          class="rounded-2xl border p-12 text-center"
          :class="isDark ? 'border-slate-800' : 'border-gray-100'">
          <p class="text-sm font-medium mb-1" :class="isDark ? 'text-slate-300' : 'text-gray-700'">No simulations saved yet</p>
          <p class="text-xs mb-5" :class="isDark ? 'text-slate-500' : 'text-gray-400'">
            Go to the Calculator tab and click Save This Simulation
          </p>
          <button @click="activeTab = 'advisor'"
            class="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition">
            Open Calculator
          </button>
        </div>

        <!-- Accordion list -->
        <div v-else class="space-y-3">
          <div v-for="item in assessmentStore.assessments" :key="item.id"
            class="rounded-2xl border overflow-hidden transition-all"
            :class="isDark ? 'bg-slate-800/70 border-slate-700' : 'bg-white border-gray-200 shadow-sm'">

            <!-- Collapsed header — always visible -->
            <button
              class="w-full flex items-center gap-4 px-5 py-4 text-left transition"
              :class="isDark ? 'hover:bg-slate-700/40' : 'hover:bg-blue-50/40'"
              @click="toggleAccordion(item.id)">
              <!-- chevron -->
              <svg class="w-4 h-4 shrink-0 transition-transform"
                :class="[expandedSimId === item.id ? 'rotate-90' : '', isDark ? 'text-slate-500' : 'text-gray-400']"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
              </svg>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold truncate"
                  :class="isDark ? 'text-slate-100' : 'text-gray-900'">
                  {{ item.savings_estimate?.description || `${item.recommended_capacity} kWp Solar System` }}
                </p>
                <p class="text-xs mt-0.5" :class="isDark ? 'text-slate-500' : 'text-gray-400'">
                  {{ formatDate(item.created_at) }}
                </p>
              </div>
              <div class="hidden sm:flex items-center gap-5 text-right shrink-0">
                <div>
                  <p class="text-[10px] uppercase tracking-wide" :class="isDark ? 'text-slate-500' : 'text-gray-400'">Size</p>
                  <p class="text-sm font-semibold text-blue-600">{{ item.recommended_capacity || '—' }} kWp</p>
                </div>
                <div>
                  <p class="text-[10px] uppercase tracking-wide" :class="isDark ? 'text-slate-500' : 'text-gray-400'">Monthly saving</p>
                  <p class="text-sm font-semibold text-emerald-600">{{ php(item.savings_estimate?.monthlySavings || 0) }}/mo</p>
                </div>
                <div>
                  <p class="text-[10px] uppercase tracking-wide" :class="isDark ? 'text-slate-500' : 'text-gray-400'">Payback</p>
                  <p class="text-sm font-semibold" :class="isDark ? 'text-slate-200' : 'text-gray-800'">
                    {{ item.savings_estimate?.paybackYears || '—' }} yrs
                  </p>
                </div>
              </div>
            </button>

            <!-- Expanded detail — shown when open -->
            <div v-if="expandedSimId === item.id"
              class="border-t px-5 pt-4 pb-5 space-y-4"
              :class="isDark ? 'border-slate-700' : 'border-gray-100'">
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div class="rounded-xl p-3" :class="isDark ? 'bg-slate-900' : 'bg-gray-50'">
                  <p class="text-[10px] uppercase tracking-wide mb-1" :class="isDark ? 'text-slate-500' : 'text-gray-400'">System size</p>
                  <p class="text-sm font-bold" :class="isDark ? 'text-slate-100' : 'text-gray-900'">
                    {{ item.recommended_capacity || '—' }} kWp
                  </p>
                </div>
                <div class="rounded-xl p-3" :class="isDark ? 'bg-slate-900' : 'bg-gray-50'">
                  <p class="text-[10px] uppercase tracking-wide mb-1" :class="isDark ? 'text-slate-500' : 'text-gray-400'">Estimated cost</p>
                  <p class="text-sm font-bold text-amber-600">{{ php(item.estimated_cost || (item.recommended_capacity * 45000)) }}</p>
                </div>
                <div class="rounded-xl p-3" :class="isDark ? 'bg-slate-900' : 'bg-gray-50'">
                  <p class="text-[10px] uppercase tracking-wide mb-1" :class="isDark ? 'text-slate-500' : 'text-gray-400'">Monthly savings</p>
                  <p class="text-sm font-bold text-emerald-600">{{ php(item.savings_estimate?.monthlySavings || 0) }}/mo</p>
                </div>
                <div class="rounded-xl p-3" :class="isDark ? 'bg-slate-900' : 'bg-gray-50'">
                  <p class="text-[10px] uppercase tracking-wide mb-1" :class="isDark ? 'text-slate-500' : 'text-gray-400'">ROI</p>
                  <p class="text-sm font-bold text-blue-600">{{ item.savings_estimate?.roi || '—' }}%</p>
                </div>
                <div class="rounded-xl p-3" :class="isDark ? 'bg-slate-900' : 'bg-gray-50'">
                  <p class="text-[10px] uppercase tracking-wide mb-1" :class="isDark ? 'text-slate-500' : 'text-gray-400'">Payback period</p>
                  <p class="text-sm font-bold text-blue-600">{{ item.savings_estimate?.paybackYears || '—' }} yrs</p>
                </div>
                <div class="rounded-xl p-3" :class="isDark ? 'bg-slate-900' : 'bg-gray-50'">
                  <p class="text-[10px] uppercase tracking-wide mb-1" :class="isDark ? 'text-slate-500' : 'text-gray-400'">Financing</p>
                  <p class="text-sm font-bold capitalize" :class="isDark ? 'text-slate-200' : 'text-gray-800'">
                    {{ item.savings_estimate?.financingOption || 'Loan' }}
                  </p>
                </div>
                <div class="rounded-xl p-3" :class="isDark ? 'bg-slate-900' : 'bg-gray-50'">
                  <p class="text-[10px] uppercase tracking-wide mb-1" :class="isDark ? 'text-slate-500' : 'text-gray-400'">Roof area</p>
                  <p class="text-sm font-bold" :class="isDark ? 'text-slate-200' : 'text-gray-800'">
                    {{ item.roof_area ? `${item.roof_area} m²` : '—' }}
                  </p>
                </div>
                <div class="rounded-xl p-3" :class="isDark ? 'bg-slate-900' : 'bg-gray-50'">
                  <p class="text-[10px] uppercase tracking-wide mb-1" :class="isDark ? 'text-slate-500' : 'text-gray-400'">10-yr net profit</p>
                  <p class="text-sm font-bold text-emerald-600">{{ php(item.savings_estimate?.decadeProfit || 0) }}</p>
                </div>
              </div>
              <div class="flex gap-3 pt-1">
                <button @click="loadSavedSimulation(item); activeTab = 'advisor'"
                  class="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition">
                  Load into Calculator
                </button>
                <button
                  class="px-5 py-2.5 rounded-xl text-sm font-medium border transition"
                  :class="isDark ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'"
                  @click="expandedSimId = null">
                  Collapse
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

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

const financeStore     = useFinanceStore()
const assessmentStore  = useFinancingAssessmentStore()
const themeStore       = useThemeStore()
const userStore        = useUserStore()

const showAddForm    = ref(false)
const createSuccess  = ref(false)
const saveSuccess    = ref(false)
const activeTab      = ref('advisor')
const expandedSimId  = ref(null)

function toggleAccordion(id) {
  expandedSimId.value = expandedSimId.value === id ? null : id
}

// ── Theme ────────────────────────────────────────────────────────
const isDark = computed(() => themeStore.isDarkMode)

// ── Role / persona helpers ────────────────────────────────────────
// admin / superadmin  → full platform view, consent bypassed
// dealer / installer  → contractor persona, blocked
// customer / operations → earner persona, own data + consent required
const isAdmin  = computed(() => ['admin', 'superadmin'].includes(userStore.userRole))
const isDealer = computed(() => ['dealer', 'installer'].includes(userStore.userRole))

// ── Tab visibility (all non-dealer roles that pass the gate see all tabs) ──
const visibleTabs = [
  { key: 'advisor', label: 'Calculator' },
  { key: 'ledger',  label: 'Ledger'     },
  { key: 'saved',   label: 'Saved'      }
]

// ── Consent gate ──────────────────────────────────────────────────
// Admin bypasses consent entirely.
// All other eligible roles must explicitly grant finance_data consent.
const consentLoading  = ref(false)
const grantingConsent = ref(false)
const consentError    = ref(null)

const hasFinanceConsent = computed(() =>
  isAdmin.value || userStore.hasConsent('finance_data')
)

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

// ── Calculator state ──────────────────────────────────────────────
const inputBill          = ref(5000)
const systemSizeKW       = ref(5)
const inflationRate      = ref(4.5)
const loanDownPaymentPct = ref(20)
const loanTenureYears    = ref(5)
const propertyOwned      = ref(true)
const creditScore        = ref(720)
const annualIncome       = ref('₱1,500,000')

// ── Helpers ───────────────────────────────────────────────────────
function php(amount) {
  return formatCurrency(Number(amount || 0), { fromUSD: false, currency: 'PHP', decimals: 0 })
}

// ── Computed financials ───────────────────────────────────────────
// Apolaki standard pricing constants (aligned with Assessment module)
const COST_PER_KWP  = 45000   // ₱/kWp installed (panels + inverter + install)
const PH_TARIFF     = 12      // ₱/kWh average Meralco/distribution tariff
const PEAK_SUN_HRS  = 4.5     // PH avg peak sun hours per day

// System cost — ₱45,000 per kWp
const systemCost = computed(() => (systemSizeKW.value || 5) * COST_PER_KWP)

// Recommended system size from the user's bill
// Formula: monthly kWh = bill ÷ tariff ; kWp needed = monthly kWh ÷ (peak_hrs × 30 days)
const recommendedKwp = computed(() => {
  const monthlyKwh = (inputBill.value || 5000) / PH_TARIFF
  return parseFloat((monthlyKwh / (PEAK_SUN_HRS * 30)).toFixed(1))
})

// Monthly solar generation (kWh) for the chosen system size
const monthlyGenKwh = computed(() => systemSizeKW.value * PEAK_SUN_HRS * 30)

// Monthly savings = min(solar gen × tariff, 85% of bill)
// 85% cap: some grid draw remains for night/cloudy days
const estimatedMonthlySavings = computed(() => {
  const solarValue = monthlyGenKwh.value * PH_TARIFF
  return Math.min(solarValue, (inputBill.value || 5000) * 0.85)
})

const estimatedRoi = computed(() =>
  systemCost.value ? Math.round((lifetimeProfit.value / systemCost.value) * 100) : 0
)

const calculatedDownPayment = computed(() =>
  (systemCost.value * (loanDownPaymentPct.value || 20)) / 100
)

const calculatedEMI = computed(() => {
  const principal = systemCost.value - calculatedDownPayment.value
  const mRate     = 0.0625 / 12
  const months    = (loanTenureYears.value || 5) * 12
  if (principal <= 0) return 0
  const factor = Math.pow(1 + mRate, months)
  return (principal * mRate * factor) / (factor - 1)
})

const computedPaybackYears = computed(() => {
  const ann = estimatedMonthlySavings.value * 12
  return ann ? parseFloat((systemCost.value / ann).toFixed(1)) : 0
})

// 10-year cumulative net savings with inflation
const lifetimeProfit = computed(() => {
  const ann = estimatedMonthlySavings.value * 12
  let total = 0, m = 1
  for (let y = 1; y <= 10; y++) {
    total += ann * m
    m *= 1 + (inflationRate.value || 4.5) / 100
  }
  return total - systemCost.value
})

// ── ROI chart — cumulative savings from 0, X in 6-month steps ────
// 20 half-year intervals = 10 years
// Y: 0 (bottom y=165) → maxCumSavings (top y=15), 150px range
// X: 56 → 510, 454px for 10 years (20 × 0.5yr steps)

const chartPointsSavings = computed(() => {
  const annSavings = estimatedMonthlySavings.value * 12
  const infl = (inflationRate.value || 4.5) / 100
  const pts = []
  // 20 half-year steps: i = 0..20 → time = 0..10 years
  for (let i = 0; i <= 20; i++) {
    const t = i / 2  // years elapsed
    let cumSav = 0
    for (let y = 1; y <= Math.floor(t); y++) {
      cumSav += annSavings * Math.pow(1 + infl, y - 1)
    }
    // partial year
    const frac = t - Math.floor(t)
    if (frac > 0) {
      cumSav += annSavings * Math.pow(1 + infl, Math.floor(t)) * frac
    }
    pts.push({ x: 56 + (i / 20) * 454, cumSav })
  }
  return pts
})

const maxCumSavings = computed(() => {
  const vals = chartPointsSavings.value.map(p => p.cumSav)
  return Math.max(...vals, systemCost.value, 1)
})

// Map cumulative savings value → SVG y (165=bottom/0, 15=top/max)
function savToY(v) {
  return 165 - (v / maxCumSavings.value) * 150
}

const savingsPath = computed(() =>
  chartPointsSavings.value
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${savToY(p.cumSav).toFixed(1)}`)
    .join(' ')
)

const savingsPathFill = computed(() => {
  const last = chartPointsSavings.value[chartPointsSavings.value.length - 1]
  return `${savingsPath.value} L ${last.x.toFixed(1)},165 L 56,165 Z`
})

// Where savings line crosses the system cost line
const savBreakEvenX = computed(() => {
  return 56 + Math.min(1, computedPaybackYears.value / 10) * 454
})

// Y-axis label helpers (0-based)
const yAxisMax = computed(() => {
  const v = maxCumSavings.value
  return v >= 1000000 ? `₱${(v / 1000000).toFixed(1)}M` : `₱${Math.round(v / 1000)}K`
})
const yAxisTwoThird = computed(() => {
  const v = maxCumSavings.value * 0.667
  return v >= 1000000 ? `₱${(v / 1000000).toFixed(1)}M` : `₱${Math.round(v / 1000)}K`
})
const yAxisThird = computed(() => {
  const v = maxCumSavings.value * 0.333
  return v >= 1000000 ? `₱${(v / 1000000).toFixed(1)}M` : `₱${Math.round(v / 1000)}K`
})

// Y position of system cost horizontal reference line
const costLineY = computed(() => savToY(systemCost.value))

// Keep aliases for any leftover references
const breakEvenX = savBreakEvenX
const roiPath10 = savingsPath
const roiPathFillGain = savingsPathFill
const roiPathFillLoss = computed(() => '')
const paybackIntersectX = savBreakEvenX
const paybackIntersectY = costLineY
const paybackPath = savingsPath
const paybackPathFill = savingsPathFill
const yAxisTop = yAxisMax
const yAxisBot = computed(() => '₱0')

// ── Financing options (reactive) ──────────────────────────────────
const selectedFinancing = ref('loan')

const financingOptions = computed(() => [
  {
    key: 'cash', name: 'Cash Purchase', badge: 'Best ROI',
    desc: 'Full upfront payment. Maximum savings, zero interest cost.',
    line1Label: 'Upfront',  line1Value: php(systemCost.value),
    line2Label: 'Payback',  line2Value: `${computedPaybackYears.value} yrs`,
    line2Color: 'text-blue-600'
  },
  {
    key: 'loan', name: 'Apolaki PowerLoan', badge: 'Popular',
    desc: '6.25% APR — own your system, payments replace your bill.',
    line1Label: 'Down payment', line1Value: php(calculatedDownPayment.value),
    line2Label: 'Monthly EMI', line2Value: `${php(calculatedEMI.value)}/mo`,
    line2Color: 'text-blue-600'
  },
  {
    key: 'lease', name: 'Zero-Down Lease', badge: '₱0 down',
    desc: 'Pay 30% less than your current bill. No ownership required.',
    line1Label: 'Monthly', line1Value: `${php(inputBill.value * 0.7)}/mo`,
    line2Label: 'Maintenance', line2Value: 'Included',
    line2Color: 'text-emerald-600'
  }
])

const selectedFinancingOption = computed(() =>
  financingOptions.value.find(option => option.key === selectedFinancing.value) || financingOptions.value[0]
)

const selectedPlanDetails = computed(() => {
  const rows = comparisonRows.value
  return [
    {
      label: 'Upfront cost',
      value: rows.find(row => row.label === 'Upfront cost')?.values[selectedFinancing.value] || '—'
    },
    {
      label: 'Monthly payment',
      value: rows.find(row => row.label === 'Monthly payment')?.values[selectedFinancing.value] || '—',
      color: selectedFinancing.value === 'lease' || selectedFinancing.value === 'loan' ? 'text-blue-600' : ''
    },
    {
      label: 'Bill change',
      value: rows.find(row => row.label === 'vs. current bill')?.values[selectedFinancing.value] || '—',
      color: rows.find(row => row.label === 'vs. current bill')?.highlight?.[selectedFinancing.value] || ''
    },
    {
      label: '10-yr net value',
      value: rows.find(row => row.label === '10-yr net profit')?.values[selectedFinancing.value] || '—',
      color: 'text-emerald-600'
    }
  ]
})

// Side-by-side comparison rows for the table
const comparisonRows = computed(() => {
  const cashEmi  = 0
  const loanEmi  = calculatedEMI.value
  const leaseEmi = inputBill.value * 0.7
  const paymentDelta = (payment) => {
    const bill = Number(inputBill.value) || 0
    if (!bill) return '—'
    const diff = bill - payment
    const pct = Math.round(Math.abs(diff / bill) * 100)
    return diff >= 0 ? `−${pct}%` : `+${pct}%`
  }

  return [
    {
      label: 'Upfront cost',
      values: {
        cash:  php(systemCost.value),
        loan:  php(calculatedDownPayment.value),
        lease: '₱0'
      }
    },
    {
      label: 'Monthly payment',
      values: {
        cash:  '₱0/mo after purchase',
        loan:  php(loanEmi) + '/mo',
        lease: php(leaseEmi) + '/mo'
      }
    },
    {
      label: 'vs. current bill',
      values: {
        cash:  paymentDelta(cashEmi),
        loan:  paymentDelta(loanEmi),
        lease: paymentDelta(leaseEmi)
      },
      highlight: {
        cash:  'text-emerald-600',
        loan:  loanEmi < inputBill.value ? 'text-emerald-600' : 'text-amber-500',
        lease: 'text-emerald-600'
      }
    },
    {
      label: 'Payback period',
      values: {
        cash:  computedPaybackYears.value + ' yrs',
        loan:  loanTenureYears.value + ' yrs (loan)',
        lease: 'N/A — lease'
      }
    },
    {
      label: 'System ownership',
      values: { cash: 'Yes', loan: 'Yes (after)', lease: 'No' }
    },
    {
      label: '10-yr net profit',
      values: {
        cash:  php(lifetimeProfit.value),
        loan:  php(lifetimeProfit.value - (loanEmi * loanTenureYears.value * 12 - (systemCost.value - calculatedDownPayment.value))),
        lease: php((estimatedMonthlySavings.value - (leaseEmi - (inputBill.value - leaseEmi))) * 120)
      },
      highlight: { cash: 'text-emerald-600', loan: 'text-emerald-600', lease: 'text-emerald-600' }
    },
    {
      label: 'Maintenance',
      values: { cash: 'Owner', loan: 'Owner', lease: 'Included' }
    }
  ]
})

// ── Prequalification ──────────────────────────────────────────────
const creditGradeSteps = [
  { label: 'Subprime', range: '550-649', min: 550, max: 649 },
  { label: 'Good', range: '650-699', min: 650, max: 699 },
  { label: 'Very Good', range: '700-779', min: 700, max: 779 },
  { label: 'Excellent', range: '780-850', min: 780, max: 850 }
]

function isCreditStepActive(step) {
  const score = creditScore.value
  return score >= step.min && score <= step.max
}

const creditScoreRange = computed(() => {
  const s = creditScore.value
  if (s >= 780) return 'Excellent (Grade A)'
  if (s >= 700) return 'Very Good (Grade B)'
  if (s >= 650) return 'Good (Grade C)'
  return 'Subprime'
})

const prequalRating = computed(() => {
  if (!propertyOwned.value) return {
    status: 'Secondary Review', icon: '🔒',
    desc: 'Leases and PPAs are available without property ownership. Custom installs need landlord consent.',
    colorClass: isDark.value
      ? 'bg-amber-950/30 text-amber-400 border border-amber-800/50'
      : 'bg-amber-50 text-amber-800 border border-amber-200'
  }
  if (creditScore.value < 650) return {
    status: 'Co-Signer Recommended', icon: '🤝',
    desc: 'Adding a co-owner or security deposit ensures approval at 7.5% APR.',
    colorClass: isDark.value
      ? 'bg-slate-700/60 text-slate-300 border border-slate-600'
      : 'bg-gray-50 text-gray-700 border border-gray-200'
  }
  return {
    status: 'Pre-Approved', icon: '✓',
    desc: 'Your profile qualifies for Apolaki PowerLoan at 6.25% fixed APR.',
    colorClass: isDark.value
      ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/50'
      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
  }
})

// ── Ledger stats ──────────────────────────────────────────────────
const ledgerStats = computed(() => [
  { label: 'Income & Savings', value: php(financeStore.totalIncome   || 0), color: 'text-emerald-600' },
  { label: 'Expenses',         value: php(financeStore.totalExpenses || 0), color: 'text-red-500'     },
  {
    label: 'Net Balance',
    value: php(financeStore.netBalance || 0),
    color: (financeStore.netBalance || 0) >= 0 ? 'text-emerald-600' : 'text-red-500'
  },
  {
    label: 'Transactions',
    value: String(financeStore.transactions.length),
    color: isDark.value ? 'text-slate-200' : 'text-gray-800'
  }
])

// ── Styling helpers ───────────────────────────────────────────────
const cardClass = computed(() =>
  isDark.value ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-gray-200'
)
const inputClass = computed(() =>
  isDark.value
    ? 'bg-slate-900 border-slate-700 text-slate-100 placeholder-slate-500'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
)

function typeBadgeClass(type) {
  const d = isDark.value
  return {
    income:  d ? 'bg-emerald-900/40 text-emerald-400' : 'bg-emerald-50 text-emerald-700',
    savings: d ? 'bg-emerald-900/40 text-emerald-400' : 'bg-emerald-50 text-emerald-700',
    credit:  d ? 'bg-blue-900/40 text-blue-400'       : 'bg-blue-50 text-blue-700',
    expense: d ? 'bg-red-900/30 text-red-400'         : 'bg-red-50 text-red-700',
    payment: d ? 'bg-slate-700 text-slate-300'        : 'bg-gray-100 text-gray-600',
  }[type] || (d ? 'bg-slate-700 text-slate-400' : 'bg-gray-100 text-gray-500')
}

function isPositive(type) { return ['income', 'savings', 'credit'].includes(type) }
function formatDate(date) { return date ? new Date(date).toLocaleDateString() : '—' }

// ── Form ──────────────────────────────────────────────────────────
const form = reactive({
  type: '', category: '', amount: '',
  transactionDate: new Date().toISOString().split('T')[0],
  description: ''
})

function selectFinancingOption(option) {
  selectedFinancing.value = option
  loanDownPaymentPct.value = option === 'cash' ? 100 : option === 'lease' ? 0 : 20
}

async function handleCreateTransaction() {
  createSuccess.value = false
  try {
    await financeStore.createTransaction({
      type: form.type, category: form.category, amount: form.amount,
      transactionDate: form.transactionDate, description: form.description
    })
    createSuccess.value = true
    Object.assign(form, {
      type: '', category: '', amount: '',
      transactionDate: new Date().toISOString().split('T')[0], description: ''
    })
    showAddForm.value = false
    await financeStore.fetchSummary()
  } catch (err) { console.error('Transaction error:', err) }
}

// ── Data loading ──────────────────────────────────────────────────
async function loadData() {
  // Always load consent status first
  if (!userStore.consentStatus && userStore.isAuthenticated) {
    consentLoading.value = true
    try { await userStore.getConsentStatus() }
    catch (e) { console.warn('Consent load failed', e) }
    finally { consentLoading.value = false }
  }

  // Contractor persona: blocked before data fetch
  if (isDealer.value || !hasFinanceConsent.value) return

  // Restore pre-filled values from Assessment flow
  const saved = localStorage.getItem('financingAssessmentState')
  if (saved) {
    try {
      const s = JSON.parse(saved)
      if (s.monthlyBill) inputBill.value    = Math.min(s.monthlyBill, 20000)
      if (s.systemSize)  systemSizeKW.value = s.systemSize
      loanTenureYears.value    = 7
      loanDownPaymentPct.value = 20
    } catch { /* ignore */ }
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
    annualUsage: Math.round(monthlyGenKwh.value * 12),
    sunExposure: 'high', obstructionLevel: 'low',
    recommendedCapacity: systemSizeKW.value, estimatedCost: systemCost.value,      savingsEstimate: {
      monthlySavings: Math.round(estimatedMonthlySavings.value),
      paybackYears:   computedPaybackYears.value,
      roi:            estimatedRoi.value,
      decadeProfit:   lifetimeProfit.value,
      financingOption: loanDownPaymentPct.value === 100 ? 'cash'
                     : loanDownPaymentPct.value === 0   ? 'lease' : 'loan',
      description: `${systemSizeKW.value} kWp Solar — ${new Date().toLocaleDateString()}`
    }
  })
  saveSuccess.value = true
  setTimeout(() => { saveSuccess.value = false }, 3000)
}

function loadSavedSimulation(item) {
  if (item.recommended_capacity) systemSizeKW.value = parseFloat(item.recommended_capacity)
  const opt = item.savings_estimate?.financingOption || item.financing_option || 'loan'
  loanDownPaymentPct.value = opt === 'cash' ? 100 : opt === 'lease' ? 0 : 20
  activeTab.value = 'advisor'
}

onMounted(loadData)

// Re-fetch when consent granted reactively
watch(hasFinanceConsent, (granted) => {
  if (granted && !financeStore.transactions.length && !financeStore.loading) {
    financeStore.fetchTransactions()
    financeStore.fetchSummary()
    assessmentStore.fetchAssessments()
  }
})
</script>
