import { useEffect } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth.store';
import { apiClient } from './lib/axios';
import AppShell from './components/AppShell';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ActivatePage from './pages/ActivatePage';
import TenantSwitcherPage from './pages/TenantSwitcherPage';
import ProfilePage from './pages/ProfilePage';
import DashboardPage from './pages/DashboardPage';
import CondominiumsPage from './pages/admin/CondominiumsPage';
import ResidentsPage from './pages/admin/ResidentsPage';

function Bootstrap({ children }: { children: React.ReactNode }) {
  const setAuth = useAuthStore((s) => s.setAuth);
  const setInitialized = useAuthStore((s) => s.setInitialized);
  const isInitializing = useAuthStore((s) => s.isInitializing);

  useEffect(() => {
    apiClient
      .post<{ accessToken: string }>('/auth/refresh')
      .then(({ data }) => {
        // Decode JWT payload (base64url, middle segment) — no library needed
        const payload = JSON.parse(atob(data.accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        setAuth(
          data.accessToken,
          {
            id: payload.sub,
            name: '',
            email: payload.email,
            isSuperAdmin: payload.isSuperAdmin ?? false,
            condoRole: (payload.role as 'RESIDENT' | 'CONDO_ADMIN') || null,
          },
          payload.condominiumId ?? '',
        );
      })
      .catch(() => {
        // No valid refresh token — user must log in. This is not an error.
      })
      .finally(() => {
        setInitialized();
      });
  }, []); // Run once on mount — intentionally empty dependency array for initialization effect

  if (isInitializing) return null; // Hold rendering until bootstrap is complete
  return <>{children}</>;
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.accessToken);
  const isInitializing = useAuthStore((s) => s.isInitializing);
  if (isInitializing) return null;
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireRole({ role, children }: { role: 'superAdmin' | 'condoAdmin'; children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (role === 'superAdmin' && !user?.isSuperAdmin) return <Navigate to="/dashboard" replace />;
  if (role === 'condoAdmin' && user?.condoRole !== 'CONDO_ADMIN' && !user?.isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

export const router = createBrowserRouter([
  // Public routes
  { path: '/login', element: <LoginPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },
  { path: '/activate', element: <ActivatePage /> },

  // Protected routes — wrapped in AppShell
  {
    element: (
      <Bootstrap>
        <RequireAuth>
          <AppShell />
        </RequireAuth>
      </Bootstrap>
    ),
    children: [
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/switch-tenant', element: <TenantSwitcherPage /> },
      { path: '/profile', element: <ProfilePage /> },
      {
        path: '/admin/condominiums',
        element: (
          <RequireRole role="superAdmin">
            <CondominiumsPage />
          </RequireRole>
        ),
      },
      {
        path: '/admin/residents',
        element: (
          <RequireRole role="condoAdmin">
            <ResidentsPage />
          </RequireRole>
        ),
      },
    ],
  },

  // Default redirect
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
]);
