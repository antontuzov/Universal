import { z } from 'zod';

// Auth Validation Schemas
export const authSchemas = {
  register: z.object({
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
  }),
  login: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
  refreshToken: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
};

// Wallet Validation Schemas
export const walletSchemas = {
  createWallet: z.object({
    name: z.string().min(1, 'Wallet name is required').max(50),
    mnemonic: z.string().optional(),
  }),
  importWallet: z.object({
    name: z.string().min(1, 'Wallet name is required').max(50),
    mnemonic: z.string().min(1, 'Mnemonic phrase is required'),
  }),
  walletId: z.object({
    id: z.string().uuid('Invalid wallet ID'),
  }),
};

// Transaction Validation Schemas
export const transactionSchemas = {
  sendTransaction: z.object({
    walletId: z.string().uuid('Invalid wallet ID'),
    recipientAddress: z.string().min(1, 'Recipient address is required'),
    amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: 'Amount must be a positive number',
    }),
    password: z.string().min(1, 'Password is required to sign transaction'),
  }),
};
