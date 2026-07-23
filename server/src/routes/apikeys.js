import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, validate } from '../lib/http.js';
import { requireAuth } from '../middleware/auth.js';
import { publicApiKey, secretApiKey, hashPassword } from '../lib/tokens.js';

const router = Router();
router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const keys = await prisma.apiKey.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, label: true, publicKey: true, lastUsedAt: true, createdAt: true },
    });
    res.json({ keys });
  })
);

// Returns the secret exactly once.
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = validate(z.object({ label: z.string().min(1) }), req.body, res);
    if (!data) return;

    const publicKey = publicApiKey();
    const secret = secretApiKey();
    const key = await prisma.apiKey.create({
      data: {
        userId: req.userId,
        label: data.label,
        publicKey,
        secretHash: await hashPassword(secret),
      },
    });
    res.status(201).json({
      id: key.id,
      label: key.label,
      publicKey,
      secretKey: secret,
      note: 'Store the secret now — it will not be shown again.',
    });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const key = await prisma.apiKey.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!key) return res.status(404).json({ error: 'not found' });
    await prisma.apiKey.delete({ where: { id: key.id } });
    res.json({ ok: true });
  })
);

export default router;
