import { toPoisha } from './money.js';

// Parsers for the different bKash SMS templates. Each returns a normalized
// object or null if the template does not match. Add Nagad templates here
// later behind a provider switch.

const AMOUNT = '([\\d,]+(?:\\.\\d{1,2})?)';
const PHONE = '(01[0-9]{9})';
const TRXID = '([A-Z0-9]{10})';

// "You have received Tk 3,000.00 from 01540110050. Ref . Fee Tk 0.00.
//  Balance Tk 3,037.15. TrxID DGL3KX8M7D at 21/07/2026 14:50"
const RECEIVED = new RegExp(
  `received\\s+Tk\\s+${AMOUNT}\\s+from\\s+${PHONE}.*?` +
    `Fee\\s+Tk\\s+${AMOUNT}.*?` +
    `Balance\\s+Tk\\s+${AMOUNT}.*?` +
    `TrxID\\s+${TRXID}` +
    `(?:\\s+at\\s+(\\d{2}/\\d{2}/\\d{4}\\s+\\d{2}:\\d{2}))?`,
  'i'
);

// dd/mm/yyyy HH:MM -> Date (bKash timestamps are Asia/Dhaka, UTC+6).
function parseBkashDate(raw) {
  if (!raw) return new Date();
  const m = raw.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);
  if (!m) return new Date();
  const [, dd, mm, yyyy, HH, MM] = m;
  // Build an ISO string with the +06:00 offset so it is unambiguous.
  return new Date(`${yyyy}-${mm}-${dd}T${HH}:${MM}:00+06:00`);
}

/**
 * Parse a raw bKash SMS body into a normalized transaction descriptor.
 * @returns {{
 *   type: 'RECEIVED', amount: number, fee: number, senderPhone: string,
 *   balanceAfter: number, trxId: string, occurredAt: Date
 * } | null}
 */
export function parseBkashSms(body) {
  if (!body) return null;
  const text = String(body).replace(/\s+/g, ' ').trim();

  const r = text.match(RECEIVED);
  if (r) {
    const [, amount, senderPhone, fee, balance, trxId, at] = r;
    return {
      type: 'RECEIVED',
      amount: toPoisha(amount),
      fee: toPoisha(fee),
      senderPhone,
      balanceAfter: toPoisha(balance),
      trxId,
      occurredAt: parseBkashDate(at),
    };
  }

  return null;
}
