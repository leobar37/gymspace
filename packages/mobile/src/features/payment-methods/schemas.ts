import { z } from 'zod';

// Base metadata schema
export const paymentMethodMetadataSchema = z.object({
  type: z.string(),
  country: z.string(),
  phoneNumber: z.string().optional(),
  accountName: z.string().optional(),
  qrImageId: z.string().optional(),
  instructions: z.string().optional(),
});

// Mobile payment specific metadata (for Yape, Plin, etc.)
export const mobilePaymentMetadataSchema = paymentMethodMetadataSchema.extend({
  type: z.string(),
  phoneNumber: z.string(),
  accountName: z.string(),
  qrImageId: z.string().optional(),
});

// Card payment specific metadata
export const cardPaymentMetadataSchema = paymentMethodMetadataSchema.extend({
  type: z.string(),
  provider: z.string().optional(),
  terminalId: z.string().optional(),
});

// Cash payment specific metadata
export const cashPaymentMetadataSchema = paymentMethodMetadataSchema.extend({
  type: z.string(),
});

// Custom payment metadata
export const customPaymentMetadataSchema = paymentMethodMetadataSchema.extend({
  type: z.string(),
  instructions: z.string(),
});

// Payment method option schema (for UI)
export const paymentMethodOptionSchema = z.object({
  name: z.string(),
  code: z.string(),
  description: z.string(),
  enabled: z.boolean(),
  metadata: paymentMethodMetadataSchema,
});

// Create payment method DTO schema
export const createPaymentMethodSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  code: z.string().min(1, 'El código es requerido'),
  enabled: z.boolean().default(true),
  metadata: z.record(z.any()).optional(),
});

// Update payment method DTO schema
export const updatePaymentMethodSchema = createPaymentMethodSchema.partial();

// Types
export type PaymentMethodMetadata = z.infer<typeof paymentMethodMetadataSchema>;
export type MobilePaymentMetadata = z.infer<typeof mobilePaymentMetadataSchema>;
export type CardPaymentMetadata = z.infer<typeof cardPaymentMetadataSchema>;
export type CashPaymentMetadata = z.infer<typeof cashPaymentMetadataSchema>;
export type CustomPaymentMetadata = z.infer<typeof customPaymentMetadataSchema>;
export type PaymentMethodOption = z.infer<typeof paymentMethodOptionSchema>;
export type CreatePaymentMethodInput = z.infer<typeof createPaymentMethodSchema>;
export type UpdatePaymentMethodInput = z.infer<typeof updatePaymentMethodSchema>;