import { create } from 'zustand';
import type { User } from '@universal/shared';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

/**
 * SECURITY: Tokens are NOT persisted to localStorage.
 * - accessToken: kept in memory only (short-lived, 15min)
 * - refreshToken: kept in memory only (would be httpOnly cookie in production)
 *
 * If the user refreshes the page, they must log in again.
 * In production, replace this with httpOnly cookie-based auth.
 */
export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  setAuth: (user, accessToken, refreshToken) =>
    set({
      user,
      accessToken,
      refreshToken,
      isAuthenticated: true,
    }),
  logout: () =>
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    }),
}));
