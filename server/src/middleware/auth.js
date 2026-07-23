import { verifyJwt } from '../lib/tokens.js';
import { prisma } from '../lib/prisma.js';
import { checkPassword } from '../lib/tokens.js';

/** Require a logged-in merchant (dashboard/session JWT). */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'missing token' });
  try {
    const payload = verifyJwt(token);
    req.userId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ error: 'invalid token' });
  }
}

/** Require a valid device apiKey (SMS ingestion from the Android app). */
export async function requireDevice(req, res, next) {
  const key = req.headers['x-device-key'];
  if (!key) return res.status(401).json({ error: 'missing device key' });
  const device = await prisma.device.findUnique({ where: { apiKey: String(key) } });
  if (!device || !device.isActive) {
    return res.status(401).json({ error: 'invalid device key' });
  }
  req.device = device;
  next();
}

/**
 * Require merchant API credentials (integration API). Sent as
 *   Authorization: Bearer pk_xxx:sk_xxx
 */
export async function requireApiKey(req, res, next) {
  const header = req.headers.authorization ?? '';
  const raw = header.startsWith('Bearer ') ? header.slice(7) : header;
  const [publicKey, secret] = raw.split(':');
  if (!publicKey || !secret) {
    return res.status(401).json({ error: 'missing api credentials' });
  }
  const apiKey = await prisma.apiKey.findUnique({ where: { publicKey } });
  if (!apiKey || !(await checkPassword(secret, apiKey.secretHash))) {
    return res.status(401).json({ error: 'invalid api credentials' });
  }
  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  });
  req.userId = apiKey.userId;
  next();
}
