import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ProductGallery } from '@/components/products/ProductGallery';
import { PriceDisplay } from '@/components/products/PriceDisplay';
import { getProduct } from '@/lib/products.api';
import { CATEGORY_LABELS } from '@/lib/categories';
import { useAuthStore } from '@/store/auth.store';

export default function ProdutoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);

  const {
    data: product,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['products', id],
    queryFn: () => getProduct(id!),
    enabled: !!id,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div className="grid md:grid-cols-5 gap-8">
          <div className="md:col-span-3">
            <Skeleton className="aspect-[4/3] w-full rounded-lg" />
          </div>
          <div className="md:col-span-2 space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="text-center py-12 space-y-4">
        <h2 className="font-heading text-xl font-semibold">Produto não encontrado</h2>
        <Button onClick={() => navigate('/produtos')}>Voltar aos produtos</Button>
      </div>
    );
  }

  const isOwner = product.seller.id === currentUser?.id;
  const initials = product.seller.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div className="grid md:grid-cols-5 gap-8">
          <div className="md:col-span-3">
            <ProductGallery imageUrls={product.image_urls} productName={product.name} />
          </div>
          <div className="md:col-span-2 space-y-4">
            <Badge>{CATEGORY_LABELS[product.category]}</Badge>
            <h1 className="font-heading text-3xl font-semibold leading-tight">{product.name}</h1>
            <PriceDisplay value={product.price} variant="detail" />
            <div className="flex items-center gap-3 pt-2 border-t">
              <Avatar className="h-10 w-10">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <span className="font-heading text-xl font-semibold">{product.seller.name}</span>
            </div>
            {product.description && (
              <p className="text-sm whitespace-pre-wrap text-foreground/90">{product.description}</p>
            )}
            <div className="pt-4 space-y-2">
              <Tooltip>
                <TooltipTrigger className="block w-full">
                  <Button disabled className="w-full pointer-events-none">
                    Adicionar ao carrinho
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Carrinho ainda não disponível</TooltipContent>
              </Tooltip>
              {isOwner && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate(`/produtos/meus?edit=${product.id}`)}
                >
                  Editar
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
