// frontend/src/components/services/ServicePriceDisplay.tsx
import { formatBRL } from '@/lib/price';
import { cn } from '@/lib/utils';
import type { PricingType } from '@/lib/service-categories';

interface Props {
  pricingType: PricingType;
  price: number | null;
  variant?: 'card' | 'detail';
  className?: string;
}

export function ServicePriceDisplay({ pricingType, price, variant = 'card', className }: Props) {
  let text: string;
  if (pricingType === 'NEGOTIABLE') {
    text = 'A combinar';
  } else if (pricingType === 'PER_HOUR' && price != null) {
    text = `${formatBRL(price)}/h`;
  } else if (price != null) {
    text = formatBRL(price);
  } else {
    text = 'A combinar';
  }

  return (
    <span
      className={cn(
        'font-heading font-semibold tabular-nums',
        variant === 'card' && 'text-xl text-foreground',
        variant === 'detail' && 'text-3xl text-primary',
        pricingType === 'NEGOTIABLE' && 'italic',
        className,
      )}
    >
      {text}
    </span>
  );
}
