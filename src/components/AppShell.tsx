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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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
import { Separator } from '@/components/ui/separator';
import { User, Building2, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import { apiClient } from '../lib/axios';

export default function AppShell() {
  const navigate = useNavigate();
  const { user, activeCondominiumName, clearAuth } = useAuthStore();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

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

  function navigateTo(path: string) {
    setSheetOpen(false);
    navigate(path);
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header
        className="h-14 border-b border-violet-200/40 flex items-center px-4 gap-4 sticky top-0 z-50"
        style={{
          background: 'linear-gradient(135deg, oklch(0.50 0.26 280) 0%, oklch(0.42 0.22 290) 100%)',
          backdropFilter: 'blur(8px)',
        }}
      >
        {/* Logo */}
        <span className="text-primary-foreground font-bold text-lg tracking-tight">Liga Bloco</span>

        {/* Active condominium — center, desktop only */}
        <div className="flex-1 hidden md:flex justify-center">
          {activeCondominiumName && (
            <span className="text-primary-foreground/70 text-sm truncate max-w-xs">
              {activeCondominiumName}
            </span>
          )}
        </div>

        {/* Avatar — right side */}
        <div className="ml-auto flex items-center">
          {/* Mobile: avatar opens Sheet */}
          <button
            className="md:hidden rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground/50"
            onClick={() => setSheetOpen(true)}
            aria-label="Abrir menu"
          >
            <Avatar className="h-8 w-8 cursor-pointer">
              <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>

          {/* Desktop: avatar opens DropdownMenu */}
          <div className="hidden md:block">
            <DropdownMenu>
              <DropdownMenuTrigger className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-foreground">
                <Avatar className="h-8 w-8 cursor-pointer">
                  <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground text-xs font-bold">
                    {initials}
                  </AvatarFallback>
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
                <DropdownMenuItem variant="destructive" onClick={() => setLogoutOpen(true)}>
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Mobile Sheet drawer */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-[280px] sm:w-[320px] p-0">
          {/* Sheet header with user info */}
          <SheetHeader
            className="p-6 pb-4"
            style={{
              background: 'linear-gradient(160deg, oklch(0.50 0.26 280) 0%, oklch(0.42 0.22 290) 100%)',
            }}
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-white/20 text-white text-base font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <SheetTitle className="text-white text-base font-semibold truncate">
                  {user?.name ?? 'Usuário'}
                </SheetTitle>
                <p className="text-white/70 text-xs truncate mt-0.5">{user?.email ?? ''}</p>
              </div>
            </div>
            {activeCondominiumName && (
              <p className="text-white/60 text-xs mt-3 truncate">
                {activeCondominiumName}
              </p>
            )}
          </SheetHeader>

          {/* Nav items */}
          <nav className="flex flex-col py-3">
            <button
              onClick={() => navigateTo('/profile')}
              className="flex items-center gap-4 px-6 py-4 text-left text-base font-medium hover:bg-muted transition-colors active:bg-muted/80"
            >
              <User className="h-5 w-5 text-muted-foreground shrink-0" />
              Meu Perfil
            </button>
            <button
              onClick={() => navigateTo('/switch-tenant')}
              className="flex items-center gap-4 px-6 py-4 text-left text-base font-medium hover:bg-muted transition-colors active:bg-muted/80"
            >
              <Building2 className="h-5 w-5 text-muted-foreground shrink-0" />
              Meus Condomínios
            </button>
            <Separator className="my-2" />
            <button
              onClick={() => {
                setSheetOpen(false);
                setLogoutOpen(true);
              }}
              className="flex items-center gap-4 px-6 py-4 text-left text-base font-medium text-destructive hover:bg-destructive/10 transition-colors active:bg-destructive/15"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              Sair
            </button>
          </nav>
        </SheetContent>
      </Sheet>

      {/* Page content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <Outlet />
      </main>

      {/* Logout confirmation */}
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
            <AlertDialogAction variant="destructive" onClick={handleLogout}>
              Sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
