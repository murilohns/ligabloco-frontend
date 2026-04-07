import { useAuthStore } from '../store/auth.store';

export function useAuth() {
  const { accessToken, user, activeCondominiumId, activeCondominiumName, setAuth, updateToken, clearAuth } =
    useAuthStore();
  const isAuthenticated = !!accessToken;
  return { accessToken, user, activeCondominiumId, activeCondominiumName, isAuthenticated, setAuth, updateToken, clearAuth };
}
