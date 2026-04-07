import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  accessToken: string | null;
  user: User | null;
  activeCondominiumId: string | null;
  activeCondominiumName: string | null;
  setAuth: (token: string, user: User, condominiumId: string, condominiumName?: string) => void;
  updateToken: (token: string, condominiumId: string, condominiumName?: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  activeCondominiumId: null,
  activeCondominiumName: null,
  setAuth: (accessToken, user, activeCondominiumId, activeCondominiumName) =>
    set({ accessToken, user, activeCondominiumId, activeCondominiumName: activeCondominiumName ?? null }),
  updateToken: (accessToken, activeCondominiumId, activeCondominiumName) =>
    set((state) => ({
      accessToken,
      activeCondominiumId,
      // Preserve existing name if not provided (e.g., on silent token refresh)
      activeCondominiumName: activeCondominiumName ?? state.activeCondominiumName,
    })),
  clearAuth: () =>
    set({ accessToken: null, user: null, activeCondominiumId: null, activeCondominiumName: null }),
}));
