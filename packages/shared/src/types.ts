// User Types
export interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
}

// Wallet Types
export interface Wallet {
  id: string;
  userId: string;
  name: string;
  chain: 'ethereum' | 'bitcoin' | 'solana';
  address: string;
  balance: string;
  createdAt: string;
}

// Transaction Types
export interface Transaction {
  id: string;
  walletId: string;
  chain: 'ethereum' | 'bitcoin' | 'solana';
  fromAddress: string;
  toAddress: string;
  amount: string;
  fee: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: string;
  txHash?: string;
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// Wallet Action Types
export interface CreateWalletRequest {
  name: string;
  mnemonic?: string;
}

export interface ImportWalletRequest {
  name: string;
  mnemonic: string;
}

export interface SendTransactionRequest {
  walletId: string;
  recipientAddress: string;
  amount: string;
  password: string;
}
