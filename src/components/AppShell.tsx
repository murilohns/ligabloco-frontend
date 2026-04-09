import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { User, LogOut, LayoutGrid, Users, ChevronDown, Check, Loader2, Eye, Building2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '../store/auth.store';
import { apiClient } from '../lib/axios';

interface Condominium {
  id: string;
  name: string;
  address: string;
  role: string;
  isActive: boolean;
  joinedAt: string;
}

export default function AppShell() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, activeCondominiumName, activeCondominiumId, updateToken, clearAuth, clearTenantContext } = useAuthStore();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);
  const [isExiting, setIsExiting] = useState(false);

  const isImpersonating =
    user?.adminRole !== null &&
    user?.adminRole !== undefined &&
    !!activeCondominiumId &&
    activeCondominiumId !== '';

  const handleExitImpersonation = async () => {
    if (isExiting) return;
    setIsExiting(true);
    const loadingId = toast.loading('Saindo da visualização…');
    try {
      const { data } = await apiClient.post<{ accessToken: string }>('/auth/exit-impersonation');
      clearTenantContext(data.accessToken);
      queryClient.clear(); // wipe impersonated tenant data
      toast.success('Você voltou à visão de super-admin', { id: loadingId });
      navigate('/admin/condominiums');
    } catch {
      toast.error('Não foi possível sair da visualização. Tente novamente.', { id: loadingId });
    } finally {
      setIsExiting(false);
    }
  };

  const { data: condominiums = [] } = useQuery<Condominium[]>({
    queryKey: ['condominiums'],
    queryFn: () => apiClient.get('/users/me/condominiums').then((r) => r.data),
    enabled: !!activeCondominiumId,
  });

  // Derive active name from fetched list (survives page reload — JWT has no condominiumName)
  const activeCondoName =
    condominiums.find((c) => c.id === activeCondominiumId)?.name ??
    activeCondominiumName ??
    '';

  async function handleSwitch(condominiumId: string) {
    if (condominiumId === activeCondominiumId) return;
    setSwitching(condominiumId);
    try {
      const { data } = await apiClient.post('/auth/switch-tenant', { condominiumId });
      const name = condominiums.find((c) => c.id === condominiumId)?.name;
      updateToken(data.accessToken, condominiumId, name);
    } catch {
      // silent — user can try again
    } finally {
      setSwitching(null);
    }
  }

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
      {isImpersonating && (
        <div
          role="status"
          aria-live="polite"
          className="w-full bg-amber-500 text-amber-950 py-3 px-4 md:px-6 flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Eye className="h-4 w-4 shrink-0" aria-hidden />
            <span className="truncate text-sm font-medium">
              Visualizando como admin de {activeCondominiumName ?? 'condomínio'}
            </span>
            {user?.adminRole === 'READ_ONLY_ADMIN' && (
              <span className="shrink-0 text-xs font-semibold bg-amber-800/20 text-amber-950 border border-amber-800/30 rounded px-1.5 py-0.5">
                Somente leitura
              </span>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExitImpersonation}
            disabled={isExiting}
            className="h-10 border-amber-800 text-amber-950 hover:bg-amber-400 bg-transparent"
            aria-label="Sair da visualização"
          >
            <LogOut className="h-4 w-4 mr-2" aria-hidden />
            {isExiting ? 'Saindo…' : 'Sair da visualização'}
          </Button>
        </div>
      )}
      {/* Header */}
      <header
        className="h-14 border-b border-violet-200/40 flex items-center px-4 gap-4 sticky top-0 z-50"
        style={{
          background: 'linear-gradient(135deg, oklch(0.50 0.26 280) 0%, oklch(0.42 0.22 290) 100%)',
          backdropFilter: 'blur(8px)',
        }}
      >
        {/* Logo + condominium switcher */}
        <span className="text-primary-foreground font-bold text-lg tracking-tight shrink-0">Liga Bloco</span>

        {user?.adminRole === null && activeCondoName && (
          <>
            <span className="text-primary-foreground/30 text-lg shrink-0">|</span>
            {condominiums.length > 1 ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <button className="flex items-center gap-1 text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground/50 rounded">
                      <span className="truncate max-w-[180px]">{activeCondoName}</span>
                      {switching !== null ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                      )}
                    </button>
                  }
                />
                <DropdownMenuContent align="start" className="min-w-[200px]">
                  {condominiums.map((condo, index) => (
                    <div key={condo.id}>
                      {index > 0 && <DropdownMenuSeparator />}
                      <DropdownMenuItem
                        onClick={() => handleSwitch(condo.id)}
                        disabled={switching === condo.id || condo.id === activeCondominiumId}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Check
                          className={`h-4 w-4 shrink-0 ${condo.id === activeCondominiumId ? 'opacity-100' : 'opacity-0'}`}
                        />
                        <span className="truncate">{condo.name}</span>
                      </DropdownMenuItem>
                    </div>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <span className="text-sm text-primary-foreground/80 truncate max-w-[180px]">
                {activeCondoName}
              </span>
            )}
          </>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Avatar — right side, opens Sheet on all screen sizes */}
        <div className="flex items-center">
          <button
            className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground/50"
            onClick={() => setSheetOpen(true)}
            aria-label="Abrir menu"
          >
            <Avatar className="h-8 w-8 cursor-pointer">
              <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>
        </div>
      </header>

      {/* Sheet drawer — all screen sizes */}
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
            {activeCondoName && (
              <p className="text-white/60 text-xs mt-3 truncate">
                {activeCondoName}
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
{user?.adminRole !== null && (
              <button
                onClick={() => navigateTo('/admin/condominiums')}
                className="flex items-center gap-4 px-6 py-4 text-left text-base font-medium hover:bg-muted transition-colors active:bg-muted/80"
              >
                <LayoutGrid className="h-5 w-5 text-muted-foreground shrink-0" />
                Condomínios
              </button>
            )}
            {user?.adminRole === 'SUPER_ADMIN' && (
              <button
                onClick={() => navigateTo('/admin/platform')}
                className="flex items-center gap-4 px-6 py-4 text-left text-base font-medium hover:bg-muted transition-colors active:bg-muted/80"
              >
                <ShieldCheck className="h-5 w-5 text-muted-foreground shrink-0" />
                Plataforma
              </button>
            )}
            {(user?.condoRole === 'CONDO_ADMIN' || user?.adminRole !== null) && (
              <button
                onClick={() => navigateTo('/admin/residents')}
                className="flex items-center gap-4 px-6 py-4 text-left text-base font-medium hover:bg-muted transition-colors active:bg-muted/80"
              >
                <Users className="h-5 w-5 text-muted-foreground shrink-0" />
                Moradores
              </button>
            )}
            {user?.condoRole === 'CONDO_ADMIN' && user?.adminRole === null && activeCondominiumId && (
              <button
                onClick={() => navigateTo(`/admin/condominiums/${activeCondominiumId}`)}
                className="flex items-center gap-4 px-6 py-4 text-left text-base font-medium hover:bg-muted transition-colors active:bg-muted/80"
              >
                <Building2 className="h-5 w-5 text-muted-foreground shrink-0" />
                Informacoes do condominio
              </button>
            )}
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
