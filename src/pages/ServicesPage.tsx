// frontend/src/pages/ServicesPage.tsx
import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ServiceCard } from '@/components/services/ServiceCard';
import { ServiceCategoryChips } from '@/components/services/ServiceCategoryChips';
import { HardDeleteServiceDialog } from '@/components/services/HardDeleteServiceDialog';
import { listServices } from '@/lib/services.api';
import type { ServiceCategory } from '@/lib/service-categories';
import { useAuthStore } from '@/store/auth.store';

export default function ServicesPage() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ServiceCategory | null>(null);
  const currentUser = useAuthStore((s) => s.user);
  const isSuperAdmin = currentUser?.adminRole === 'SUPER_ADMIN';
  const [hardDeleting, setHardDeleting] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 150);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data: services = [], isLoading, error } = useQuery({
    queryKey: ['services'],
    queryFn: listServices,
  });

  useEffect(() => {
    if (error) toast.error('Não foi possível carregar os serviços');
  }, [error]);

  const activeServices = useMemo(() => services.filter((s) => s.is_active), [services]);

  const filtered = useMemo(() => {
    return activeServices
      .filter((s) => (category ? s.category === category : true))
      .filter((s) => (search ? s.name.toLowerCase().includes(search.toLowerCase()) : true));
  }, [activeServices, search, category]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold">Serviços</h1>
        <p className="text-sm text-muted-foreground mt-1">Encontre profissionais do seu condomínio</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden />
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Buscar por nome…"
          className="pl-9"
          aria-label="Buscar por nome"
        />
      </div>

      <div className="sticky top-14 bg-background/95 backdrop-blur py-2 z-10 overflow-x-clip">
        <ServiceCategoryChips selected={category} onChange={setCategory} />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[4/3] w-full rounded-lg" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-5 w-1/3" />
            </div>
          ))}
        </div>
      ) : activeServices.length === 0 ? (
        <div className="text-center py-12 space-y-4">
          <h2 className="font-heading text-xl font-semibold">Nenhum serviço por aqui ainda</h2>
          <p className="text-sm text-muted-foreground">
            Os moradores deste condomínio ainda não publicaram serviços. Seja o primeiro.
          </p>
          <Button onClick={() => navigate('/services/mine?new=1')}>+ Novo serviço</Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 space-y-4">
          <h2 className="font-heading text-xl font-semibold">Sem resultados</h2>
          <p className="text-sm text-muted-foreground">Tente outra categoria ou ajuste a busca.</p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchInput('');
              setSearch('');
              setCategory(null);
            }}
          >
            Limpar filtros
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {filtered.map((s) => (
            <ServiceCard
              key={s.id}
              service={s}
              to={`/services/${s.id}`}
              actions={isSuperAdmin ? (
                <button
                  className="flex items-center gap-1 text-sm font-medium text-destructive hover:text-destructive/80 transition-colors"
                  aria-label="Excluir serviço permanentemente"
                  onClick={(e) => { e.preventDefault(); setHardDeleting({ id: s.id, name: s.name }); }}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Excluir</span>
                </button>
              ) : undefined}
            />
          ))}
        </div>
      )}
      <HardDeleteServiceDialog
        serviceId={hardDeleting?.id ?? null}
        serviceName={hardDeleting?.name ?? ''}
        onOpenChange={(open) => { if (!open) setHardDeleting(null); }}
      />
    </div>
  );
}
