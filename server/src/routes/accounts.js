import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, validate } from '../lib/http.js';
import { requireAuth } from '../middleware/auth.js';
import { toPoisha } from '../lib/money.js';

const router = Router();
router.use(requireAuth);

const createSchema = z.object({
  label: z.string().min(1),
  accountNumber: z.string().regex(/^01[0-9]{9}$/, 'must be a valid BD mobile number'),
  openingBalance: z.number().nonnegative().default(0),
});

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const accounts = await prisma.bkashAccount.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ accounts });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = validate(createSchema, req.body, res);
    if (!data) return;

    const dup = await prisma.bkashAccount.findUnique({
      where: {
        userId_accountNumber: {
          userId: req.userId,
          accountNumber: data.accountNumber,
        },
      },
    });
    if (dup) return res.status(409).json({ error: 'account number already added' });

    const account = await prisma.bkashAccount.create({
      data: {
        userId: req.userId,
        label: data.label,
        accountNumber: data.accountNumber,
        currentBalance: toPoisha(data.openingBalance),
      },
    });
    res.status(201).json({ account });
  })
);

const balanceSchema = z.object({ balance: z.number().nonnegative() });

// Set the authoritative current balance (used at setup time, before the first
// SMS arrives, so reconciliation has a correct starting point).
router.put(
  '/:id/balance',
  asyncHandler(async (req, res) => {
    const data = validate(balanceSchema, req.body, res);
    if (!data) return;
    const account = await prisma.bkashAccount.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!account) return res.status(404).json({ error: 'not found' });

    const updated = await prisma.bkashAccount.update({
      where: { id: account.id },
      data: { currentBalance: toPoisha(data.balance) },
    });
    res.json({ account: updated });
  })
);

export default router;
