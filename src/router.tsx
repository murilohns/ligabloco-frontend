import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth.store';
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

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.accessToken);
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
      <RequireAuth>
        <AppShell />
      </RequireAuth>
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
