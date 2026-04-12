import api from '@/lib/api';
import { useMutation } from '@tanstack/react-query';
import type { LoginRequest, RegisterRequest, AuthResponse } from '@universal/shared';

export const useAuth = () => {
  const loginMutation = useMutation({
    mutationFn: async (data: LoginRequest) => {
      const response = await api.post<AuthResponse>('/auth/login', data);
      return response.data;
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterRequest) => {
      const response = await api.post<AuthResponse>('/auth/register', data);
      return response.data;
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await api.post('/auth/logout');
    },
  });

  return {
    login: loginMutation,
    register: registerMutation,
    logout: logoutMutation,
    isLoading: loginMutation.isPending || registerMutation.isPending,
    error: loginMutation.error || registerMutation.error,
  };
};
