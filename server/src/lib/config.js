import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? 'dev-insecure-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  webOrigin: process.env.WEB_ORIGIN ?? 'http://localhost:5173',
  paymentTtlMinutes: Number(process.env.PAYMENT_TTL_MINUTES ?? 30),
};
