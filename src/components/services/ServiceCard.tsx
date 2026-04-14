// frontend/src/components/services/ServiceCard.tsx
import { Link } from 'react-router-dom';
import { ImageOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ServicePriceDisplay } from './ServicePriceDisplay';
import { SERVICE_CATEGORY_LABELS } from '@/lib/service-categories';
import { type Service } from '@/lib/services.api';
import { cn } from '@/lib/utils';
import { uploadUrl } from '@/lib/uploads';

interface Props {
  service: Service;
  to?: string;
  actions?: React.ReactNode;
}

export function ServiceCard({ service, to, actions }: Props) {
  const firstThumb = service.thumb_urls[0];
  const thumbSrc = firstThumb ? uploadUrl(firstThumb) : null;
  const initials = service.provider.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  const containerClass = cn(
    'group block rounded-lg border bg-card overflow-hidden transition-transform',
    to && 'hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
    !service.is_active && 'opacity-60',
  );

  const body = (
    <>
      <div className="relative aspect-[4/3] bg-muted">
        {thumbSrc ? (
          <img src={thumbSrc} alt={service.name} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <ImageOff className="h-12 w-12" aria-hidden />
          </div>
        )}
        <Badge className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm text-foreground hover:bg-background/80">
          {SERVICE_CATEGORY_LABELS[service.category]}
        </Badge>
      </div>
      <div className="p-3 sm:p-4 space-y-2">
        <h3 className="font-heading text-sm sm:text-base md:text-lg font-semibold leading-tight line-clamp-2">{service.name}</h3>
        <ServicePriceDisplay pricingType={service.pricing_type} price={service.price} variant="card" />
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Avatar className="h-5 w-5">
            <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
          </Avatar>
          <span className="line-clamp-1">{service.provider.name}</span>
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
