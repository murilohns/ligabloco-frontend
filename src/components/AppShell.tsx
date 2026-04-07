import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuthStore } from '../store/auth.store';
import { apiClient } from '../lib/axios';

export default function AppShell() {
  const navigate = useNavigate();
  const { user, activeCondominiumName, clearAuth } = useAuthStore();
  const [logoutOpen, setLogoutOpen] = useState(false);

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '??';

  async function handleLogout() {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      clearAuth();
      navigate('/login', { replace: true });
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header: height 56px, violet gradient with backdrop blur */}
      <header className="h-14 border-b flex items-center px-4 gap-4 sticky top-0 z-40 backdrop-blur-sm"
        style={{ background: 'linear-gradient(135deg, oklch(0.50 0.26 280) 0%, oklch(0.38 0.24 270) 100%)' }}>
        {/* Logo — left */}
        <span className="text-primary-foreground font-bold text-lg tracking-tight">Liga Bloco</span>

        {/* Active condominium name — center (hidden on mobile) */}
        <div className="flex-1 hidden md:flex justify-center">
          {activeCondominiumName && (
            <span className="text-primary-foreground/70 text-sm truncate max-w-xs">
              {activeCondominiumName}
            </span>
          )}
        </div>

        {/* Avatar + dropdown — right */}
        <div className="ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger
              className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-foreground"
            >
              <Avatar className="h-8 w-8 cursor-pointer">
                <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground text-xs font-bold">{initials}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                Meu Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/switch-tenant')}>
                Meus Condomínios
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setLogoutOpen(true)}
              >
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Page content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <Outlet />
      </main>

      {/* Logout confirmation dialog */}
      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sair da plataforma?</AlertDialogTitle>
            <AlertDialogDescription>
              Você será desconectado. Será necessário fazer login novamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setLogoutOpen(false)}>
              Continuar na plataforma
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleLogout}
            >
              Sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
