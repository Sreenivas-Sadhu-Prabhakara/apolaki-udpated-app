<template>
  <div class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">💰 Financial Overview</h1>
          <p class="mt-2 text-gray-600">Track solar savings, payments, and financial performance</p>
        </div>
        <button @click="showAddForm = true" class="bg-orange-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-700 transition">
          + Record Transaction
        </button>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p class="text-sm font-medium text-gray-500">Total Income / Savings</p>
          <p class="text-3xl font-bold text-green-600">${{ Number(financeStore.totalIncome).toLocaleString() }}</p>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p class="text-sm font-medium text-gray-500">Total Expenses</p>
          <p class="text-3xl font-bold text-red-600">${{ Number(financeStore.totalExpenses).toLocaleString() }}</p>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p class="text-sm font-medium text-gray-500">Net Balance</p>
          <p class="text-3xl font-bold" :class="financeStore.netBalance >= 0 ? 'text-green-600' : 'text-red-600'">
            ${{ Number(financeStore.netBalance).toLocaleString() }}
          </p>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p class="text-sm font-medium text-gray-500">Transactions</p>
          <p class="text-3xl font-bold text-blue-600">{{ financeStore.transactions.length }}</p>
        </div>
      </div>

      <!-- Summary by Type -->
      <div v-if="financeStore.summary.length > 0" class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div v-for="s in financeStore.summary" :key="s.type" class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div class="flex items-center gap-3 mb-2">
            <span class="text-2xl">{{ typeIcon(s.type) }}</span>
            <p class="text-sm font-medium text-gray-500 capitalize">{{ s.type }}</p>
          </div>
          <p class="text-2xl font-bold text-gray-900">${{ Number(s.total || 0).toLocaleString() }}</p>
          <p class="text-sm text-gray-400">{{ s.count }} transaction{{ s.count != 1 ? 's' : '' }} · Avg ${{ Number(s.average || 0).toFixed(2) }}</p>
        </div>
      </div>

      <!-- Add Transaction Form -->
      <div v-if="showAddForm" class="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold">Record Transaction</h2>
          <button @click="showAddForm = false" class="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>
        <form @submit.prevent="handleCreateTransaction" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select v-model="form.type" required class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
              <option value="">Select type...</option>
              <option value="income">Income / Savings</option>
              <option value="expense">Expense / Payment</option>
              <option value="credit">Tax Credit</option>
              <option value="payment">Loan Payment</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select v-model="form.category" required class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
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
            <label class="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
            <input v-model.number="form.amount" type="number" step="0.01" placeholder="1000.00" required class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input v-model="form.transactionDate" type="date" required class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500" />
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input v-model="form.description" type="text" placeholder="Monthly electricity savings from solar" class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500" />
          </div>
          <div class="md:col-span-2 flex gap-3">
            <button type="submit" :disabled="financeStore.loading" class="bg-orange-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 transition">
              {{ financeStore.loading ? 'Saving...' : 'Save Transaction' }}
            </button>
            <button type="button" @click="showAddForm = false" class="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition">
              Cancel
            </button>
          </div>
          <p v-if="financeStore.error" class="md:col-span-2 text-red-600 text-sm">{{ financeStore.error }}</p>
          <p v-if="createSuccess" class="md:col-span-2 text-green-600 text-sm font-medium">✓ Transaction recorded</p>
        </form>
      </div>

      <!-- Transactions Table -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 class="text-xl font-bold text-gray-900">Transaction History</h2>
          <button @click="loadData" class="text-sm text-orange-600 hover:text-orange-800 font-medium">🔄 Refresh</button>
        </div>

        <div v-if="financeStore.loading && !financeStore.transactions.length" class="text-center py-16 text-gray-500">
          Loading transactions...
        </div>

        <div v-else-if="financeStore.transactions.length === 0" class="text-center py-16">
          <div class="text-5xl mb-4">💸</div>
          <h3 class="text-lg font-semibold text-gray-700">No transactions yet</h3>
          <p class="text-gray-500 mt-2">Record your first solar-related transaction to start tracking</p>
        </div>

        <table v-else class="w-full text-sm">
          <thead>
            <tr class="border-b bg-gray-50 text-left text-gray-500 uppercase text-xs">
              <th class="px-6 py-3">Date</th>
              <th class="px-6 py-3">Type</th>
              <th class="px-6 py-3">Category</th>
              <th class="px-6 py-3">Description</th>
              <th class="px-6 py-3 text-right">Amount</th>
              <th class="px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="txn in financeStore.transactions" :key="txn.id" class="border-b hover:bg-gray-50">
              <td class="px-6 py-4">{{ formatDate(txn.transaction_date) }}</td>
              <td class="px-6 py-4">
                <span :class="typeBadgeClass(txn.type)" class="px-2 py-1 rounded text-xs font-medium capitalize">
                  {{ txn.type }}
                </span>
              </td>
              <td class="px-6 py-4 capitalize">{{ (txn.category || '').replace(/_/g, ' ') }}</td>
              <td class="px-6 py-4 text-gray-600 max-w-xs truncate">{{ txn.description || '—' }}</td>
              <td class="px-6 py-4 text-right font-semibold" :class="isPositive(txn.type) ? 'text-green-600' : 'text-red-600'">
                {{ isPositive(txn.type) ? '+' : '-' }}${{ Number(txn.amount || 0).toLocaleString() }}
              </td>
              <td class="px-6 py-4">
                <span :class="txn.status === 'completed' ? 'text-green-600' : 'text-yellow-600'" class="text-xs font-medium capitalize">
                  {{ txn.status || 'pending' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useFinanceStore } from '../stores/financeStore'

const financeStore = useFinanceStore()
const showAddForm = ref(false)
const createSuccess = ref(false)

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
  await Promise.all([
    financeStore.fetchTransactions(),
    financeStore.fetchSummary()
  ])
}

onMounted(loadData)
</script>
