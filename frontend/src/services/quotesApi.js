import api from './api'

/**
 * Dealer Quote Generator API.
 *
 * All calls go through the shared `api` axios instance (baseURL '/api',
 * withCredentials, app interceptors). Routes are mounted under /quotes and
 * require an authenticated dealer/installer/admin/superadmin session.
 *
 * Response envelope is always { success, data?, error?, code? }.
 *
 * QUOTE shape returned by calculate/create/get:
 *   { id?, quoteNumber?, dealerId?, method, input, customer, notes,
 *     systemKw, priceTotalPhp, currency:'PHP', breakdown:[{label, amountPhp, pct}],
 *     monthlyKwh?, validation:{valid,errors,warnings}, status?, validUntil?, createdAt? }
 */
export const quotesApi = {
  /**
   * Stateless calculation — never writes to the DB.
   * POST /quotes/calculate
   * body: { method, input, customer?, notes?, validityDays? }
   * -> 200 { success, data: QUOTE } | 400 on input-validation failure.
   */
  calculate(payload) {
    return api.post('/quotes/calculate', payload)
  },

  /**
   * Persist a quote (server assigns id + quoteNumber).
   * POST /quotes
   * body: { method, input, customer?, notes?, validityDays? }
   * -> 201 { success, data: QUOTE(with id, quoteNumber, saved) }
   */
  create(payload) {
    return api.post('/quotes', payload)
  },

  /**
   * List the signed-in dealer's quotes (admins see all).
   * GET /quotes -> 200 { success, count, data: [QUOTE summary] }
   */
  list() {
    return api.get('/quotes')
  },

  /**
   * Fetch a single quote (owner dealer or admin).
   * GET /quotes/:id -> 200 { success, data: QUOTE } | 403 OWNERSHIP_DENIED
   */
  get(id) {
    return api.get(`/quotes/${id}`)
  },

  /**
   * Update status/notes on a quote (owner/admin).
   * PATCH /quotes/:id body: { status?, notes? }
   * status in ['draft','sent','accepted','expired'] -> 200 { success, data: QUOTE }
   */
  update(id, patch) {
    return api.patch(`/quotes/${id}`, patch)
  },

  /**
   * Delete a quote (owner/admin).
   * DELETE /quotes/:id -> 200 { success:true }
   */
  remove(id) {
    return api.delete(`/quotes/${id}`)
  }
}

export default quotesApi
