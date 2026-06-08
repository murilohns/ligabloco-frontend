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
    'group block rounded-xl border bg-card overflow-hidden shadow-warm-sm transition-all duration-200',
    to && 'hover:-translate-y-1 hover:shadow-warm hover:border-primary/25 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
    !product.is_active && 'opacity-60',
  );

  const body = (
    <>
      <div className="relative aspect-[4/3] bg-secondary overflow-hidden">
        {thumbSrc ? (
          <img
            src={thumbSrc}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground/50">
            <ImageOff className="h-12 w-12" aria-hidden />
          </div>
        )}
        <Badge className="absolute top-2 left-2 bg-secondary/90 backdrop-blur-sm text-secondary-foreground border border-border/60 hover:bg-secondary/90">
          {CATEGORY_LABELS[product.category]}
        </Badge>
      </div>
      <div className="p-3 sm:p-4 space-y-2">
        <h3 className="font-heading text-sm sm:text-base md:text-lg font-semibold leading-tight line-clamp-2">{product.name}</h3>
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
