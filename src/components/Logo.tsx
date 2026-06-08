import { cn } from '@/lib/utils';

/**
 * Logo da marca Liga Bloco.
 *
 * O ícone (PNG com fundo RGBA transparente) em variant="onDark" vai direto
 * sobre o gradiente, com drop-shadow para contraste. Em variant="onLight"
 * o ícone fica dentro de um container branco para evitar halo.
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

  const textClass = cn(
    'font-heading font-bold tracking-tight',
    WORDMARK_CLASS[size],
    variant === 'onDark' ? 'text-primary-foreground' : 'text-primary',
  );

  const iconWrapperClass = cn(
    'flex items-center justify-center shrink-0 overflow-hidden rounded-xl p-1',
    'bg-white ring-1 ring-border shadow-xs',
  );

  return (
    <div
      className={cn('inline-flex items-center gap-3', className)}
      aria-label={ariaLabel}
      role="img"
    >
      {variant === 'onDark' ? (
        <img
          src="/logo.png"
          alt=""
          width={iconSize}
          height={iconSize}
          style={{ width: iconSize, height: iconSize, filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.35))' }}
          className="object-contain shrink-0"
          draggable={false}
        />
      ) : (
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
      )}
      {withWordmark && <span className={textClass}>Liga Bloco</span>}
    </div>
  );
}
