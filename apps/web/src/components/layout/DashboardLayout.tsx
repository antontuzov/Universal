import { Outlet, useNavigate, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  Shield,
  Menu,
  X,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore errors — always clear client state
    }
    logout();
    navigate({ to: '/' });
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Overview', to: '/dashboard' as const },
    { icon: Wallet, label: 'Wallets', to: '/dashboard/wallets' as const },
    { icon: ArrowLeftRight, label: 'Transactions', to: '/dashboard/transactions' as const },
    { icon: Settings, label: 'Settings', to: '/dashboard/settings' as const },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 256 : 72 }}
        className={cn(
          'bg-white border-r border-gray-200 h-screen sticky top-0 flex flex-col transition-all duration-300',
          !sidebarOpen && 'items-center'
        )}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-universal-dark to-universal-cyan flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xl font-bold text-gray-900"
              >
                Universal
              </motion.span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <Button
              key={item.to}
              variant="ghost"
              asChild
              className={cn(
                'w-full justify-start gap-3',
                !sidebarOpen && 'justify-center px-0'
              )}
            >
              <Link to={item.to}>
                <item.icon className="w-5 h-5 shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            </Button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          <Button
            variant="ghost"
            asChild
            className={cn(
              'w-full justify-start gap-3',
              !sidebarOpen && 'justify-center px-0'
            )}
          >
            <Link to="/admin">
              <Shield className="w-5 h-5 shrink-0" />
              {sidebarOpen && <span>Admin Panel</span>}
            </Link>
          </Button>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className={cn(
              'w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50',
              !sidebarOpen && 'justify-center px-0'
            )}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </Button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user?.email}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-universal-dark to-universal-cyan flex items-center justify-center text-white font-semibold shrink-0">
              {user?.email?.[0].toUpperCase() ?? 'U'}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
