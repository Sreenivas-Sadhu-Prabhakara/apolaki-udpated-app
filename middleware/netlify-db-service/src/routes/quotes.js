/**
 * Dealer quote generator routes.
 *
 * Mounted at /api so the final paths are:
 *   POST   /api/quotes/calculate   (stateless; no DB write)  permission quote:calculate
 *   POST   /api/quotes             (persists)                permission quote:create
 *   GET    /api/quotes             (dealer's own; admin all)  permission quote:list
 *   GET    /api/quotes/:id         (owner dealer or admin)    permission quote:read
 *   PATCH  /api/quotes/:id         (owner/admin)              permission quote:update
 *   DELETE /api/quotes/:id         (owner/admin)              permission quote:delete
 *
 * This is a DEALER-FACING tool. Role gating is enforced centrally in
 * src/auth/policy.js (allowedRoles ['dealer','installer','admin','superadmin'],
 * with 'installer' normalized to 'dealer'). Ownership (dealer_id === req.user.id
 * OR admin) is enforced here in the handlers (defense in depth).
 *
 * Pricing/sizing/validation is the SOLE responsibility of
 * src/services/quoteCalc.js — this layer never re-implements the math.
 */

import express from 'express';
import { z } from 'zod';
import { normalizeRole } from '../auth/access-control.js';
import { authenticateToken } from '../auth/middleware.js';
import { ensureQuotesSchema, quotes } from '../db.js';
import {
  CURRENCY,
  VALID_METHODS,
  computeQuote
} from '../services/quoteCalc.js';

const router = express.Router();

const QUOTE_STATUSES = ['draft', 'sent', 'accepted', 'expired'];
const DEFAULT_VALIDITY_DAYS = 30;
const MAX_VALIDITY_DAYS = 365;

// ─── Request validation (shape only; numeric bounds live in quoteCalc) ──────

const deviceSchema = z.object({
  name: z.string().max(120).optional(),
  watts: z.number(),
  quantity: z.number(),
  hoursPerDay: z.number()
});

const inputSchema = z.object({
  monthlyBillPhp: z.number().optional(),
  monthlyKwh: z.number().optional(),
  tariffPhpPerKwh: z.number().optional(),
  systemKw: z.number().optional(),
  devices: z.array(deviceSchema).optional()
}).passthrough();

const customerSchema = z.object({
  name: z.string().max(255).optional(),
  email: z.string().max(255).optional(),
  address: z.string().max(255).optional()
}).partial();

const quoteRequestSchema = z.object({
  method: z.enum(VALID_METHODS),
  input: inputSchema,
  customer: customerSchema.nullable().optional(),
  notes: z.string().max(4000).nullable().optional(),
  validityDays: z.number().int().min(1).max(MAX_VALIDITY_DAYS).optional()
});

const patchSchema = z.object({
  status: z.enum(QUOTE_STATUSES).optional(),
  notes: z.string().max(4000).nullable().optional()
}).refine(data => data.status !== undefined || data.notes !== undefined, {
  message: 'Provide at least one of status or notes.'
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isElevated(req) {
  return ['admin', 'superadmin'].includes(normalizeRole(req.user.role));
}

/**
 * Normalize an optional customer object into the persisted/serialized shape, or
 * null when no customer fields are present.
 */
function normalizeCustomer(customer) {
  if (!customer) return null;
  const name = customer.name ?? null;
  const email = customer.email ?? null;
  const address = customer.address ?? null;
  if (name === null && email === null && address === null) return null;
  return { name, email, address };
}

/**
 * Build the in-memory QUOTE envelope returned by /calculate (no id/quoteNumber).
 */
function buildQuoteEnvelope({ method, input, customer, notes, calc, validityDays }) {
  return {
    method,
    input,
    customer: normalizeCustomer(customer),
    notes: notes ?? null,
    systemKw: calc.systemKw,
    priceTotalPhp: calc.priceTotalPhp,
    currency: CURRENCY,
    breakdown: calc.breakdown,
    monthlyKwh: calc.monthlyKwh,
    validation: calc.validation,
    validityDays: validityDays ?? DEFAULT_VALIDITY_DAYS
  };
}

/**
 * Reshape a persisted quotes row into the QUOTE envelope.
 * JSONB columns may arrive parsed (Neon) or as strings (pg) — handle both.
 */
function serializeRow(row) {
  const parseJson = (value, fallback) => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'string') {
      try { return JSON.parse(value); } catch { return fallback; }
    }
    return value;
  };

  const customer = (row.customer_name || row.customer_email || row.customer_address)
    ? {
        name: row.customer_name ?? null,
        email: row.customer_email ?? null,
        address: row.customer_address ?? null
      }
    : null;

  return {
    id: row.id,
    quoteNumber: row.quote_number,
    dealerId: row.dealer_id,
    method: row.method,
    input: parseJson(row.input, {}),
    customer,
    notes: row.notes ?? null,
    systemKw: row.system_kw !== null && row.system_kw !== undefined ? Number(row.system_kw) : null,
    priceTotalPhp: row.price_total_php !== null && row.price_total_php !== undefined ? Number(row.price_total_php) : null,
    currency: row.currency || CURRENCY,
    breakdown: parseJson(row.breakdown, []),
    monthlyKwh: row.monthly_kwh !== null && row.monthly_kwh !== undefined ? Number(row.monthly_kwh) : undefined,
    status: row.status,
    validUntil: row.valid_until,
    createdAt: row.created_at
  };
}

/**
 * Compact summary row for the list endpoint.
 */
function serializeSummary(row) {
  const full = serializeRow(row);
  return {
    id: full.id,
    quoteNumber: full.quoteNumber,
    dealerId: full.dealerId,
    method: full.method,
    customer: full.customer,
    systemKw: full.systemKw,
    priceTotalPhp: full.priceTotalPhp,
    currency: full.currency,
    monthlyKwh: full.monthlyKwh,
    status: full.status,
    validUntil: full.validUntil,
    createdAt: full.createdAt
  };
}

/**
 * Parse the request body, run the pricing engine. On INPUT validation failure
 * (calc.validation.valid === false from method-specific bounds) writes a 400 and
 * returns null. Otherwise returns { parsed, calc }.
 */
function parseAndCompute(req, res) {
  const parsed = quoteRequestSchema.safeParse(req.body || {});
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: parsed.error.errors
    });
    return null;
  }

  const { method, input } = parsed.data;
  const calc = computeQuote(method, input);

  // Validation 1 (INPUT) failures => 400, surfacing the engine's errors.
  if (!calc.validation.valid) {
    res.status(400).json({
      success: false,
      error: 'Quote input validation failed',
      code: 'QUOTE_INPUT_INVALID',
      data: {
        validation: calc.validation
      }
    });
    return null;
  }

  return { parsed: parsed.data, calc };
}

/**
 * Load a quote and enforce ownership (dealer_id === req.user.id OR admin).
 * Returns the row, or null after writing the 404/403 response.
 */
async function loadOwnedQuote(req, res) {
  const row = await quotes.getById(req.params.id);
  if (!row) {
    res.status(404).json({ success: false, error: 'Quote not found' });
    return null;
  }
  if (row.dealer_id !== req.user.id && !isElevated(req)) {
    res.status(403).json({
      success: false,
      error: 'Access denied',
      code: 'OWNERSHIP_DENIED'
    });
    return null;
  }
  return row;
}

// ─── POST /api/quotes/calculate (stateless) ──────────────────────────────────

router.post('/quotes/calculate', authenticateToken, async (req, res) => {
  try {
    const result = parseAndCompute(req, res);
    if (!result) return;

    const { parsed, calc } = result;
    const envelope = buildQuoteEnvelope({
      method: parsed.method,
      input: parsed.input,
      customer: parsed.customer,
      notes: parsed.notes,
      calc,
      validityDays: parsed.validityDays
    });

    res.status(200).json({ success: true, data: envelope });
  } catch (error) {
    console.error('Error calculating quote:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── POST /api/quotes (persist) ──────────────────────────────────────────────

router.post('/quotes', authenticateToken, async (req, res) => {
  try {
    await ensureQuotesSchema();

    const result = parseAndCompute(req, res);
    if (!result) return;

    const { parsed, calc } = result;
    const customer = normalizeCustomer(parsed.customer);
    const validityDays = parsed.validityDays ?? DEFAULT_VALIDITY_DAYS;
    const validUntil = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000);

    const quoteNumber = await quotes.nextQuoteNumber();

    const row = await quotes.create({
      dealerId: req.user.id,
      quoteNumber,
      method: parsed.method,
      input: parsed.input,
      customerName: customer?.name ?? null,
      customerEmail: customer?.email ?? null,
      customerAddress: customer?.address ?? null,
      notes: parsed.notes ?? null,
      systemKw: calc.systemKw,
      priceTotalPhp: calc.priceTotalPhp,
      currency: CURRENCY,
      breakdown: calc.breakdown,
      monthlyKwh: calc.monthlyKwh ?? null,
      status: 'draft',
      validUntil
    });

    // Return the persisted, freshly-computed quote, including the live
    // validation block (warnings are not stored but are useful to the dealer).
    const data = { ...serializeRow(row), validation: calc.validation, saved: true };
    res.status(201).json({ success: true, data });
  } catch (error) {
    console.error('Error saving quote:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── GET /api/quotes (list) ──────────────────────────────────────────────────

router.get('/quotes', authenticateToken, async (req, res) => {
  try {
    await ensureQuotesSchema();

    const rows = isElevated(req)
      ? await quotes.listAll()
      : await quotes.getByDealer(req.user.id);

    const data = rows.map(serializeSummary);
    res.json({ success: true, count: data.length, data });
  } catch (error) {
    console.error('Error listing quotes:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── GET /api/quotes/:id ─────────────────────────────────────────────────────

router.get('/quotes/:id', authenticateToken, async (req, res) => {
  try {
    await ensureQuotesSchema();

    const row = await loadOwnedQuote(req, res);
    if (!row) return;

    res.json({ success: true, data: serializeRow(row) });
  } catch (error) {
    console.error('Error fetching quote:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── PATCH /api/quotes/:id ───────────────────────────────────────────────────

router.patch('/quotes/:id', authenticateToken, async (req, res) => {
  try {
    await ensureQuotesSchema();

    const parsed = patchSchema.safeParse(req.body || {});
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: parsed.error.errors
      });
    }

    const row = await loadOwnedQuote(req, res);
    if (!row) return;

    const updated = await quotes.update(row.id, {
      status: parsed.data.status,
      notes: parsed.data.notes
    });

    res.json({ success: true, data: serializeRow(updated) });
  } catch (error) {
    console.error('Error updating quote:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── DELETE /api/quotes/:id ──────────────────────────────────────────────────

router.delete('/quotes/:id', authenticateToken, async (req, res) => {
  try {
    await ensureQuotesSchema();

    const row = await loadOwnedQuote(req, res);
    if (!row) return;

    await quotes.remove(row.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting quote:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
