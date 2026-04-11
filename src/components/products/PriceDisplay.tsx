import { formatBRL } from '@/lib/price';
import { cn } from '@/lib/utils';

interface Props {
  value: number;
  variant?: 'card' | 'detail';
  className?: string;
}

/**
 * variant="card": Heading size (text-xl) + foreground color + tabular-nums
 * variant="detail": Display size (text-3xl) + primary color + tabular-nums
 */
export function PriceDisplay({ value, variant = 'card', className }: Props) {
  return (
    <span
      className={cn(
        'font-heading font-semibold tabular-nums',
        variant === 'card' && 'text-xl text-foreground',
        variant === 'detail' && 'text-3xl text-primary',
        className,
      )}
    >
      {formatBRL(value)}
    </span>
  );
}
