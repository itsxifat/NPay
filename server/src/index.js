import http from 'node:http';
import express from 'express';
import cors from 'cors';
import { config } from './lib/config.js';
import { initRealtime } from './lib/realtime.js';
import { expireStalePayments } from './services/paymentMatcher.js';

import authRoutes from './routes/auth.js';
import accountRoutes from './routes/accounts.js';
import deviceRoutes from './routes/devices.js';
import ingestRoutes from './routes/ingest.js';
import transactionRoutes from './routes/transactions.js';
import paymentRoutes from './routes/payments.js';
import apiKeyRoutes from './routes/apikeys.js';
import apiRoutes from './routes/api.js';
import checkoutRoutes from './routes/checkout.js';

const app = express();
app.use(cors({ origin: config.webOrigin, credentials: true }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

// Dashboard (session JWT) routes.
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/keys', apiKeyRoutes);

// Device ingestion (x-device-key).
app.use('/api/ingest', ingestRoutes);

// Public integration API (pk/sk) and public checkout.
app.use('/v1', apiRoutes);
app.use('/checkout', checkoutRoutes);

// Central error handler.
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[error]', err);
  res.status(500).json({ error: 'internal error' });
});

const server = http.createServer(app);
initRealtime(server);

// Sweep expired payments every minute.
setInterval(() => {
  expireStalePayments().catch((e) => console.error('[expire]', e.message));
}, 60_000).unref();

server.listen(config.port, () => {
  console.log(`NPay server listening on http://localhost:${config.port}`);
});
