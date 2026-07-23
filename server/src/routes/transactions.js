import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../lib/http.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const accounts = await prisma.bkashAccount.findMany({
      where: { userId: req.userId },
      select: { id: true },
    });
    const accountIds = accounts.map((a) => a.id);

    const transactions = await prisma.transaction.findMany({
      where: { bkashAccountId: { in: accountIds } },
      orderBy: { occurredAt: 'desc' },
      take: 100,
      include: {
        payment: { select: { reference: true, orderId: true } },
        bkashAccount: { select: { label: true, accountNumber: true } },
      },
    });
    res.json({ transactions });
  })
);

router.get(
  '/stats',
  asyncHandler(async (req, res) => {
    const accounts = await prisma.bkashAccount.findMany({
      where: { userId: req.userId },
      select: { id: true, currentBalance: true },
    });
    const accountIds = accounts.map((a) => a.id);
    const totalBalance = accounts.reduce((s, a) => s + a.currentBalance, 0);

    const [verified, unreconciled, received, completedPayments] = await Promise.all([
      prisma.transaction.count({
        where: { bkashAccountId: { in: accountIds }, status: 'VERIFIED' },
      }),
      prisma.transaction.count({
        where: { bkashAccountId: { in: accountIds }, status: 'UNRECONCILED' },
      }),
      prisma.transaction.aggregate({
        where: { bkashAccountId: { in: accountIds }, status: 'VERIFIED' },
        _sum: { amount: true },
      }),
      prisma.paymentRequest.count({
        where: { userId: req.userId, status: 'COMPLETED' },
      }),
    ]);

    res.json({
      totalBalance,
      verifiedCount: verified,
      unreconciledCount: unreconciled,
      totalReceived: received._sum.amount ?? 0,
      completedPayments,
    });
  })
);

export default router;
