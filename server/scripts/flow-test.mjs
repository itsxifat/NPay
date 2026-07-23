// End-to-end smoke test of the verification flow against a running server.
//   1. start the server (npm run dev) and seed it (npm run db:seed)
//   2. node scripts/flow-test.mjs
//
// Logs in as the demo merchant, enrolls a fresh device, creates a payment
// expecting 3,000 Tk, replays the sample bKash SMS, and asserts the payment
// auto-completes.

const BASE = process.env.BASE ?? 'http://localhost:4000';
const j = (r) => r.json();
const post = (p, body, headers = {}) =>
  fetch(BASE + p, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  }).then(j);
const get = (p, headers = {}) => fetch(BASE + p, { headers }).then(j);

const { token } = await post('/api/auth/login', { email: 'demo@npay.test', password: 'password123' });
if (!token) throw new Error('login failed — did you run `npm run db:seed`?');
const auth = { authorization: `Bearer ${token}` };

const { accounts } = await get('/api/accounts', auth);
const account = accounts[0];

// Use a unique payer number per run so this test's payment is the only one a
// transaction from that number can match (payments FIFO-match by amount, and
// tighten by payer phone when set) — keeps the test deterministic across runs.
const payer = '017' + String(Math.floor(Math.random() * 1e8)).padStart(8, '0');

const { device } = await post('/api/devices', { name: 'flow-test phone', bkashAccountId: account.id }, auth);
const { payment } = await post(
  '/api/payments',
  { bkashAccountId: account.id, amount: 3000, expectedSenderPhone: payer, orderId: 'FLOW-TEST' },
  auth
);
console.log('payment created:', payment.reference, payment.status);

// Build an SMS that reconciles against the account's *current* balance, with a
// fresh trxId, so the test passes no matter how many times it has run before.
const fmt = (poisha) =>
  (poisha / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const balanceAfter = account.currentBalance + 300000; // + 3,000.00 Tk in poisha
const trxId = Array.from({ length: 10 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 34)]).join('');
const sms = `You have received Tk 3,000.00 from ${payer}. Ref . Fee Tk 0.00. Balance Tk ${fmt(balanceAfter)}. TrxID ${trxId} at 21/07/2026 14:50`;

const ingest = await post('/api/ingest/sms', { sender: 'bKash', body: sms }, { 'x-device-key': device.apiKey });
console.log('ingest:', ingest.status, '| tx:', ingest.transaction?.status, '| matched:', ingest.payment?.status ?? 'none');

const co = await get('/checkout/' + payment.reference);
console.log('checkout:', co.status, '| payer:', co.payerPhone);

if (co.status !== 'COMPLETED') {
  console.error('FAIL: expected COMPLETED');
  process.exit(1);
}
console.log('\n✅ PASS — payment verified and completed end to end.');
