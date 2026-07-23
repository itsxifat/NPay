import { prisma } from '../lib/prisma.js';
import { getIo } from '../lib/realtime.js';

/**
 * Try to complete a PENDING payment request using a freshly VERIFIED
 * transaction. A payment matches when, on the same bKash account:
 *   - amounts are equal,
 *   - the payment is still PENDING and unexpired,
 *   - and, if the merchant specified an expected payer phone, it matches.
 *
 * The oldest matching request wins so payers are served in order. On a match
 * we mark the payment COMPLETED, notify listeners in real time, and fire the
 * merchant webhook.
 */
export async function tryMatchPayments(transaction) {
  const now = new Date();

  const candidate = await prisma.paymentRequest.findFirst({
    where: {
      bkashAccountId: transaction.bkashAccountId,
      status: 'PENDING',
      amount: transaction.amount,
      expiresAt: { gt: now },
      matchedTxId: null,
      OR: [
        { expectedSenderPhone: null },
        { expectedSenderPhone: transaction.senderPhone },
      ],
    },
    orderBy: { createdAt: 'asc' },
  });

  if (!candidate) return null;

  const completed = await prisma.paymentRequest.update({
    where: { id: candidate.id },
    data: {
      status: 'COMPLETED',
      matchedTxId: transaction.id,
      payerPhone: transaction.senderPhone,
      completedAt: now,
    },
    include: { bkashAccount: true },
  });

  notifyPayment(completed);
  fireWebhook(completed, transaction).catch((err) =>
    console.error('[webhook] failed', completed.reference, err.message)
  );

  return completed;
}

/** Expire stale pending payments. Called periodically. */
export async function expireStalePayments() {
  const { count } = await prisma.paymentRequest.updateMany({
    where: { status: 'PENDING', expiresAt: { lt: new Date() } },
    data: { status: 'EXPIRED' },
  });
  return count;
}

function notifyPayment(payment) {
  const io = getIo();
  if (!io) return;
  const view = {
    reference: payment.reference,
    status: payment.status,
    amount: payment.amount,
    payerPhone: payment.payerPhone,
    completedAt: payment.completedAt,
  };
  io.to(`payment:${payment.reference}`).emit('payment:update', view);
  io.to(`user:${payment.userId}`).emit('payment:update', view);
}

async function fireWebhook(payment, transaction) {
  if (!payment.callbackUrl) return;
  const res = await fetch(payment.callbackUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      event: 'payment.completed',
      reference: payment.reference,
      orderId: payment.orderId,
      amount: payment.amount,
      payerPhone: payment.payerPhone,
      trxId: transaction.trxId,
      completedAt: payment.completedAt,
    }),
  });
  if (!res.ok) throw new Error(`status ${res.status}`);
}
