import { createRootRoute, createRoute, createRouter, Outlet } from '@tanstack/react-router';
import { lazy } from 'react';

const LandingPage = lazy(() => import('@/pages/Landing'));
const DashboardLayout = lazy(() => import('@/components/layout/DashboardLayout'));
const DashboardOverview = lazy(() => import('@/pages/dashboard/Overview'));
const AdminLayout = lazy(() => import('@/components/layout/AdminLayout'));
const AdminUsers = lazy(() => import('@/pages/admin/Users'));

// Root route
const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

// Index route
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: LandingPage,
});

// Dashboard routes
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: DashboardLayout,
});

const dashboardIndexRoute = createRoute({
  getParentRoute: () => dashboardRoute,
  path: '/',
  component: DashboardOverview,
});

// Admin routes
const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: AdminLayout,
});

const adminIndexRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/',
  component: AdminUsers,
});

// Build route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  dashboardRoute.addChildren([dashboardIndexRoute]),
  adminRoute.addChildren([adminIndexRoute]),
]);

export const router = createRouter({ routeTree });
