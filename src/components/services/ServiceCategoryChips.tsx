// frontend/src/components/services/ServiceCategoryChips.tsx
import { SERVICE_CATEGORY_ORDER, SERVICE_CATEGORY_LABELS, type ServiceCategory } from '@/lib/service-categories';
import { cn } from '@/lib/utils';

interface Props {
  selected: ServiceCategory | null;
  onChange: (c: ServiceCategory | null) => void;
}

export function ServiceCategoryChips({ selected, onChange }: Props) {
  return (
    <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden lg:overflow-visible">
      <div className="flex gap-2 pb-2 flex-nowrap snap-x snap-mandatory lg:flex-wrap lg:snap-none">
        <button
          type="button"
          onClick={() => onChange(null)}
          className={cn(
            'shrink-0 snap-start rounded-full px-4 min-h-11 text-sm font-semibold transition-colors whitespace-nowrap',
            selected === null
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-foreground hover:bg-muted/80',
          )}
          aria-pressed={selected === null}
        >
          Todas
        </button>
        {SERVICE_CATEGORY_ORDER.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            className={cn(
              'shrink-0 snap-start rounded-full px-4 min-h-11 text-sm font-semibold transition-colors whitespace-nowrap',
              selected === c
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-foreground hover:bg-muted/80',
            )}
            aria-pressed={selected === c}
          >
            {SERVICE_CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>
    </div>
  );
}
