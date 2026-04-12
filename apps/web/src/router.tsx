import { createRootRoute, createRoute, createRouter, Outlet, redirect } from '@tanstack/react-router';
import { lazy } from 'react';
import { useAuthStore } from '@/stores/authStore';

const LandingPage = lazy(() => import('@/pages/Landing'));
const DashboardLayout = lazy(() => import('@/components/layout/DashboardLayout'));
const DashboardOverview = lazy(() => import('@/pages/dashboard/Overview'));
const DashboardWallets = lazy(() => import('@/pages/dashboard/Wallets'));
const DashboardTransactions = lazy(() => import('@/pages/dashboard/Transactions'));
const DashboardSettings = lazy(() => import('@/pages/dashboard/Settings'));
const AdminLayout = lazy(() => import('@/components/layout/AdminLayout'));
const AdminUsers = lazy(() => import('@/pages/admin/Users'));

// Auth guard: redirect to home if not authenticated
const requireAuth = () => {
  const { isAuthenticated } = useAuthStore.getState();
  if (!isAuthenticated) {
    throw redirect({ to: '/' });
  }
};

// Admin guard: redirect to dashboard if not admin
const requireAdmin = () => {
  requireAuth();
  const { user } = useAuthStore.getState();
  if (user?.role !== 'admin') {
    throw redirect({ to: '/dashboard' });
  }
};

// Root route
const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

// Index route (public)
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: LandingPage,
});

// Dashboard routes (protected)
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: DashboardLayout,
  beforeLoad: requireAuth,
});

const dashboardIndexRoute = createRoute({
  getParentRoute: () => dashboardRoute,
  path: '/',
  component: DashboardOverview,
});

const dashboardWalletsRoute = createRoute({
  getParentRoute: () => dashboardRoute,
  path: '/wallets',
  component: DashboardWallets,
});

const dashboardTransactionsRoute = createRoute({
  getParentRoute: () => dashboardRoute,
  path: '/transactions',
  component: DashboardTransactions,
});

const dashboardSettingsRoute = createRoute({
  getParentRoute: () => dashboardRoute,
  path: '/settings',
  component: DashboardSettings,
});

// Admin routes (admin only)
const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: AdminLayout,
  beforeLoad: requireAdmin,
});

const adminIndexRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/',
  component: AdminUsers,
});

// Build route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  dashboardRoute.addChildren([
    dashboardIndexRoute,
    dashboardWalletsRoute,
    dashboardTransactionsRoute,
    dashboardSettingsRoute,
  ]),
  adminRoute.addChildren([adminIndexRoute]),
]);

export const router = createRouter({ routeTree });
