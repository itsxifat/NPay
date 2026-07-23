import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, validate } from '../lib/http.js';
import { requireDevice } from '../middleware/auth.js';
import { ingestSms } from '../services/reconciliation.js';

const router = Router();

const smsSchema = z.object({
  sender: z.string().optional(),
  body: z.string().min(1),
  receivedAt: z.union([z.string(), z.number()]).optional(),
});

const batchSchema = z.object({ messages: z.array(smsSchema).min(1).max(50) });

// Android app posts each captured SMS here, authenticated by x-device-key.
router.post(
  '/sms',
  requireDevice,
  asyncHandler(async (req, res) => {
    const data = validate(smsSchema, req.body, res);
    if (!data) return;
    const result = await ingestSms({ device: req.device, ...data });
    res.status(201).json(result);
  })
);

// Batch endpoint so the app can flush a backlog after being offline.
router.post(
  '/sms/batch',
  requireDevice,
  asyncHandler(async (req, res) => {
    const data = validate(batchSchema, req.body, res);
    if (!data) return;
    const results = [];
    for (const msg of data.messages) {
      results.push(await ingestSms({ device: req.device, ...msg }));
    }
    res.status(201).json({ results });
  })
);

export default router;
