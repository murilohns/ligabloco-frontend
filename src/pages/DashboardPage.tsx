import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ShoppingBag, Wrench } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { listProducts } from '@/lib/products.api';
import { listServices } from '@/lib/services.api';
import { ProductCard } from '@/components/products/ProductCard';
import { ServiceCard } from '@/components/services/ServiceCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const activeCondominiumId = useAuthStore((s) => s.activeCondominiumId);

  const firstName = user?.name.split(' ')[0] ?? '';

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: listProducts,
    enabled: !!activeCondominiumId,
  });

  const { data: services = [], isLoading: loadingServices } = useQuery({
    queryKey: ['services'],
    queryFn: listServices,
    enabled: !!activeCondominiumId,
  });

  const activeProducts = useMemo(
    () =>
      products
        .filter((p) => p.is_active)
        .slice()
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 8),
    [products],
  );

  const activeServices = useMemo(
    () =>
      services
        .filter((s) => s.is_active)
        .slice()
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 8),
    [services],
  );

  const isLoading = loadingProducts || loadingServices;

  const subtitleText = isLoading
    ? 'Carregando...'
    : `${activeProducts.length} produto${activeProducts.length !== 1 ? 's' : ''} e ${activeServices.length} serviço${activeServices.length !== 1 ? 's' : ''} disponíveis no seu condomínio`;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div>
        <h1 className="font-heading text-4xl font-semibold leading-tight">
          {getGreeting()}, {firstName}
        </h1>
        <p className="text-muted-foreground mt-2">{subtitleText}</p>
      </div>

      {/* Produtos carousel */}
      <section className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="font-heading text-xl font-semibold">Novidades dos vizinhos</h2>
          <Link to="/produtos" className="text-sm text-primary font-medium">
            Ver tudo →
          </Link>
        </div>

        {loadingProducts ? (
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="min-w-[220px] max-w-[220px] flex-shrink-0">
                <Skeleton className="aspect-[4/3] w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4 mt-2" />
                <Skeleton className="h-4 w-1/3 mt-1" />
              </div>
            ))}
          </div>
        ) : activeProducts.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="Nenhum anúncio ainda"
            description="Seja o primeiro a vender para os vizinhos!"
          />
        ) : (
          <div className="flex overflow-x-auto gap-4 snap-x snap-mandatory pb-2 -mx-4 px-4">
            {activeProducts.map((p) => (
              <div key={p.id} className="min-w-[220px] max-w-[220px] snap-start flex-shrink-0">
                <ProductCard product={p} to={'/produtos/' + p.id} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Serviços carousel */}
      <section className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="font-heading text-xl font-semibold">Serviços em destaque</h2>
          <Link to="/services" className="text-sm text-primary font-medium">
            Ver tudo →
          </Link>
        </div>

        {loadingServices ? (
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="min-w-[220px] max-w-[220px] flex-shrink-0">
                <Skeleton className="aspect-[4/3] w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4 mt-2" />
                <Skeleton className="h-4 w-1/3 mt-1" />
              </div>
            ))}
          </div>
        ) : activeServices.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title="Nenhum serviço ainda"
            description="Ofereça seus serviços para os vizinhos!"
          />
        ) : (
          <div className="flex overflow-x-auto gap-4 snap-x snap-mandatory pb-2 -mx-4 px-4">
            {activeServices.map((s) => (
              <div key={s.id} className="min-w-[220px] max-w-[220px] snap-start flex-shrink-0">
                <ServiceCard service={s} to={'/services/' + s.id} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Banner CTA — hidden for admins */}
      {!user?.adminRole && (
        <div className="bg-secondary border border-border rounded-2xl p-6 space-y-3">
          <h2 className="font-heading text-xl font-semibold">Tem algo parado em casa?</h2>
          <p className="text-muted-foreground text-sm">
            Anuncie pros seus vizinhos — sem taxas, direto pelo WhatsApp
          </p>
          <Button nativeButton={false} render={<Link to="/produtos/meus?new=1" />}>+ Criar anúncio</Button>
        </div>
      )}
    </div>
  );
}
