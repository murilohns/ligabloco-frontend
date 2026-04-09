import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  adminRole: 'SUPER_ADMIN' | 'READ_ONLY_ADMIN' | null;  // D-25: replaces isSuperAdmin
  condoRole: 'RESIDENT' | 'CONDO_ADMIN' | null;
}

interface AuthState {
  accessToken: string | null;
  user: User | null;
  activeCondominiumId: string | null;
  activeCondominiumName: string | null;
  isInitializing: boolean;
  setAuth: (token: string, user: User, condominiumId: string, condominiumName?: string) => void;
  updateToken: (token: string, condominiumId: string, condominiumName?: string, user?: Partial<User>) => void;
  clearTenantContext: (accessToken: string) => void;
  clearAuth: () => void;
  setInitialized: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      activeCondominiumId: null,
      activeCondominiumName: null,
      isInitializing: true,
      setAuth: (accessToken, user, activeCondominiumId, activeCondominiumName) =>
        set({ accessToken, user, activeCondominiumId, activeCondominiumName: activeCondominiumName ?? null }),
      updateToken: (accessToken, activeCondominiumId, activeCondominiumName, user) =>
        set((state) => ({
          accessToken,
          activeCondominiumId,
          activeCondominiumName: activeCondominiumName ?? state.activeCondominiumName,
          user: user ? { ...state.user, ...user } as User : state.user,
        })),
      clearTenantContext: (accessToken) =>
        set({
          accessToken,
          activeCondominiumId: null,     // RESEARCH Pitfall 2: null matches the store type `string | null`
          activeCondominiumName: null,
        }),
      clearAuth: () =>
        set({ accessToken: null, user: null, activeCondominiumId: null, activeCondominiumName: null, isInitializing: false }),
      setInitialized: () => set({ isInitializing: false }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        activeCondominiumId: state.activeCondominiumId,
        activeCondominiumName: state.activeCondominiumName,
      }),
    },
  ),
);
