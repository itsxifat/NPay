import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, validate } from '../lib/http.js';
import { requireAuth } from '../middleware/auth.js';
import { deviceApiKey } from '../lib/tokens.js';

const router = Router();
router.use(requireAuth);

const createSchema = z.object({
  name: z.string().min(1),
  bkashAccountId: z.string().optional(),
});

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const devices = await prisma.device.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'asc' },
      include: { bkashAccount: { select: { label: true, accountNumber: true } } },
    });
    // Never expose the raw apiKey after creation; show a masked hint.
    res.json({
      devices: devices.map((d) => ({
        ...d,
        apiKey: `${d.apiKey.slice(0, 8)}…`,
      })),
    });
  })
);

// Returns the full apiKey exactly once, at creation time, to enroll the phone.
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = validate(createSchema, req.body, res);
    if (!data) return;

    if (data.bkashAccountId) {
      const acct = await prisma.bkashAccount.findFirst({
        where: { id: data.bkashAccountId, userId: req.userId },
      });
      if (!acct) return res.status(400).json({ error: 'unknown bKash account' });
    }

    const device = await prisma.device.create({
      data: {
        userId: req.userId,
        name: data.name,
        bkashAccountId: data.bkashAccountId,
        apiKey: deviceApiKey(),
      },
    });
    res.status(201).json({ device });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const device = await prisma.device.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!device) return res.status(404).json({ error: 'not found' });
    await prisma.device.update({
      where: { id: device.id },
      data: { isActive: false },
    });
    res.json({ ok: true });
  })
);

export default router;
