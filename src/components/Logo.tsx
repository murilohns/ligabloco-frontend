import { cn } from '@/lib/utils';

/**
 * Logo da marca Liga Bloco.
 *
 * O ícone (prédios isométricos em terracota) compartilha o hue do --primary,
 * então em fundos primary/sidebar ele precisa ficar dentro de um container
 * creme (variant="onDark"). Em fundos claros, use variant="onLight" — o
 * ícone aparece "solto", sem container.
 *
 * `withWordmark` controla se renderiza o texto "Liga Bloco" ao lado.
 */

type LogoSize = 'sm' | 'md' | 'lg' | 'xl';
type LogoVariant = 'onLight' | 'onDark';

interface LogoProps {
  size?: LogoSize;
  variant?: LogoVariant;
  withWordmark?: boolean;
  className?: string;
  /** Aria-label do link/elemento pai. Default: "Liga Bloco" */
  ariaLabel?: string;
}

const ICON_PX: Record<LogoSize, number> = {
  sm: 28,   // header app
  md: 44,   // mobile auth
  lg: 64,   // desktop auth panel
  xl: 96,   // hero / landing
};

const WORDMARK_CLASS: Record<LogoSize, string> = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-3xl',
  xl: 'text-4xl',
};

export function Logo({
  size = 'md',
  variant = 'onLight',
  withWordmark = true,
  className,
  ariaLabel = 'Liga Bloco',
}: LogoProps) {
  const iconSize = ICON_PX[size];

  const iconWrapperClass = cn(
    'flex items-center justify-center shrink-0 overflow-hidden',
    // Em fundo escuro, encapsula em creme arredondado pra destacar o ícone terracota
    variant === 'onDark' &&
      'bg-[oklch(0.92_0.03_70)] rounded-xl p-1 ring-1 ring-white/20 shadow-sm',
  );

  const textClass = cn(
    'font-heading font-bold tracking-tight',
    WORDMARK_CLASS[size],
    variant === 'onDark' ? 'text-primary-foreground' : 'text-primary',
  );

  return (
    <div
      className={cn('inline-flex items-center gap-3', className)}
      aria-label={ariaLabel}
      role="img"
    >
      <div className={iconWrapperClass}>
        <img
          src="/logo.png"
          alt=""
          width={iconSize}
          height={iconSize}
          style={{ width: iconSize, height: iconSize }}
          className="object-contain"
          draggable={false}
        />
      </div>
      {withWordmark && <span className={textClass}>Liga Bloco</span>}
    </div>
  );
}
