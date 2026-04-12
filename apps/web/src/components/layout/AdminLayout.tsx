import { Outlet, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Users,
  Wallet,
  Activity,
  FileText,
  ArrowLeft,
  Menu,
  X,
} from 'lucide-react';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navItems = [
    { icon: Users, label: 'Users', to: '/admin' as const },
    { icon: Wallet, label: 'Wallets', to: '/admin/wallets' as const },
    { icon: Activity, label: 'System Health', to: '/admin/health' as const },
    { icon: FileText, label: 'Audit Logs', to: '/admin/logs' as const },
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xl font-bold text-gray-900"
              >
                Admin
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

        {/* Back to Dashboard */}
        <div className="p-4 border-t border-gray-200">
          <Button
            variant="ghost"
            asChild
            className={cn(
              'w-full justify-start gap-3',
              !sidebarOpen && 'justify-center px-0'
            )}
          >
            <Link to="/dashboard">
              <ArrowLeft className="w-5 h-5 shrink-0" />
              {sidebarOpen && <span>Back to Dashboard</span>}
            </Link>
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
          <div className="text-sm text-gray-600">Admin Panel</div>
        </header>

        {/* Page Content */}
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
