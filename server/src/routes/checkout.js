import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../lib/http.js';
import { toTaka } from '../lib/money.js';

// Public checkout: what the payer's browser sees. No auth — the reference is
// an unguessable token. Never leaks merchant internals.
const router = Router();

router.get(
  '/:reference',
  asyncHandler(async (req, res) => {
    const payment = await prisma.paymentRequest.findUnique({
      where: { reference: req.params.reference },
      include: {
        bkashAccount: { select: { accountNumber: true, label: true } },
        user: { select: { businessName: true, name: true } },
      },
    });
    if (!payment) return res.status(404).json({ error: 'not found' });

    // Lazily expire on read.
    let status = payment.status;
    if (status === 'PENDING' && payment.expiresAt < new Date()) {
      await prisma.paymentRequest.update({
        where: { id: payment.id },
        data: { status: 'EXPIRED' },
      });
      status = 'EXPIRED';
    }

    res.json({
      reference: payment.reference,
      status,
      amount: toTaka(payment.amount),
      description: payment.description,
      payTo: payment.bkashAccount.accountNumber,
      merchant: payment.user.businessName ?? payment.user.name,
      expectedSenderPhone: payment.expectedSenderPhone,
      payerPhone: payment.payerPhone,
      expiresAt: payment.expiresAt,
      completedAt: payment.completedAt,
    });
  })
);

export default router;
