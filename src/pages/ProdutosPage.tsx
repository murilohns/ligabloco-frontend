import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductCard } from '@/components/products/ProductCard';
import { CategoryChips } from '@/components/products/CategoryChips';
import { listProducts } from '@/lib/products.api';
import type { Category } from '@/lib/categories';

export default function ProdutosPage() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<Category | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 150);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: listProducts,
  });

  useEffect(() => {
    if (error) toast.error('Não foi possível carregar os produtos');
  }, [error]);

  const activeProducts = useMemo(() => products.filter((p) => p.is_active), [products]);

  const filtered = useMemo(() => {
    return activeProducts
      .filter((p) => (category ? p.category === category : true))
      .filter((p) => (search ? p.name.toLowerCase().includes(search.toLowerCase()) : true));
  }, [activeProducts, search, category]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold">Produtos</h1>
        <p className="text-sm text-muted-foreground mt-1">Explore o que os vizinhos estão vendendo</p>
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
        <CategoryChips selected={category} onChange={setCategory} />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[4/3] w-full rounded-lg" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-5 w-1/3" />
            </div>
          ))}
        </div>
      ) : activeProducts.length === 0 ? (
        <div className="text-center py-12 space-y-4">
          <h2 className="font-heading text-xl font-semibold">Nenhum produto por aqui ainda</h2>
          <p className="text-sm text-muted-foreground">
            Os moradores deste condomínio ainda não publicaram anúncios. Seja o primeiro.
          </p>
          <Button onClick={() => navigate('/produtos/meus?new=1')}>+ Novo anúncio</Button>
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
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} to={`/produtos/${p.id}`} />
          ))}
        </div>
      )}
    </div>
  );
}
