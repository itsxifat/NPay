import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { customAlphabet } from 'nanoid';
import { config } from './config.js';

const alnum = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  32
);
const short = customAlphabet('0123456789ABCDEFGHJKMNPQRSTVWXYZ', 12);

export function signJwt(payload) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

export function verifyJwt(token) {
  return jwt.verify(token, config.jwtSecret);
}

export const hashPassword = (pw) => bcrypt.hash(pw, 10);
export const checkPassword = (pw, hash) => bcrypt.compare(pw, hash);

export const deviceApiKey = () => `dev_${alnum()}`;
export const publicApiKey = () => `pk_${alnum()}`;
export const secretApiKey = () => `sk_${alnum()}`;
export const paymentReference = () => `pay_${short()}`;
