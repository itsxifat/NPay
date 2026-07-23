import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, validate } from '../lib/http.js';
import { hashPassword, checkPassword, signJwt } from '../lib/tokens.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  businessName: z.string().optional(),
});

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const data = validate(registerSchema, req.body, res);
    if (!data) return;

    const exists = await prisma.user.findUnique({ where: { email: data.email } });
    if (exists) return res.status(409).json({ error: 'email already registered' });

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        businessName: data.businessName,
        passwordHash: await hashPassword(data.password),
      },
    });
    const token = signJwt({ sub: user.id });
    res.status(201).json({ token, user: publicUser(user) });
  })
);

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const data = validate(loginSchema, req.body, res);
    if (!data) return;

    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user || !(await checkPassword(data.password, user.passwordHash))) {
      return res.status(401).json({ error: 'invalid credentials' });
    }
    const token = signJwt({ sub: user.id });
    res.json({ token, user: publicUser(user) });
  })
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ error: 'not found' });
    res.json({ user: publicUser(user) });
  })
);

function publicUser(u) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    businessName: u.businessName,
    createdAt: u.createdAt,
  };
}

export default router;
