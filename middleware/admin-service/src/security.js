import net from 'node:net';

const minuteBuckets = new Map();

export function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for']?.split(',')[0]?.trim();
  return forwarded || req.ip || req.socket?.remoteAddress || 'unknown';
}

export function rateLimit({ windowMs = 60_000, max = 20, keyPrefix = 'default' } = {}) {
  return (req, res, next) => {
    const now = Date.now();
    const ip = getClientIp(req);
    const bucketKey = `${keyPrefix}:${ip}`;
    const bucket = minuteBuckets.get(bucketKey);

    if (!bucket || bucket.resetAt <= now) {
      minuteBuckets.set(bucketKey, { count: 1, resetAt: now + windowMs });
      return next();
    }

    bucket.count += 1;
    if (bucket.count > max) {
      res.setHeader('Retry-After', Math.ceil((bucket.resetAt - now) / 1000));
      return res.status(429).json({ success: false, error: 'Rate limit exceeded', code: 'RATE_LIMITED' });
    }

    next();
  };
}

export function ipAllowlist() {
  const entries = (process.env.ADMIN_ALLOWED_CIDRS || '')
    .split(',')
    .map(entry => entry.trim())
    .filter(Boolean);

  return (req, res, next) => {
    if (!entries.length) return next();

    const ip = normalizeIp(getClientIp(req));
    const allowed = entries.some(entry => ipMatches(ip, entry));
    if (!allowed) {
      return res.status(403).json({ success: false, error: 'IP address is not allowed', code: 'IP_NOT_ALLOWED' });
    }
    next();
  };
}

function normalizeIp(ip) {
  if (ip?.startsWith('::ffff:')) return ip.slice('::ffff:'.length);
  return ip;
}

function ipMatches(ip, entry) {
  if (entry === ip) return true;
  if (!entry.includes('/')) return false;
  if (net.isIP(ip) !== 4) return entry === '::1/128' && ip === '::1';

  const [base, maskLengthRaw] = entry.split('/');
  const maskLength = Number.parseInt(maskLengthRaw, 10);
  if (net.isIP(base) !== 4 || Number.isNaN(maskLength) || maskLength < 0 || maskLength > 32) return false;

  const mask = maskLength === 0 ? 0 : (0xffffffff << (32 - maskLength)) >>> 0;
  return (ipv4ToInt(ip) & mask) === (ipv4ToInt(base) & mask);
}

function ipv4ToInt(ip) {
  return ip.split('.').reduce((acc, octet) => ((acc << 8) + Number.parseInt(octet, 10)) >>> 0, 0);
}
