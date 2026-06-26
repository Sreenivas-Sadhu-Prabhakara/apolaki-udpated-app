<template>
  <div class="quote-page">
    <div class="quote-shell">
      <header class="quote-header">
        <div>
          <span class="eyebrow">Dealer tool</span>
          <h1>Solar Quote Generator</h1>
          <p>Size a system from a past bill, a target kW, or device usage — then generate an indicative, branded PHP quote for your customer.</p>
        </div>
        <div class="status-card">
          <span>Signed in as</span>
          <strong>{{ dealerName }}</strong>
          <small>{{ dealerEmail }}</small>
        </div>
      </header>

      <section class="content-grid">
        <!-- ── Left: inputs ─────────────────────────────── -->
        <article class="panel">
          <div class="panel-header">
            <div>
              <span class="eyebrow">Step 1</span>
              <h2>Sizing method</h2>
            </div>
          </div>

          <div class="method-tabs" role="tablist">
            <button
              v-for="m in methods"
              :key="m.id"
              type="button"
              class="method-tab"
              :class="{ active: method === m.id }"
              role="tab"
              :aria-selected="method === m.id"
              @click="method = m.id"
            >
              <span class="method-icon">{{ m.icon }}</span>
              <span class="method-label">{{ m.label }}</span>
              <small>{{ m.hint }}</small>
            </button>
          </div>

          <!-- Past bill -->
          <div v-if="method === 'bill'" class="input-grid">
            <label>Monthly bill (PHP)
              <input v-model.number="bill.monthlyBillPhp" type="number" min="0" step="100" placeholder="e.g. 5500" />
            </label>
            <label>or Monthly usage (kWh)
              <input v-model.number="bill.monthlyKwh" type="number" min="0" step="1" placeholder="optional, e.g. 500" />
            </label>
            <label>Tariff (PHP / kWh)
              <input v-model.number="bill.tariffPhpPerKwh" type="number" min="0" step="0.5" :placeholder="`default ${DEFAULT_TARIFF_PHP_PER_KWH}`" />
            </label>
            <p class="field-note">Provide a bill amount (we divide by tariff) or enter the kWh directly. Tariff defaults to ₱{{ DEFAULT_TARIFF_PHP_PER_KWH }}/kWh.</p>
          </div>

          <!-- Direct kW -->
          <div v-else-if="method === 'kw'" class="input-grid">
            <label>System size (kW)
              <input v-model.number="kw.systemKw" type="number" min="0.5" step="0.1" placeholder="e.g. 5" />
            </label>
            <p class="field-note">Used directly — no derivation. Allowed range {{ MIN_SYSTEM_KW }}–{{ MAX_SYSTEM_KW }} kW.</p>
          </div>

          <!-- Device usage -->
          <div v-else class="device-block">
            <div class="preset-row">
              <span class="preset-label">Quick add:</span>
              <button
                v-for="p in DEVICE_PRESETS"
                :key="p.name"
                type="button"
                class="preset-chip"
                @click="addPreset(p)"
              >+ {{ p.name }} ({{ p.watts }}W)</button>
            </div>

            <div v-if="!devices.length" class="empty-state small">
              No appliances yet. Add a preset above or a custom row below.
            </div>

            <div v-for="(d, i) in devices" :key="d._key" class="device-row">
              <input v-model="d.name" class="dev-name" placeholder="Appliance" />
              <input v-model.number="d.watts" type="number" min="1" step="1" class="dev-num" placeholder="Watts" title="Watts" />
              <input v-model.number="d.quantity" type="number" min="1" step="1" class="dev-num" placeholder="Qty" title="Quantity" />
              <input v-model.number="d.hoursPerDay" type="number" min="0" max="24" step="0.5" class="dev-num" placeholder="Hrs/day" title="Hours per day" />
              <button type="button" class="dev-remove" title="Remove" @click="removeDevice(i)">✕</button>
            </div>

            <button type="button" class="secondary-button add-device" @click="addDevice()">+ Add custom appliance</button>
            <p class="field-note">Estimated daily usage: <strong>{{ deviceDailyWh.toLocaleString() }} Wh</strong> · <strong>{{ deviceMonthlyKwh.toFixed(0) }} kWh / month</strong></p>
          </div>
        </article>

        <!-- ── Right: additional details ─────────────────── -->
        <article class="panel">
          <div class="panel-header">
            <div>
              <span class="eyebrow">Step 2</span>
              <h2>Additional details</h2>
            </div>
          </div>

          <div class="input-grid">
            <label>Customer name<input v-model="customer.name" placeholder="Juan Dela Cruz" /></label>
            <label>Customer email<input v-model="customer.email" type="email" placeholder="juan@example.com" /></label>
            <label>Customer address<input v-model="customer.address" placeholder="Street, barangay, city" /></label>
            <label>Validity (days)<input v-model.number="validityDays" type="number" min="1" max="365" placeholder="30" /></label>
            <label class="full">Notes<textarea v-model="notes" rows="3" placeholder="Optional notes for the customer (terms, scope, next steps)"></textarea></label>
          </div>

          <div class="form-actions">
            <button class="primary-button" type="button" :disabled="quotesStore.calculating" @click="generate">
              {{ quotesStore.calculating ? 'Calculating…' : 'Generate quote' }}
            </button>
            <button class="secondary-button" type="button" @click="resetForm">Reset</button>
          </div>
          <p v-if="formError" class="error-text">{{ formError }}</p>
        </article>
      </section>

      <!-- ── Result ───────────────────────────────────── -->
      <section v-if="result" class="panel result-panel">
        <div class="panel-header">
          <div>
            <span class="eyebrow">Indicative quote</span>
            <h2>{{ result.quoteNumber || 'Draft quote' }}</h2>
          </div>
          <span class="status-pill" :class="statusClass(result.status || 'draft')">{{ result.status || 'draft' }}</span>
        </div>

        <!-- validation messages -->
        <div v-if="validationErrors.length" class="alert alert-error">
          <strong>Please fix:</strong>
          <ul><li v-for="(e, i) in validationErrors" :key="i">{{ e }}</li></ul>
        </div>
        <div v-if="validationWarnings.length" class="alert alert-warn">
          <strong>Heads up:</strong>
          <ul><li v-for="(w, i) in validationWarnings" :key="i">{{ w }}</li></ul>
        </div>

        <div class="result-grid">
          <div class="spec-cards">
            <div class="spec-card">
              <span>System size</span>
              <strong>{{ Number(result.systemKw).toFixed(2) }} kW</strong>
            </div>
            <div class="spec-card">
              <span>Est. monthly output</span>
              <strong>{{ result.monthlyKwh != null ? Number(result.monthlyKwh).toFixed(0) + ' kWh' : '—' }}</strong>
            </div>
            <div class="spec-card total">
              <span>Total (VAT-incl.)</span>
              <strong>{{ formatPhp(result.priceTotalPhp) }}</strong>
            </div>
          </div>

          <div class="table-wrap">
            <table>
              <thead>
                <tr><th>Line item</th><th class="num">Share</th><th class="num">Amount</th></tr>
              </thead>
              <tbody>
                <tr v-for="item in result.breakdown" :key="item.label">
                  <td>{{ item.label }}</td>
                  <td class="num">{{ item.pct }}%</td>
                  <td class="num">{{ formatPhp(item.amountPhp) }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr><td>Total</td><td class="num">100%</td><td class="num">{{ formatPhp(result.priceTotalPhp) }}</td></tr>
              </tfoot>
            </table>
          </div>
        </div>

        <p class="disclaimer">
          Indicative quote only, based on ₱{{ PRICE_PER_KW_PHP.toLocaleString() }}/kW (all-in, VAT-inclusive).
          Final pricing depends on a site assessment. Valid until {{ formatDate(result.validUntil) }}.
        </p>

        <div class="form-actions">
          <button class="primary-button" type="button" @click="downloadPdf">⬇ Download PDF</button>
          <button class="secondary-button" type="button" :disabled="quotesStore.loading || result.id" @click="saveQuote">
            {{ result.id ? '✓ Saved' : (quotesStore.loading ? 'Saving…' : 'Save quote') }}
          </button>
        </div>
        <p v-if="saveError" class="error-text">{{ saveError }}</p>
        <p v-if="saveMsg" class="success-text">{{ saveMsg }}</p>
      </section>

      <!-- ── My quotes ────────────────────────────────── -->
      <section class="panel">
        <div class="panel-header">
          <div>
            <span class="eyebrow">History</span>
            <h2>My quotes</h2>
          </div>
          <button class="secondary-button" type="button" @click="quotesStore.fetchQuotes()">Refresh</button>
        </div>

        <div v-if="quotesStore.loading && !quotesStore.quotes.length" class="empty-state">Loading quotes…</div>
        <div v-else-if="!quotesStore.quotes.length" class="empty-state">No saved quotes yet. Generate one above and click “Save quote”.</div>
        <div v-else class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Quote #</th>
                <th>Customer</th>
                <th class="num">Size</th>
                <th class="num">Total</th>
                <th>Status</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="q in quotesStore.quotes" :key="q.id">
                <td class="mono">{{ q.quoteNumber }}</td>
                <td>{{ q.customer?.name || '—' }}</td>
                <td class="num">{{ Number(q.systemKw).toFixed(2) }} kW</td>
                <td class="num">{{ formatPhp(q.priceTotalPhp) }}</td>
                <td>
                  <select class="status-select" :value="q.status || 'draft'" @change="changeStatus(q, $event.target.value)">
                    <option v-for="s in STATUSES" :key="s" :value="s">{{ s }}</option>
                  </select>
                </td>
                <td>{{ formatDate(q.createdAt) }}</td>
                <td class="row-actions">
                  <button type="button" class="link-btn" @click="loadQuote(q)">View</button>
                  <button type="button" class="link-btn danger" @click="deleteQuote(q)">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useQuotesStore } from '../stores/quotesStore'
import { useUserStore } from '../stores/userStore'
import { formatCurrency } from '../utils/currency'

// ── Pricing/sizing constants (mirror of backend source of truth) ──
const PRICE_PER_KW_PHP = 50000
const DEFAULT_TARIFF_PHP_PER_KWH = 11
const PEAK_SUN_HOURS_PER_DAY = 4.7
const PERFORMANCE_RATIO = 0.8
const DAYS_PER_MONTH = 30
const MIN_SYSTEM_KW = 1
const MAX_SYSTEM_KW = 10000

const STATUSES = ['draft', 'sent', 'accepted', 'expired']

const DEVICE_PRESETS = [
  { name: 'Aircon', watts: 1500, quantity: 1, hoursPerDay: 8 },
  { name: 'Refrigerator', watts: 150, quantity: 1, hoursPerDay: 24 },
  { name: 'Lighting', watts: 200, quantity: 1, hoursPerDay: 6 },
  { name: 'TV', watts: 100, quantity: 1, hoursPerDay: 5 },
  { name: 'Washing machine', watts: 500, quantity: 1, hoursPerDay: 1 }
]

const methods = [
  { id: 'bill', icon: '🧾', label: 'Past bill', hint: 'From PHP or kWh' },
  { id: 'kw', icon: '⚡', label: 'Direct kW', hint: 'Target system size' },
  { id: 'devices', icon: '🔌', label: 'Device usage', hint: 'Appliance list' }
]

const quotesStore = useQuotesStore()
const userStore = useUserStore()

const method = ref('bill')
const bill = reactive({ monthlyBillPhp: null, monthlyKwh: null, tariffPhpPerKwh: null })
const kw = reactive({ systemKw: null })
const devices = ref([])
const customer = reactive({ name: '', email: '', address: '' })
const notes = ref('')
const validityDays = ref(30)

const formError = ref('')
const saveError = ref('')
const saveMsg = ref('')

const result = computed(() => quotesStore.current)
const validationErrors = computed(() => result.value?.validation?.errors || [])
const validationWarnings = computed(() => result.value?.validation?.warnings || [])

const dealerName = computed(() => {
  const u = userStore.user || {}
  return u.fullName || u.full_name || u.name ||
    [u.first_name || u.firstName, u.last_name || u.lastName].filter(Boolean).join(' ') ||
    u.email || 'Dealer'
})
const dealerEmail = computed(() => userStore.user?.email || '')

function formatPhp(amount) {
  return formatCurrency(amount, { fromUSD: false, currency: 'PHP', decimals: 0 })
}

function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
}

function statusClass(status) {
  return {
    accepted: 'status-active',
    sent: 'status-pending',
    expired: 'status-neutral',
    draft: 'status-neutral'
  }[status] || 'status-neutral'
}

// ── Device helpers ───────────────────────────────────
let deviceSeq = 0
function addDevice(seed = {}) {
  devices.value.push({
    _key: `dev-${++deviceSeq}`,
    name: seed.name || '',
    watts: seed.watts ?? null,
    quantity: seed.quantity ?? 1,
    hoursPerDay: seed.hoursPerDay ?? null
  })
}
function addPreset(p) {
  addDevice({ ...p })
}
function removeDevice(i) {
  devices.value.splice(i, 1)
}

const deviceDailyWh = computed(() =>
  devices.value.reduce((sum, d) =>
    sum + (Number(d.watts) || 0) * (Number(d.quantity) || 0) * (Number(d.hoursPerDay) || 0), 0)
)
const deviceMonthlyKwh = computed(() => (deviceDailyWh.value / 1000) * DAYS_PER_MONTH)

// ── Build payload for the active method ──────────────
function buildInput() {
  if (method.value === 'bill') {
    const input = {}
    if (bill.monthlyBillPhp != null && bill.monthlyBillPhp !== '') input.monthlyBillPhp = Number(bill.monthlyBillPhp)
    if (bill.monthlyKwh != null && bill.monthlyKwh !== '') input.monthlyKwh = Number(bill.monthlyKwh)
    if (bill.tariffPhpPerKwh != null && bill.tariffPhpPerKwh !== '') input.tariffPhpPerKwh = Number(bill.tariffPhpPerKwh)
    return input
  }
  if (method.value === 'kw') {
    return { systemKw: Number(kw.systemKw) }
  }
  return {
    devices: devices.value.map(d => ({
      name: d.name || 'Appliance',
      watts: Number(d.watts) || 0,
      quantity: Number(d.quantity) || 0,
      hoursPerDay: Number(d.hoursPerDay) || 0
    }))
  }
}

// Light client-side guard for an obviously empty form (server is the source of truth).
function preflight() {
  if (method.value === 'bill') {
    if ((bill.monthlyBillPhp == null || bill.monthlyBillPhp === '') &&
        (bill.monthlyKwh == null || bill.monthlyKwh === '')) {
      return 'Enter a monthly bill amount or monthly usage in kWh.'
    }
  } else if (method.value === 'kw') {
    if (kw.systemKw == null || kw.systemKw === '') return 'Enter a target system size in kW.'
  } else if (!devices.value.length) {
    return 'Add at least one appliance.'
  }
  return ''
}

function buildPayload() {
  const payload = { method: method.value, input: buildInput() }
  const cust = {
    name: customer.name.trim(),
    email: customer.email.trim(),
    address: customer.address.trim()
  }
  if (cust.name || cust.email || cust.address) payload.customer = cust
  if (notes.value.trim()) payload.notes = notes.value.trim()
  if (validityDays.value) payload.validityDays = Number(validityDays.value)
  return payload
}

async function generate() {
  formError.value = ''
  saveError.value = ''
  saveMsg.value = ''
  const pre = preflight()
  if (pre) { formError.value = pre; return }
  const quote = await quotesStore.calculate(buildPayload())
  if (!quote) {
    formError.value = quotesStore.error || 'Calculation failed. Check your inputs.'
  }
}

async function saveQuote() {
  saveError.value = ''
  saveMsg.value = ''
  const saved = await quotesStore.save(buildPayload())
  if (saved) {
    saveMsg.value = `Saved as ${saved.quoteNumber}.`
  } else {
    saveError.value = quotesStore.error || 'Failed to save quote.'
  }
}

function resetForm() {
  Object.assign(bill, { monthlyBillPhp: null, monthlyKwh: null, tariffPhpPerKwh: null })
  kw.systemKw = null
  devices.value = []
  Object.assign(customer, { name: '', email: '', address: '' })
  notes.value = ''
  validityDays.value = 30
  formError.value = ''
  saveError.value = ''
  saveMsg.value = ''
  quotesStore.clearCurrent()
}

// ── My quotes actions ────────────────────────────────
async function changeStatus(q, status) {
  await quotesStore.updateQuote(q.id, { status })
}
async function loadQuote(q) {
  const full = await quotesStore.fetchQuote(q.id)
  if (full) {
    quotesStore.current = full
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}
async function deleteQuote(q) {
  if (!window.confirm(`Delete quote ${q.quoteNumber}? This cannot be undone.`)) return
  await quotesStore.removeQuote(q.id)
}

// ── PDF generation (jsPDF + jspdf-autotable functional API) ──
function downloadPdf() {
  const q = result.value
  if (!q) return
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 40
  const brand = [15, 108, 189] // #0F6CBD

  // Header band
  doc.setFillColor(...brand)
  doc.rect(0, 0, pageW, 76, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.text('APOLAKI SOLAR', margin, 38)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text('Indicative Solar Quotation', margin, 56)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text(q.quoteNumber || 'Draft quote', pageW - margin, 38, { align: 'right' })
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Valid until ${formatDate(q.validUntil)}`, pageW - margin, 54, { align: 'right' })

  doc.setTextColor(33, 33, 33)
  let y = 104

  // Dealer + customer blocks
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('PREPARED BY', margin, y)
  doc.text('PREPARED FOR', pageW / 2, y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  let yL = y + 16
  doc.text(dealerName.value, margin, yL)
  if (dealerEmail.value) doc.text(dealerEmail.value, margin, yL + 14)

  const cust = q.customer || {}
  let yR = y + 16
  doc.text(cust.name || '—', pageW / 2, yR)
  if (cust.email) { yR += 14; doc.text(cust.email, pageW / 2, yR) }
  if (cust.address) {
    yR += 14
    doc.text(doc.splitTextToSize(cust.address, pageW / 2 - margin), pageW / 2, yR)
  }
  y = Math.max(yL + 28, yR + 28, y + 60)

  // System specs
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('SYSTEM SPECIFICATIONS', margin, y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  y += 16
  doc.text(`System size: ${Number(q.systemKw).toFixed(2)} kW`, margin, y)
  const est = q.monthlyKwh != null ? `${Number(q.monthlyKwh).toFixed(0)} kWh` : 'n/a'
  doc.text(`Est. monthly output: ${est}`, margin + 180, y)
  y += 14
  doc.text(`Method: ${q.method}`, margin, y)
  y += 18

  // Breakdown table
  autoTable(doc, {
    startY: y,
    head: [['Line item', 'Share', 'Amount (PHP)']],
    body: (q.breakdown || []).map(b => [b.label, `${b.pct}%`, formatPhp(b.amountPhp)]),
    foot: [['Total', '100%', formatPhp(q.priceTotalPhp)]],
    theme: 'striped',
    margin: { left: margin, right: margin },
    headStyles: { fillColor: brand, textColor: 255, fontStyle: 'bold' },
    footStyles: { fillColor: [233, 242, 251], textColor: brand, fontStyle: 'bold' },
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
    styles: { fontSize: 10, cellPadding: 6 }
  })
  y = doc.lastAutoTable.finalY + 24

  // Big total
  doc.setFillColor(...brand)
  doc.roundedRect(margin, y, pageW - margin * 2, 48, 6, 6, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('TOTAL (VAT-inclusive)', margin + 16, y + 30)
  doc.setFontSize(20)
  doc.text(formatPhp(q.priceTotalPhp), pageW - margin - 16, y + 31, { align: 'right' })
  y += 70

  // Notes
  doc.setTextColor(33, 33, 33)
  if (q.notes) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text('NOTES', margin, y)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    y += 14
    const noteLines = doc.splitTextToSize(q.notes, pageW - margin * 2)
    doc.text(noteLines, margin, y)
    y += noteLines.length * 12 + 10
  }

  // Warnings
  const warnings = q.validation?.warnings || []
  if (warnings.length) {
    doc.setTextColor(146, 64, 14)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text('NOTICES', margin, y)
    doc.setFont('helvetica', 'normal')
    y += 13
    warnings.forEach(w => {
      const lines = doc.splitTextToSize(`• ${w}`, pageW - margin * 2)
      doc.text(lines, margin, y)
      y += lines.length * 11
    })
    y += 8
  }

  // Disclaimer footer
  doc.setTextColor(120, 120, 120)
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(8)
  const disclaimer = `Indicative quote only, based on PHP ${PRICE_PER_KW_PHP.toLocaleString()}/kW (all-in, VAT-inclusive). ` +
    `Final pricing is subject to a site assessment and may vary. This document is not a binding offer.`
  doc.text(doc.splitTextToSize(disclaimer, pageW - margin * 2), margin, Math.min(y + 6, doc.internal.pageSize.getHeight() - 30))

  const fname = `${q.quoteNumber || 'apolaki-quote'}.pdf`
  doc.save(fname)
}

onMounted(() => {
  quotesStore.fetchQuotes()
})
</script>

<style scoped>
.quote-page {
  min-height: 100vh;
  background: #f7fafc;
  color: #17202a;
  padding: 32px 18px 64px;
}

.quote-shell {
  max-width: 1180px;
  margin: 0 auto;
}

.quote-header,
.content-grid {
  display: grid;
  gap: 18px;
}

.quote-header {
  grid-template-columns: minmax(0, 1fr) 280px;
  align-items: end;
  margin-bottom: 22px;
}

.quote-header h1 {
  margin: 8px 0;
  font-size: clamp(2rem, 4vw, 3.2rem);
  font-weight: 950;
  line-height: 0.98;
}

.quote-header p,
.empty-state,
.field-note {
  color: #607080;
}

.eyebrow {
  color: #0f6cbd;
  font-size: 0.74rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.content-grid {
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
  margin-bottom: 18px;
}

.panel,
.stat-card,
.status-card {
  border: 1px solid #e1e9f0;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 14px 42px rgba(15, 23, 42, 0.06);
  padding: 20px;
  margin-bottom: 18px;
}

.status-card {
  display: grid;
  gap: 5px;
  margin-bottom: 0;
}

.status-card span {
  color: #6b7785;
  font-size: 0.8rem;
  font-weight: 800;
  text-transform: uppercase;
}

.status-card strong {
  color: #0f6cbd;
  font-size: 1.3rem;
  font-weight: 950;
}

.status-card small {
  color: #6b7785;
  font-size: 0.8rem;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.panel-header h2 {
  margin: 4px 0 0;
  font-size: 1.25rem;
  font-weight: 900;
}

/* Method tabs */
.method-tabs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 18px;
}

.method-tab {
  display: grid;
  gap: 4px;
  border: 1px solid #e1e9f0;
  border-radius: 14px;
  background: #fbfdff;
  padding: 12px 10px;
  text-align: center;
  cursor: pointer;
  transition: all 0.15s ease;
}

.method-tab.active {
  border-color: #0f6cbd;
  background: #eef7ff;
  box-shadow: 0 6px 18px rgba(15, 108, 189, 0.15);
}

.method-icon { font-size: 1.4rem; }
.method-label { font-weight: 900; font-size: 0.92rem; }
.method-tab small { color: #6b7785; font-size: 0.72rem; font-weight: 700; }

/* Inputs */
.input-grid {
  display: grid;
  gap: 12px;
}

.input-grid label.full,
label.full { grid-column: 1 / -1; }

label {
  display: grid;
  gap: 6px;
  color: #435160;
  font-size: 0.86rem;
  font-weight: 800;
}

input,
textarea,
select {
  min-height: 44px;
  border: 1px solid #d8e3ec;
  border-radius: 12px;
  background: #f8fbfd;
  color: inherit;
  font: inherit;
  padding: 10px 12px;
}

textarea { min-height: 72px; resize: vertical; }

.field-note { font-size: 0.8rem; font-weight: 700; margin: 2px 0 0; }

/* Devices */
.device-block { display: grid; gap: 12px; }

.preset-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.preset-label { font-size: 0.8rem; font-weight: 800; color: #435160; }

.preset-chip {
  border: 1px solid #cfe1f1;
  border-radius: 999px;
  background: #e8f2fb;
  color: #0f6cbd;
  font-size: 0.76rem;
  font-weight: 800;
  padding: 6px 10px;
  cursor: pointer;
}

.preset-chip:hover { background: #d6e9fa; }

.device-row {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) repeat(3, minmax(0, 1fr)) auto;
  gap: 8px;
  align-items: center;
}

.dev-num { text-align: right; }

.dev-remove {
  min-height: 40px;
  border: 0;
  border-radius: 10px;
  background: #fee2e2;
  color: #b91c1c;
  font-weight: 900;
  cursor: pointer;
  padding: 0 12px;
}

.add-device { justify-self: start; }

/* Buttons */
.form-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  flex-wrap: wrap;
}

.primary-button,
.secondary-button {
  min-height: 44px;
  border: 0;
  border-radius: 12px;
  padding: 10px 18px;
  font-weight: 900;
  cursor: pointer;
}

.primary-button { background: #0f6cbd; color: #ffffff; }
.primary-button:disabled { opacity: 0.6; cursor: not-allowed; }
.secondary-button { background: #e8f2fb; color: #0f6cbd; }
.secondary-button:disabled { opacity: 0.6; cursor: not-allowed; }

.success-text { color: #047857; font-weight: 800; margin: 8px 0 0; }
.error-text { color: #b91c1c; font-weight: 800; margin: 8px 0 0; }

/* Result */
.result-panel { border-color: #cfe1f1; }

.result-grid {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  gap: 18px;
  margin-bottom: 12px;
}

.spec-cards { display: grid; gap: 12px; align-content: start; }

.spec-card {
  display: grid;
  gap: 4px;
  border: 1px solid #e1e9f0;
  border-radius: 14px;
  background: #fbfdff;
  padding: 14px;
}

.spec-card span {
  color: #6b7785;
  font-size: 0.74rem;
  font-weight: 800;
  text-transform: uppercase;
}

.spec-card strong { font-size: 1.4rem; font-weight: 950; color: #17202a; }

.spec-card.total { background: #0f6cbd; border-color: #0f6cbd; }
.spec-card.total span { color: rgba(255, 255, 255, 0.85); }
.spec-card.total strong { color: #ffffff; font-size: 1.6rem; }

.disclaimer {
  color: #6b7785;
  font-size: 0.78rem;
  font-style: italic;
  margin: 12px 0;
}

/* Alerts */
.alert {
  border-radius: 12px;
  padding: 12px 14px;
  margin-bottom: 14px;
  font-size: 0.86rem;
}
.alert ul { margin: 6px 0 0; padding-left: 18px; }
.alert-error { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
.alert-warn { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }

/* Tables */
.table-wrap { overflow-x: auto; }

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

th, td {
  border-bottom: 1px solid #e6edf4;
  padding: 12px 10px;
  text-align: left;
}

th {
  color: #6b7785;
  font-size: 0.78rem;
  text-transform: uppercase;
}

.num { text-align: right; }
.mono { font-family: ui-monospace, monospace; font-size: 0.82rem; }

tfoot td { font-weight: 900; color: #0f6cbd; border-top: 2px solid #cfe1f1; }

.status-pill {
  border-radius: 999px;
  padding: 5px 10px;
  font-size: 0.76rem;
  font-weight: 900;
  text-transform: capitalize;
}

.status-active { background: #dcfce7; color: #166534; }
.status-pending { background: #fef3c7; color: #92400e; }
.status-neutral { background: #eef2f7; color: #475569; }

.status-select {
  min-height: 36px;
  padding: 4px 8px;
  font-weight: 800;
  font-size: 0.82rem;
  text-transform: capitalize;
}

.row-actions { display: flex; gap: 10px; }

.link-btn {
  border: 0;
  background: none;
  color: #0f6cbd;
  font-weight: 800;
  font-size: 0.84rem;
  cursor: pointer;
  padding: 0;
}
.link-btn.danger { color: #b91c1c; }

.empty-state {
  padding: 18px;
  text-align: center;
  font-weight: 700;
}
.empty-state.small { padding: 10px; font-size: 0.85rem; }

/* Dark mode */
:global(.dark-theme) .quote-page {
  background: #0f141a;
  color: #f5f7fb;
}

:global(.dark-theme) .panel,
:global(.dark-theme) .status-card,
:global(.dark-theme) .method-tab,
:global(.dark-theme) .spec-card {
  border-color: rgba(255, 255, 255, 0.08);
  background: #171d23;
  box-shadow: none;
}

:global(.dark-theme) .method-tab.active { background: #16314a; border-color: #0f6cbd; }
:global(.dark-theme) .spec-card strong { color: #f5f7fb; }
:global(.dark-theme) .spec-card.total { background: #0f6cbd; }

:global(.dark-theme) input,
:global(.dark-theme) textarea,
:global(.dark-theme) select {
  border-color: rgba(255, 255, 255, 0.08);
  background: #101418;
  color: #f5f7fb;
}

:global(.dark-theme) .preset-chip { background: #16314a; border-color: rgba(255, 255, 255, 0.1); color: #8fc4f0; }
:global(.dark-theme) th { color: #94a3b8; }
:global(.dark-theme) td { border-color: rgba(255, 255, 255, 0.07); }
:global(.dark-theme) .result-panel { border-color: rgba(255, 255, 255, 0.12); }

@media (max-width: 900px) {
  .quote-header,
  .content-grid,
  .result-grid {
    grid-template-columns: 1fr;
  }
  .method-tabs { grid-template-columns: 1fr; }
  .device-row {
    grid-template-columns: minmax(0, 1fr) repeat(3, minmax(0, 1fr)) auto;
  }
}
</style>
