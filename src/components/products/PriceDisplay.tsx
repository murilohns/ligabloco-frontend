import { cn } from '@/lib/utils';

interface Props {
  value: number;
  variant?: 'card' | 'detail';
  className?: string;
}

/**
 * variant="card": Heading size (text-xl) + foreground color + tabular-nums
 * variant="detail": Display size (text-3xl) + primary color + tabular-nums
 *
 * Renders "R$" as a small superscript span separate from the numeric value,
 * giving the artisanal price-tag look from the Terracota redesign.
 */
export function PriceDisplay({ value, variant = 'card', className }: Props) {
  const formatted = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

  return (
    <span
      className={cn(
        'font-heading font-semibold tabular-nums',
        variant === 'card' && 'text-xl text-foreground',
        variant === 'detail' && 'text-3xl text-primary',
        className,
      )}
    >
      <span className="text-[0.55em] align-super font-sans font-medium text-muted-foreground mr-0.5">
        R$
      </span>
      {formatted}
    </span>
  );
}
