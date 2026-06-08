import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Logo } from '@/components/Logo';
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
import { User, LogOut, LayoutGrid, Users, ChevronDown, Check, Loader2, Eye, Building2, ShieldCheck, ShoppingBag, Package, Wrench, Briefcase, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '../store/auth.store';
import { apiClient } from '../lib/axios';
import { uploadUrl } from '@/lib/uploads';

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
  const location = useLocation();
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

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => apiClient.get('/users/me').then((r) => r.data),
  });

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
      const { data } = await apiClient.post<{ accessToken: string; condoRole: 'RESIDENT' | 'CONDO_ADMIN' | 'CONDO_WRITE' | 'CONDO_READ' }>('/auth/switch-tenant', { condominiumId });
      const name = condominiums.find((c) => c.id === condominiumId)?.name;
      updateToken(data.accessToken, condominiumId, name, { condoRole: data.condoRole });
      queryClient.clear();
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

  function isActive(path: string): boolean {
    return location.pathname === path;
  }

  function isActiveStartsWith(prefix: string, exact?: string): boolean {
    if (exact && location.pathname === exact) return false;
    return location.pathname.startsWith(prefix);
  }

  return (
    <div className="min-h-screen bg-background">
      {isImpersonating && (
        <div
          role="status"
          aria-live="polite"
          className="w-full bg-sidebar text-sidebar-foreground py-3 px-4 md:px-6 flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Eye className="h-4 w-4 shrink-0" aria-hidden />
            <span className="truncate text-sm font-medium">
              Visualizando como admin de {activeCondominiumName ?? 'condomínio'}
            </span>
            {user?.adminRole === 'READ_ONLY_ADMIN' && (
              <span className="shrink-0 text-xs font-semibold bg-sidebar-accent text-sidebar-foreground border border-sidebar-border rounded px-1.5 py-0.5">
                Somente leitura
              </span>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExitImpersonation}
            disabled={isExiting}
            className="h-10 border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground bg-transparent"
            aria-label="Sair da visualização"
          >
            <LogOut className="h-4 w-4 mr-2" aria-hidden />
            {isExiting ? 'Saindo…' : 'Sair da visualização'}
          </Button>
        </div>
      )}
      {/* Header */}
      <header
        className="h-16 border-b border-white/10 flex items-center px-4 gap-4 sticky top-0 z-50"
        style={{
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--sidebar) 100%)',
          backdropFilter: 'blur(8px)',
        }}
      >
        {/* Logo + condominium switcher */}
        <Logo size="sm" variant="onDark" className="shrink-0" />

        {user?.adminRole === null && activeCondoName && (
          <>
            {condominiums.length > 1 ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <button className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 rounded-full px-3 h-9 text-sm text-primary-foreground/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground/50">
                      <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                      <span className="truncate max-w-[160px]">{activeCondoName}</span>
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
              <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 h-9 text-sm text-primary-foreground/90">
                <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                <span className="truncate max-w-[160px]">{activeCondoName}</span>
              </div>
            )}
          </>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Avatar — right side, opens Sheet on mobile only */}
        <div className="flex items-center lg:hidden">
          <button
            className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground/50"
            onClick={() => setSheetOpen(true)}
            aria-label="Abrir menu"
          >
            <Avatar className="h-8 w-8 cursor-pointer">
              {profile?.avatar_url && (
                <AvatarImage src={uploadUrl(profile.avatar_url)} alt="Avatar" />
              )}
              <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>
        </div>
      </header>

      {/* Sheet drawer — mobile only */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-[280px] sm:w-[320px] p-0">
          <SheetHeader className="p-4 border-b border-border">
            <SheetTitle className="text-foreground text-base font-semibold truncate">
              {user?.name ?? 'Usuário'}
            </SheetTitle>
            {activeCondoName && (
              <p className="text-muted-foreground text-xs mt-0.5">{activeCondoName}</p>
            )}
          </SheetHeader>
          <nav className="flex flex-col py-3">
            <button onClick={() => navigateTo('/profile')} className="flex items-center gap-4 px-6 py-4 text-left text-base font-medium hover:bg-muted transition-colors active:bg-muted/80">
              <User className="h-5 w-5 text-muted-foreground shrink-0" />
              Meu Perfil
            </button>
            {activeCondominiumId && (
              <>
                <button onClick={() => navigateTo('/produtos')} className="flex items-center gap-4 px-6 py-4 text-left text-base font-medium hover:bg-muted transition-colors active:bg-muted/80">
                  <ShoppingBag className="h-5 w-5 text-muted-foreground shrink-0" />
                  Produtos
                </button>
                {!user?.adminRole && (
                  <button onClick={() => navigateTo('/produtos/meus')} className="flex items-center gap-4 px-6 py-4 text-left text-base font-medium hover:bg-muted transition-colors active:bg-muted/80">
                    <Package className="h-5 w-5 text-muted-foreground shrink-0" />
                    Minha vitrine
                  </button>
                )}
                <button onClick={() => navigateTo('/services')} className="flex items-center gap-4 px-6 py-4 text-left text-base font-medium hover:bg-muted transition-colors active:bg-muted/80">
                  <Wrench className="h-5 w-5 text-muted-foreground shrink-0" />
                  Serviços
                </button>
                {!user?.adminRole && (
                  <button onClick={() => navigateTo('/services/mine')} className="flex items-center gap-4 px-6 py-4 text-left text-base font-medium hover:bg-muted transition-colors active:bg-muted/80">
                    <Briefcase className="h-5 w-5 text-muted-foreground shrink-0" />
                    Meus serviços
                  </button>
                )}
              </>
            )}
            {user?.adminRole !== null && (
              <button onClick={() => navigateTo('/admin/condominiums')} className="flex items-center gap-4 px-6 py-4 text-left text-base font-medium hover:bg-muted transition-colors active:bg-muted/80">
                <LayoutGrid className="h-5 w-5 text-muted-foreground shrink-0" />
                Condomínios
              </button>
            )}
            {user?.adminRole === 'SUPER_ADMIN' && (
              <button onClick={() => navigateTo('/admin/platform')} className="flex items-center gap-4 px-6 py-4 text-left text-base font-medium hover:bg-muted transition-colors active:bg-muted/80">
                <ShieldCheck className="h-5 w-5 text-muted-foreground shrink-0" />
                Plataforma
              </button>
            )}
            {(user?.condoRole === 'CONDO_ADMIN' || user?.condoRole === 'CONDO_WRITE' || user?.condoRole === 'CONDO_READ' || user?.adminRole !== null) && (
              <button onClick={() => navigateTo('/admin/residents')} className="flex items-center gap-4 px-6 py-4 text-left text-base font-medium hover:bg-muted transition-colors active:bg-muted/80">
                <Users className="h-5 w-5 text-muted-foreground shrink-0" />
                Moradores
              </button>
            )}
            {user?.condoRole === 'CONDO_ADMIN' && user?.adminRole === null && activeCondominiumId && (
              <button onClick={() => navigateTo(`/admin/condominiums/${activeCondominiumId}`)} className="flex items-center gap-4 px-6 py-4 text-left text-base font-medium hover:bg-muted transition-colors active:bg-muted/80">
                <Building2 className="h-5 w-5 text-muted-foreground shrink-0" />
                Informações do condomínio
              </button>
            )}
            <Separator className="my-2" />
            <button
              onClick={() => { setSheetOpen(false); setLogoutOpen(true); }}
              className="flex items-center gap-4 px-6 py-4 text-left text-base font-medium text-destructive hover:bg-destructive/10 transition-colors active:bg-destructive/15"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              Sair
            </button>
          </nav>
        </SheetContent>
      </Sheet>

      {/* Body: persistent sidebar (lg+) + main content */}
      <div className="flex" style={{ minHeight: 'calc(100vh - 4rem)' }}>
        {/* Persistent sidebar — large screens only */}
        <aside
          className="hidden lg:flex flex-col w-64 border-r border-border bg-background shrink-0 sticky overflow-y-auto"
          style={{ top: '4rem', height: 'calc(100vh - 4rem)' }}
        >
          {/* Nav */}
          <nav className="flex flex-col py-3 flex-1">
            <button
              onClick={() => navigateTo('/profile')}
              className={`flex items-center gap-3 px-4 py-0 h-11 w-full text-left text-[15px] font-medium transition-colors relative ${
                isActive('/profile')
                  ? 'bg-secondary text-primary font-semibold border-l-[3px] border-primary pl-[13px]'
                  : 'hover:bg-accent text-foreground'
              }`}
            >
              <User className={`size-5 shrink-0 ${isActive('/profile') ? 'text-primary' : 'text-muted-foreground'}`} />
              Meu Perfil
            </button>
            {activeCondominiumId && (
              <>
                <button
                  onClick={() => navigateTo('/produtos')}
                  className={`flex items-center gap-3 px-4 py-0 h-11 w-full text-left text-[15px] font-medium transition-colors relative ${
                    isActiveStartsWith('/produtos', '/produtos/meus')
                      ? 'bg-secondary text-primary font-semibold border-l-[3px] border-primary pl-[13px]'
                      : 'hover:bg-accent text-foreground'
                  }`}
                >
                  <ShoppingBag className={`size-5 shrink-0 ${isActiveStartsWith('/produtos', '/produtos/meus') ? 'text-primary' : 'text-muted-foreground'}`} />
                  Produtos
                </button>
                {!user?.adminRole && (
                  <button
                    onClick={() => navigateTo('/produtos/meus')}
                    className={`flex items-center gap-3 px-4 py-0 h-11 w-full text-left text-[15px] font-medium transition-colors relative ${
                      isActive('/produtos/meus')
                        ? 'bg-secondary text-primary font-semibold border-l-[3px] border-primary pl-[13px]'
                        : 'hover:bg-accent text-foreground'
                    }`}
                  >
                    <Package className={`size-5 shrink-0 ${isActive('/produtos/meus') ? 'text-primary' : 'text-muted-foreground'}`} />
                    Minha vitrine
                  </button>
                )}
                <button
                  onClick={() => navigateTo('/services')}
                  className={`flex items-center gap-3 px-4 py-0 h-11 w-full text-left text-[15px] font-medium transition-colors relative ${
                    isActiveStartsWith('/services', '/services/mine')
                      ? 'bg-secondary text-primary font-semibold border-l-[3px] border-primary pl-[13px]'
                      : 'hover:bg-accent text-foreground'
                  }`}
                >
                  <Wrench className={`size-5 shrink-0 ${isActiveStartsWith('/services', '/services/mine') ? 'text-primary' : 'text-muted-foreground'}`} />
                  Serviços
                </button>
                {!user?.adminRole && (
                  <button
                    onClick={() => navigateTo('/services/mine')}
                    className={`flex items-center gap-3 px-4 py-0 h-11 w-full text-left text-[15px] font-medium transition-colors relative ${
                      isActive('/services/mine')
                        ? 'bg-secondary text-primary font-semibold border-l-[3px] border-primary pl-[13px]'
                        : 'hover:bg-accent text-foreground'
                    }`}
                  >
                    <Briefcase className={`size-5 shrink-0 ${isActive('/services/mine') ? 'text-primary' : 'text-muted-foreground'}`} />
                    Meus serviços
                  </button>
                )}
              </>
            )}
            {user?.adminRole !== null && (
              <button
                onClick={() => navigateTo('/admin/condominiums')}
                className={`flex items-center gap-3 px-4 py-0 h-11 w-full text-left text-[15px] font-medium transition-colors relative ${
                  isActive('/admin/condominiums')
                    ? 'bg-secondary text-primary font-semibold border-l-[3px] border-primary pl-[13px]'
                    : 'hover:bg-accent text-foreground'
                }`}
              >
                <LayoutGrid className={`size-5 shrink-0 ${isActive('/admin/condominiums') ? 'text-primary' : 'text-muted-foreground'}`} />
                Condomínios
              </button>
            )}
            {user?.adminRole === 'SUPER_ADMIN' && (
              <button
                onClick={() => navigateTo('/admin/platform')}
                className={`flex items-center gap-3 px-4 py-0 h-11 w-full text-left text-[15px] font-medium transition-colors relative ${
                  isActive('/admin/platform')
                    ? 'bg-secondary text-primary font-semibold border-l-[3px] border-primary pl-[13px]'
                    : 'hover:bg-accent text-foreground'
                }`}
              >
                <ShieldCheck className={`size-5 shrink-0 ${isActive('/admin/platform') ? 'text-primary' : 'text-muted-foreground'}`} />
                Plataforma
              </button>
            )}
            {(user?.condoRole === 'CONDO_ADMIN' || user?.condoRole === 'CONDO_WRITE' || user?.condoRole === 'CONDO_READ' || user?.adminRole !== null) && (
              <button
                onClick={() => navigateTo('/admin/residents')}
                className={`flex items-center gap-3 px-4 py-0 h-11 w-full text-left text-[15px] font-medium transition-colors relative ${
                  isActive('/admin/residents')
                    ? 'bg-secondary text-primary font-semibold border-l-[3px] border-primary pl-[13px]'
                    : 'hover:bg-accent text-foreground'
                }`}
              >
                <Users className={`size-5 shrink-0 ${isActive('/admin/residents') ? 'text-primary' : 'text-muted-foreground'}`} />
                Moradores
              </button>
            )}
            {user?.condoRole === 'CONDO_ADMIN' && user?.adminRole === null && activeCondominiumId && (
              <button
                onClick={() => navigateTo(`/admin/condominiums/${activeCondominiumId}`)}
                className={`flex items-center gap-3 px-4 py-0 h-11 w-full text-left text-[15px] font-medium transition-colors relative ${
                  isActiveStartsWith('/admin/condominiums/', '/admin/condominiums')
                    ? 'bg-secondary text-primary font-semibold border-l-[3px] border-primary pl-[13px]'
                    : 'hover:bg-accent text-foreground'
                }`}
              >
                <Building2 className={`size-5 shrink-0 ${isActiveStartsWith('/admin/condominiums/', '/admin/condominiums') ? 'text-primary' : 'text-muted-foreground'}`} />
                Informações do condomínio
              </button>
            )}
          </nav>

          {/* User card + Logout at bottom */}
          <div className="border-t border-border shrink-0">
            <div className="p-3">
              <div className="bg-secondary/60 border border-border rounded-xl p-3 flex items-center gap-3">
                <Avatar className="h-10 w-10 rounded-lg shrink-0">
                  {profile?.avatar_url && <AvatarImage src={uploadUrl(profile.avatar_url)} alt="Avatar" />}
                  <AvatarFallback className="rounded-lg bg-primary/15 text-primary text-sm font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm text-foreground truncate">{user?.name ?? 'Usuário'}</p>
                  <button
                    onClick={() => navigateTo('/profile')}
                    className="text-xs text-primary hover:underline focus:outline-none"
                  >
                    ver perfil →
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={() => setLogoutOpen(true)}
              className="flex items-center gap-3 px-5 py-3 w-full text-left text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors active:bg-destructive/15"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Sair
            </button>
          </div>
        </aside>

        {/* Page content */}
        <main className="flex-1 min-w-0 px-4 py-8">
          <div className="max-w-2xl mx-auto min-w-0">
            <Outlet />
          </div>
        </main>
      </div>

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
