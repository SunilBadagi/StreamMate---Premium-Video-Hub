import { z } from 'zod';

// Request validation schemas
export const createOrderSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().default('INR')
});

export const verifyPaymentSchema = z.object({
  payment_id: z.string(),
  order_id: z.string(),
  signature: z.string()
});

// TypeScript types
export type CreateOrderRequest = z.infer<typeof createOrderSchema>;
export type VerifyPaymentRequest = z.infer<typeof verifyPaymentSchema>;

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  status: string;
}

export interface PaymentVerificationResponse {
  success: boolean;
  message?: string;
}