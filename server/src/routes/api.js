import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, validate } from '../lib/http.js';
import { requireApiKey } from '../middleware/auth.js';
import { toPoisha, toTaka } from '../lib/money.js';
import { paymentReference } from '../lib/tokens.js';
import { config } from '../lib/config.js';

// Merchant-facing integration API. Authenticated with pk/sk credentials.
const router = Router();
router.use(requireApiKey);

const createSchema = z.object({
  bkashAccountId: z.string().optional(),
  amount: z.number().positive(),
  orderId: z.string().optional(),
  expectedSenderPhone: z.string().regex(/^01[0-9]{9}$/).optional(),
  customerName: z.string().optional(),
  description: z.string().optional(),
  callbackUrl: z.string().url().optional(),
});

// Create a payment request; returns a hosted checkout URL.
router.post(
  '/payments',
  asyncHandler(async (req, res) => {
    const data = validate(createSchema, req.body, res);
    if (!data) return;

    const account = data.bkashAccountId
      ? await prisma.bkashAccount.findFirst({
          where: { id: data.bkashAccountId, userId: req.userId, isActive: true },
        })
      : await prisma.bkashAccount.findFirst({
          where: { userId: req.userId, isActive: true },
          orderBy: { createdAt: 'asc' },
        });
    if (!account) return res.status(400).json({ error: 'no usable bKash account' });

    const payment = await prisma.paymentRequest.create({
      data: {
        userId: req.userId,
        bkashAccountId: account.id,
        reference: paymentReference(),
        amount: toPoisha(data.amount),
        orderId: data.orderId,
        expectedSenderPhone: data.expectedSenderPhone,
        customerName: data.customerName,
        description: data.description,
        callbackUrl: data.callbackUrl,
        expiresAt: new Date(Date.now() + config.paymentTtlMinutes * 60_000),
      },
    });

    res.status(201).json(serialize(payment, account));
  })
);

router.get(
  '/payments/:reference',
  asyncHandler(async (req, res) => {
    const payment = await prisma.paymentRequest.findFirst({
      where: { reference: req.params.reference, userId: req.userId },
      include: { bkashAccount: true, matchedTx: { select: { trxId: true } } },
    });
    if (!payment) return res.status(404).json({ error: 'not found' });
    res.json({ ...serialize(payment, payment.bkashAccount), trxId: payment.matchedTx?.trxId });
  })
);

function serialize(payment, account) {
  return {
    reference: payment.reference,
    status: payment.status,
    orderId: payment.orderId,
    amount: toTaka(payment.amount),
    payTo: account.accountNumber,
    expectedSenderPhone: payment.expectedSenderPhone,
    payerPhone: payment.payerPhone,
    checkoutUrl: `${config.webOrigin}/pay/${payment.reference}`,
    expiresAt: payment.expiresAt,
    completedAt: payment.completedAt,
  };
}

export default router;
