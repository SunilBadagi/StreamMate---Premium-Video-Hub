import crypto from 'crypto';
import { VerifyPaymentRequest } from '../types';

export function verifyPaymentSignature(
  { order_id, payment_id, signature }: VerifyPaymentRequest,
  secret: string
): boolean {
  const text = `${order_id}|${payment_id}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(text)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}