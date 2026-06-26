/**
 * Dealer quote calculation engine (pure, dependency-free).
 *
 * SOURCE OF TRUTH for pricing + sizing + the two in-feature validations. These
 * constants and formulas MUST stay identical to any frontend display.
 *
 * Three input METHODS (the dealer picks ONE):
 *   - 'bill'    : { monthlyBillPhp?, monthlyKwh?, tariffPhpPerKwh? }
 *   - 'kw'      : { systemKw }
 *   - 'devices' : { devices: [ { name, watts, quantity, hoursPerDay } ] }
 *
 * computeQuote(method, input) -> { systemKw, priceTotalPhp, breakdown, monthlyKwh?, validation }
 *
 * Two validations (both surfaced in validation:{ valid, errors, warnings }):
 *   Validation 1 (INPUT)  : method-specific bounds. Any failure => valid:false (route returns 400).
 *   Validation 2 (OUTPUT) : cross-check systemKw/price/breakdown + plausibility warnings (non-blocking).
 */

// ── Pricing + sizing constants (identical on backend and frontend) ──────────
export const PRICE_PER_KW_PHP = 50000; // headline indicative pricing: 1 kW ~ PHP 50,000 (all-in, VAT-inclusive label)
export const DEFAULT_TARIFF_PHP_PER_KWH = 11;
export const PEAK_SUN_HOURS_PER_DAY = 4.7;
export const PERFORMANCE_RATIO = 0.8;
export const DAYS_PER_MONTH = 30;
export const MIN_SYSTEM_KW = 1;
export const MAX_SYSTEM_KW = 10000;
export const CURRENCY = 'PHP';

// Indicative line-item breakdown (must sum to priceTotalPhp within +/-1 peso).
export const BREAKDOWN_ITEMS = [
  { label: 'Solar panels & modules', pct: 45 },
  { label: 'Inverter', pct: 18 },
  { label: 'Mounting & balance-of-system', pct: 17 },
  { label: 'Installation & labor', pct: 15 },
  { label: 'Design, permits & other', pct: 5 }
];

export const VALID_METHODS = ['bill', 'kw', 'devices'];

// ── Helpers ─────────────────────────────────────────────────────────────────

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function isFiniteNumber(n) {
  return typeof n === 'number' && Number.isFinite(n);
}

function inRange(n, min, max) {
  return isFiniteNumber(n) && n >= min && n <= max;
}

/**
 * Build the indicative breakdown for a total. Each item is round()ed; the
 * rounding remainder is assigned to the largest item so the items sum EXACTLY
 * to priceTotalPhp.
 * @param {number} priceTotalPhp
 * @returns {Array<{label, amountPhp, pct}>}
 */
export function buildBreakdown(priceTotalPhp) {
  const items = BREAKDOWN_ITEMS.map(item => ({
    label: item.label,
    pct: item.pct,
    amountPhp: Math.round((priceTotalPhp * item.pct) / 100)
  }));

  const sum = items.reduce((acc, item) => acc + item.amountPhp, 0);
  const remainder = priceTotalPhp - sum;
  if (remainder !== 0 && items.length) {
    // Assign the rounding remainder to the largest item (by amount, then pct).
    let largestIdx = 0;
    for (let i = 1; i < items.length; i++) {
      if (items[i].amountPhp > items[largestIdx].amountPhp) largestIdx = i;
    }
    items[largestIdx].amountPhp += remainder;
  }

  return items.map(item => ({ label: item.label, amountPhp: item.amountPhp, pct: item.pct }));
}

// ── Validation 1 (INPUT) ─────────────────────────────────────────────────────

/**
 * Method-specific input bounds. Pushes a clear message to `errors` on failure.
 * @returns {{ errors: string[], warnings: string[] }}
 */
export function validateInput(method, input = {}) {
  const errors = [];
  const warnings = [];

  if (!VALID_METHODS.includes(method)) {
    errors.push(`Unknown method '${method}'. Expected one of: ${VALID_METHODS.join(', ')}.`);
    return { errors, warnings };
  }

  if (method === 'bill') {
    const { monthlyBillPhp, monthlyKwh, tariffPhpPerKwh } = input;
    const hasBill = monthlyBillPhp !== undefined && monthlyBillPhp !== null;
    const hasKwh = monthlyKwh !== undefined && monthlyKwh !== null;

    if (!hasBill && !hasKwh) {
      errors.push('Provide either monthlyBillPhp or monthlyKwh for the bill method.');
    }
    if (hasBill && !inRange(Number(monthlyBillPhp), 500, 2_000_000)) {
      errors.push('monthlyBillPhp must be a number between 500 and 2,000,000.');
    }
    if (hasKwh && !inRange(Number(monthlyKwh), 10, 200000)) {
      errors.push('monthlyKwh must be a number between 10 and 200,000.');
    }
    if (tariffPhpPerKwh !== undefined && tariffPhpPerKwh !== null &&
        !inRange(Number(tariffPhpPerKwh), 3, 30)) {
      errors.push('tariffPhpPerKwh must be a number between 3 and 30.');
    }
  } else if (method === 'kw') {
    const { systemKw } = input;
    if (!inRange(Number(systemKw), 0.5, 10000)) {
      errors.push('systemKw must be a number between 0.5 and 10,000.');
    }
  } else if (method === 'devices') {
    const devices = Array.isArray(input.devices) ? input.devices : null;
    if (!devices || devices.length < 1) {
      errors.push('Provide at least one device for the devices method.');
    } else {
      devices.forEach((device, i) => {
        const label = device && device.name ? `"${device.name}"` : `#${i + 1}`;
        if (!inRange(Number(device?.watts), 1, 100000)) {
          errors.push(`Device ${label}: watts must be a number between 1 and 100,000.`);
        }
        if (!inRange(Number(device?.quantity), 1, 1000)) {
          errors.push(`Device ${label}: quantity must be a number between 1 and 1,000.`);
        }
        if (!inRange(Number(device?.hoursPerDay), 0, 24)) {
          errors.push(`Device ${label}: hoursPerDay must be a number between 0 and 24.`);
        }
      });
    }
  }

  return { errors, warnings };
}

// ── Sizing per method (assumes input already passed validateInput) ──────────

/**
 * Derive { systemKw (pre-clamp), monthlyKwh? } from the chosen method.
 * Mutates nothing; returns the raw computed values plus any plausibility warnings.
 * @returns {{ systemKw: number, monthlyKwh: number|undefined, warnings: string[] }}
 */
function sizeFromInput(method, input = {}) {
  const warnings = [];

  if (method === 'kw') {
    return { systemKw: Number(input.systemKw), monthlyKwh: undefined, warnings };
  }

  let monthlyKwh;

  if (method === 'bill') {
    const tariff = (input.tariffPhpPerKwh !== undefined && input.tariffPhpPerKwh !== null)
      ? Number(input.tariffPhpPerKwh)
      : DEFAULT_TARIFF_PHP_PER_KWH;
    monthlyKwh = (input.monthlyKwh !== undefined && input.monthlyKwh !== null)
      ? Number(input.monthlyKwh)
      : Number(input.monthlyBillPhp) / tariff;

    // Plausibility: implied tariff (from bill + kWh) outside [5,20] is suspect.
    if (input.monthlyBillPhp !== undefined && input.monthlyBillPhp !== null && monthlyKwh > 0) {
      const impliedTariff = Number(input.monthlyBillPhp) / monthlyKwh;
      if (impliedTariff < 5 || impliedTariff > 20) {
        warnings.push(
          `Implied tariff is PHP ${round2(impliedTariff)}/kWh, outside the typical PH range of 5–20.`
        );
      }
    }
  } else if (method === 'devices') {
    const dailyWh = (input.devices || []).reduce((acc, device) => {
      return acc + (Number(device.watts) * Number(device.quantity) * Number(device.hoursPerDay));
    }, 0);
    monthlyKwh = (dailyWh / 1000) * DAYS_PER_MONTH;
  }

  // Zero-consumption guard: a derived load of 0 kWh (e.g. all devices at
  // hoursPerDay:0, or a tiny/empty bill) still sizes to 0 kW and is then clamped
  // UP to MIN_SYSTEM_KW, yielding a billable "phantom" quote. Flag it as a
  // non-blocking warning so it is not silently sized (clamp stays a warning,
  // never an error, per contract).
  if (monthlyKwh <= 0) {
    warnings.push('No energy consumption was derived from the inputs; the quote was sized to the minimum system size.');
  }

  const dailyKwh = monthlyKwh / DAYS_PER_MONTH;
  const systemKw = dailyKwh / (PEAK_SUN_HOURS_PER_DAY * PERFORMANCE_RATIO);
  return { systemKw, monthlyKwh: round2(monthlyKwh), warnings };
}

// ── Validation 2 (OUTPUT cross-check) ───────────────────────────────────────

/**
 * Sanity-clamp the raw computed systemKw into [MIN_SYSTEM_KW, MAX_SYSTEM_KW],
 * recording a warning if a clamp was applied. Does NOT report price/breakdown
 * errors — that is the job of validateOutput, run on the final consistent set.
 * @returns {{ clampedKw: number, warnings: string[], errors: string[] }}
 */
export function clampSystemKw(rawSystemKw) {
  const warnings = [];
  const errors = [];

  if (!isFiniteNumber(rawSystemKw)) {
    errors.push('Computed systemKw is not a finite number.');
    return { clampedKw: MIN_SYSTEM_KW, warnings, errors };
  }

  let clampedKw = rawSystemKw;
  if (rawSystemKw < MIN_SYSTEM_KW) {
    clampedKw = MIN_SYSTEM_KW;
    warnings.push(`Computed system size ${round2(rawSystemKw)} kW is below the minimum; clamped to ${MIN_SYSTEM_KW} kW.`);
  } else if (rawSystemKw > MAX_SYSTEM_KW) {
    clampedKw = MAX_SYSTEM_KW;
    warnings.push(`Computed system size ${round2(rawSystemKw)} kW exceeds the maximum; clamped to ${MAX_SYSTEM_KW} kW.`);
  }

  return { clampedKw, warnings, errors };
}

/**
 * Cross-check the FINAL (already clamped) computed quote for internal
 * consistency. systemKw must be finite & in range; price must equal
 * round(systemKw * PRICE_PER_KW_PHP); breakdown must sum to the total (+/-1).
 * @returns {{ errors: string[], warnings: string[] }}
 */
export function validateOutput({ systemKw, priceTotalPhp, breakdown }) {
  const errors = [];
  const warnings = [];

  if (!isFiniteNumber(systemKw)) {
    errors.push('Computed systemKw is not a finite number.');
    return { errors, warnings };
  }

  if (systemKw < MIN_SYSTEM_KW || systemKw > MAX_SYSTEM_KW) {
    errors.push(`Final systemKw (${systemKw}) is outside [${MIN_SYSTEM_KW}, ${MAX_SYSTEM_KW}].`);
  }

  const expectedPrice = Math.round(round2(systemKw) * PRICE_PER_KW_PHP);
  if (priceTotalPhp !== expectedPrice) {
    errors.push(`priceTotalPhp (${priceTotalPhp}) does not equal round(systemKw * ${PRICE_PER_KW_PHP}) = ${expectedPrice}.`);
  }

  const breakdownSum = (breakdown || []).reduce((acc, item) => acc + (Number(item.amountPhp) || 0), 0);
  if (Math.abs(breakdownSum - priceTotalPhp) > 1) {
    errors.push(`Breakdown sum (${breakdownSum}) does not match priceTotalPhp (${priceTotalPhp}).`);
  }

  return { errors, warnings };
}

// ── Public: computeQuote ─────────────────────────────────────────────────────

/**
 * Compute an indicative dealer quote.
 * @param {'bill'|'kw'|'devices'} method
 * @param {Object} input - method-specific input (see file header)
 * @returns {{
 *   systemKw: number,
 *   priceTotalPhp: number,
 *   breakdown: Array<{label, amountPhp, pct}>,
 *   monthlyKwh?: number,
 *   currency: string,
 *   validation: { valid: boolean, errors: string[], warnings: string[] }
 * }}
 */
export function computeQuote(method, input = {}) {
  const inputCheck = validateInput(method, input);

  // INPUT validation failure => valid:false, no usable numbers (route returns 400).
  if (inputCheck.errors.length) {
    return {
      systemKw: 0,
      priceTotalPhp: 0,
      breakdown: [],
      monthlyKwh: undefined,
      currency: CURRENCY,
      validation: { valid: false, errors: inputCheck.errors, warnings: inputCheck.warnings }
    };
  }

  const sized = sizeFromInput(method, input);
  const rawSystemKw = round2(sized.systemKw);

  // Sanity-clamp the raw kW into [MIN, MAX] (warning if clamped), then compute
  // price + breakdown for the FINAL kW so everything is internally consistent.
  const clamp = clampSystemKw(rawSystemKw);
  const systemKw = round2(clamp.clampedKw);
  const priceTotalPhp = Math.round(systemKw * PRICE_PER_KW_PHP);
  const breakdown = buildBreakdown(priceTotalPhp);

  // Final cross-check on the consistent set.
  const outputCheck = validateOutput({ systemKw, priceTotalPhp, breakdown });

  const warnings = [...sized.warnings, ...clamp.warnings, ...outputCheck.warnings];
  const errors = [...clamp.errors, ...outputCheck.errors];

  return {
    systemKw,
    priceTotalPhp,
    breakdown,
    monthlyKwh: sized.monthlyKwh,
    currency: CURRENCY,
    validation: { valid: errors.length === 0, errors, warnings }
  };
}

// ── Self-test (run with: node src/services/quoteCalc.js) ────────────────────

function runSelfTest() {
  // Lightweight assert so the file stays dependency-free.
  const assert = (cond, msg) => {
    if (!cond) {
      console.error(`❌ FAIL: ${msg}`);
      process.exitCode = 1;
    } else {
      console.log(`✅ ${msg}`);
    }
  };

  // 1) Direct kW: 5 kW -> 250,000 PHP.
  const kw = computeQuote('kw', { systemKw: 5 });
  assert(kw.systemKw === 5, `kw method: systemKw === 5 (got ${kw.systemKw})`);
  assert(kw.priceTotalPhp === 250000, `kw method: priceTotalPhp === 250000 (got ${kw.priceTotalPhp})`);
  assert(kw.validation.valid === true, 'kw method: validation.valid === true');

  // 2) Breakdown sums to the total (within +/-1) and matches percentages.
  const kwSum = kw.breakdown.reduce((acc, item) => acc + item.amountPhp, 0);
  assert(kwSum === 250000, `kw method: breakdown sums to 250000 (got ${kwSum})`);
  assert(kw.breakdown.length === 5, `kw method: 5 breakdown line items (got ${kw.breakdown.length})`);
  assert(
    kw.breakdown.find(b => b.label === 'Solar panels & modules').amountPhp === 112500,
    'kw method: panels line item === 112500 (45%)'
  );

  // 3) Bill example: 5500 PHP at default tariff 11 -> 500 kWh/mo.
  //    dailyKwh = 500/30 = 16.6667; systemKw = 16.6667 / (4.7*0.8=3.76) = 4.4326 -> 4.43.
  const bill = computeQuote('bill', { monthlyBillPhp: 5500 });
  assert(bill.monthlyKwh === 500, `bill method: monthlyKwh === 500 (got ${bill.monthlyKwh})`);
  assert(bill.systemKw === 4.43, `bill method: systemKw === 4.43 (got ${bill.systemKw})`);
  assert(bill.priceTotalPhp === 221500, `bill method: priceTotalPhp === 221500 (got ${bill.priceTotalPhp})`);
  const billSum = bill.breakdown.reduce((acc, item) => acc + item.amountPhp, 0);
  assert(billSum === bill.priceTotalPhp, `bill method: breakdown sums to total (got ${billSum} vs ${bill.priceTotalPhp})`);
  assert(bill.validation.valid === true, 'bill method: validation.valid === true');

  // 4) Devices example: 1 aircon 1500W x 8h -> 12000 Wh/day -> 12 kWh/day -> 360 kWh/mo.
  //    systemKw = (360/30) / 3.76 = 12/3.76 = 3.1915 -> 3.19.
  const devices = computeQuote('devices', {
    devices: [{ name: 'Aircon', watts: 1500, quantity: 1, hoursPerDay: 8 }]
  });
  assert(devices.monthlyKwh === 360, `devices method: monthlyKwh === 360 (got ${devices.monthlyKwh})`);
  assert(devices.systemKw === 3.19, `devices method: systemKw === 3.19 (got ${devices.systemKw})`);
  assert(devices.validation.valid === true, 'devices method: validation.valid === true');

  // 5) INPUT validation failure -> valid:false.
  const bad = computeQuote('kw', { systemKw: 0.1 });
  assert(bad.validation.valid === false, 'kw method: systemKw 0.1 -> validation.valid === false');
  assert(bad.validation.errors.length > 0, 'kw method: out-of-range produces an error message');

  // 6) Clamp warning: a tiny bill that sizes below MIN_SYSTEM_KW -> clamp to 1 kW + warning.
  const tiny = computeQuote('bill', { monthlyKwh: 50 });
  // 50/30 = 1.6667; /3.76 = 0.4433 -> below MIN 1 -> clamp.
  assert(tiny.systemKw === 1, `bill method: tiny load clamped to 1 kW (got ${tiny.systemKw})`);
  assert(tiny.priceTotalPhp === 50000, `bill method: clamped price === 50000 (got ${tiny.priceTotalPhp})`);
  assert(tiny.validation.warnings.length > 0, 'bill method: clamp produces a warning');
  assert(tiny.validation.valid === true, 'bill method: clamp is a warning, not an error');

  // 7) Zero-consumption phantom guard: a device list that consumes nothing
  //    (hoursPerDay:0) sizes to 0 kW, clamps to 1 kW, and must carry both a
  //    "no consumption" warning and the clamp warning while staying valid.
  const phantom = computeQuote('devices', {
    devices: [{ name: 'Idle', watts: 1000, quantity: 1, hoursPerDay: 0 }]
  });
  assert(phantom.systemKw === 1, `devices method: zero-load clamped to 1 kW (got ${phantom.systemKw})`);
  assert(phantom.priceTotalPhp === 50000, `devices method: zero-load price === 50000 (got ${phantom.priceTotalPhp})`);
  assert(
    phantom.validation.warnings.some(w => /No energy consumption/i.test(w)),
    'devices method: zero-load surfaces a "no consumption" warning'
  );
  assert(phantom.validation.valid === true, 'devices method: zero-load stays valid (warning, not error)');

  if (process.exitCode) {
    console.error('\nSELF-TEST FAILED');
  } else {
    console.log('\nALL QUOTE-CALC SELF-TESTS PASSED');
  }
}

// Run the self-test only when executed directly (not when imported).
const isMain = (() => {
  try {
    return import.meta.url === `file://${process.argv[1]}`;
  } catch {
    return false;
  }
})();

if (isMain) {
  runSelfTest();
}
