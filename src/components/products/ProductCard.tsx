import { Link } from 'react-router-dom';
import { ImageOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PriceDisplay } from './PriceDisplay';
import { CATEGORY_LABELS } from '@/lib/categories';
import { type Product } from '@/lib/products.api';
import { cn } from '@/lib/utils';

import { uploadUrl } from '@/lib/uploads';

interface Props {
  product: Product;
  /** Optional route to wrap the card surface in a <Link>. Omit to render as a plain <div> (Plan 06 management mode). */
  to?: string;
  actions?: React.ReactNode;
}

export function ProductCard({ product, to, actions }: Props) {
  const firstImage = product.image_urls[0];
  const thumbSrc = firstImage ? uploadUrl(firstImage.replace(/\.webp$/, '.thumb.webp')) : null;
  const initials = product.seller.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  const containerClass = cn(
    'group block rounded-lg border bg-card overflow-hidden transition-transform',
    to && 'hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
    !product.is_active && 'opacity-60',
  );

  const body = (
    <>
      <div className="relative aspect-[4/3] bg-muted">
        {thumbSrc ? (
          <img src={thumbSrc} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <ImageOff className="h-12 w-12" aria-hidden />
          </div>
        )}
        <Badge className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm text-foreground hover:bg-background/80">
          {CATEGORY_LABELS[product.category]}
        </Badge>
      </div>
      <div className="p-4 space-y-2">
        <h3 className="font-heading text-xl font-semibold leading-tight line-clamp-2">{product.name}</h3>
        <PriceDisplay value={product.price} variant="card" />
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Avatar className="h-5 w-5">
            <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
          </Avatar>
          <span className="line-clamp-1">{product.seller.name}</span>
        </div>
        {actions && <div className="pt-2 border-t flex items-center gap-2">{actions}</div>}
      </div>
    </>
  );

  return to ? (
    <Link to={to} className={containerClass}>
      {body}
    </Link>
  ) : (
    <div className={containerClass}>{body}</div>
  );
}
