import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';
import { useAuth } from '@/hooks/useAuth';
import { X, Wallet } from 'lucide-react';
import { authSchemas } from '@universal/shared';
import { showSuccess, showError } from '@/lib/toast';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { login, register, isLoading } = useAuth();
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  const validate = (): string | null => {
    try {
      if (isLogin) {
        authSchemas.login.parse({ email, password });
      } else {
        authSchemas.register.parse({ email, password });
        if (password !== confirmPassword) {
          return 'Passwords do not match';
        }
      }
      return null;
    } catch (err: any) {
      if (err.errors?.[0]?.message) {
        return err.errors[0].message;
      }
      return 'Invalid input';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validate();
    if (validationError) {
      showError('Validation Error', validationError);
      return;
    }

    try {
      const result = isLogin
        ? await login.mutateAsync({ email, password })
        : await register.mutateAsync({ email, password });

      setAuth(result.user, result.accessToken, result.refreshToken);
      showSuccess('Welcome!', `Logged in as ${result.user.email}`);
      navigate({ to: '/dashboard' });
    } catch (err: any) {
      showError(
        'Authentication Failed',
        err?.response?.data?.message ?? err?.message ?? 'Please try again.'
      );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <Card className="w-full max-w-md">
              <CardHeader className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="absolute right-4 top-4"
                >
                  <X className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-universal-dark to-universal-cyan flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-white" />
                  </div>
                  <CardTitle className="text-2xl">
                    {isLogin ? 'Welcome Back' : 'Create Account'}
                  </CardTitle>
                </div>
                <CardDescription>
                  {isLogin
                    ? 'Login to access your wallet'
                    : 'Create an account to get started'}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete={isLogin ? 'current-password' : 'new-password'}
                      required
                    />
                    {!isLogin && (
                      <p className="text-xs text-gray-500">
                        Min 8 chars, must include uppercase, lowercase, and number.
                      </p>
                    )}
                  </div>

                  {!isLogin && (
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        required
                      />
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-universal-dark to-universal-cyan hover:from-universal-dark/90 hover:to-universal-cyan/90"
                    disabled={isLoading}
                  >
                    {isLoading
                      ? 'Loading...'
                      : isLogin
                      ? 'Login'
                      : 'Create Account'}
                  </Button>

                  <p className="text-center text-sm text-gray-600">
                    {isLogin ? "Don't have an account? " : 'Already have an account? '}
                    <button
                      type="button"
                      onClick={() => setIsLogin(!isLogin)}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {isLogin ? 'Sign up' : 'Login'}
                    </button>
                  </p>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
