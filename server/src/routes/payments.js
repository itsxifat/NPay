import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, validate } from '../lib/http.js';
import { requireAuth } from '../middleware/auth.js';
import { toPoisha } from '../lib/money.js';
import { paymentReference } from '../lib/tokens.js';
import { config } from '../lib/config.js';

const router = Router();
router.use(requireAuth);

const createSchema = z.object({
  bkashAccountId: z.string(),
  amount: z.number().positive(),
  orderId: z.string().optional(),
  expectedSenderPhone: z.string().regex(/^01[0-9]{9}$/).optional(),
  customerName: z.string().optional(),
  description: z.string().optional(),
  callbackUrl: z.string().url().optional(),
});

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const payments = await prisma.paymentRequest.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { matchedTx: { select: { trxId: true } } },
    });
    res.json({ payments });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = validate(createSchema, req.body, res);
    if (!data) return;

    const account = await prisma.bkashAccount.findFirst({
      where: { id: data.bkashAccountId, userId: req.userId },
    });
    if (!account) return res.status(400).json({ error: 'unknown bKash account' });

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
    res.status(201).json({ payment });
  })
);

router.post(
  '/:id/cancel',
  asyncHandler(async (req, res) => {
    const payment = await prisma.paymentRequest.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!payment) return res.status(404).json({ error: 'not found' });
    if (payment.status !== 'PENDING') {
      return res.status(409).json({ error: `cannot cancel a ${payment.status} payment` });
    }
    const updated = await prisma.paymentRequest.update({
      where: { id: payment.id },
      data: { status: 'CANCELLED' },
    });
    res.json({ payment: updated });
  })
);

export default router;
