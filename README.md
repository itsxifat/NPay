# NPay — Automated bKash Payment Verification

NPay verifies mobile-wallet payments **automatically** by reading the payment
SMS on a phone, reconciling it against the wallet's tracked balance, and
matching the confirmed transaction to a checkout — so a payment is marked
successful the instant the money truly lands. No manual checking, no fake
screenshots.

> Currently supports **bKash**. Nagad support is designed for behind a provider
> switch in the SMS parser. Not affiliated with or endorsed by bKash.

## How it works

```
 ┌────────────┐   send money    ┌──────────────┐
 │   Payer    │ ──────────────► │ Merchant's   │
 │ (bKash app)│                 │ bKash wallet │
 └────────────┘                 └──────┬───────┘
                                       │ payment SMS
                                       ▼
                              ┌──────────────────┐
                              │  NPay Android app│  (default SMS app)
                              │  captures + POSTs│
                              └────────┬─────────┘
                                       │ /api/ingest/sms  (x-device-key)
                                       ▼
                              ┌──────────────────┐
                              │   NPay server    │
                              │ 1. parse SMS     │
                              │ 2. reconcile bal.│  storedBal + amount − fee
                              │ 3. verify txn    │      == reportedBal ?
                              │ 4. match payment │
                              └────────┬─────────┘
                            ┌──────────┴──────────┐
                            ▼                     ▼
                   ┌────────────────┐   ┌──────────────────┐
                   │ Merchant       │   │ Payer checkout   │
                   │ dashboard +    │   │ page flips to    │
                   │ webhook fired  │   │ "Successful ✓"   │
                   └────────────────┘   └──────────────────┘
```

### The verification logic (the security core)

For every incoming payment SMS the server recomputes the expected new balance
from the **stored** balance:

```
storedBalance + receivedAmount − fee  ==  balanceReportedInSms ?
```

- **Match** → the transaction is `VERIFIED`; `trxId`, `senderPhone`, and
  `amount` are trusted, and the stored balance advances.
- **Mismatch** (missed/out-of-order SMS, tampering) → recorded as
  `UNRECONCILED` and flagged; it **cannot** complete a payment.

A `VERIFIED` transaction then auto-completes the oldest matching `PENDING`
payment on that wallet (same amount, and payer phone if the merchant specified
one). Both merchant (webhook + dashboard) and payer (live checkout page) are
notified instantly.

## Repository layout

| Path       | What it is |
|------------|------------|
| `server/`  | Node.js + Express + Prisma (SQLite) API — the reconciliation & matching engine, dashboard API, integration API, hosted checkout, Socket.IO |
| `web/`     | React + Vite + Tailwind merchant dashboard and public checkout page |
| `android/` | Kotlin + Jetpack Compose app that becomes the default SMS handler and forwards bKash SMS |

## Quick start

### 1. Server

```bash
cd server
cp .env.example .env          # adjust JWT_SECRET etc.
npm install
npx prisma generate
npx prisma db push
npm run db:seed               # demo merchant + account + device + API key
npm run dev                   # http://localhost:4000
```

The seed prints a demo login, a device key, and API credentials. The demo
account opens at a 37.15 Tk balance so the sample SMS reconciles exactly.

### 2. Web dashboard

```bash
cd web
npm install
npm run dev                   # http://localhost:5173  (proxies /api to :4000)
```

Sign in with `demo@npay.test` / `password123`.

### 3. Android app

Open `android/` in Android Studio (or build with the included Gradle wrapper
once the Android SDK is configured):

```bash
cd android
./gradlew assembleDebug       # app/build/outputs/apk/debug/app-debug.apk
```

On the phone: enter the **server URL** and the **device key** from
_Dashboard → Devices → Enroll device_, then tap **Set NPay as default SMS
app**. Every SMS now flows to NPay; bKash payment messages are forwarded and
verified automatically.

## End-to-end demo (no phone required)

With the server running you can replay the sample SMS over HTTP to see the full
flow — create a payment, post the SMS, watch it verify and complete. See the
flow test in `server/` or:

```bash
curl -X POST http://localhost:4000/api/ingest/sms \
  -H "x-device-key: <device key from seed>" \
  -H "Content-Type: application/json" \
  -d '{"sender":"bKash","body":"You have received Tk 3,000.00 from 01540110050. Ref . Fee Tk 0.00. Balance Tk 3,037.15. TrxID DGL3KX8M7D at 21/07/2026 14:50"}'
```

## Integration API

Create a payment and redirect your customer to the returned `checkoutUrl`:

```bash
curl -X POST http://localhost:4000/v1/payments \
  -H "Authorization: Bearer pk_xxx:sk_xxx" \
  -H "Content-Type: application/json" \
  -d '{"amount":3000,"orderId":"ORDER-1042","expectedSenderPhone":"01540110050","callbackUrl":"https://yourstore.com/webhooks/npay"}'
```

When the matching SMS is verified, NPay completes the payment and POSTs a
`payment.completed` event to your `callbackUrl`.

## Security notes

- Money is stored as integer **poisha** to avoid floating-point drift.
- Device keys, API secrets, and passwords are never returned after creation
  (secrets are bcrypt-hashed); the checkout reference is an unguessable token.
- Reconciliation gates verification, so a spoofed forwarded SMS that doesn't
  match the tracked balance cannot complete a payment.
- Set a strong `JWT_SECRET` and serve over HTTPS in production; SQLite is fine
  for a pilot but swap `datasource` to Postgres for scale.
