import React from 'react';

export type MobileShellVariant = 'game' | 'canchas';

export interface MobileTopBarAction {
  icon: string;
  label?: string;
  onClick?: () => void;
}

interface MobileTopBarProps {
  variant: MobileShellVariant;
  brand: string;
  title: string;
  subtitle?: string;
  actions?: MobileTopBarAction[];
  onBrandClick?: () => void;
}

const variantClasses: Record<MobileShellVariant, {
  bar: string;
  brand: string;
  title: string;
  subtitle: string;
  brandBtn: string;
  action: string;
}> = {
  game: {
    bar: 'bg-surface/80 border-b border-white/10',
    brand: 'text-primary',
    title: 'text-on-surface',
    subtitle: 'text-on-surface-variant',
    brandBtn: 'text-left',
    action: 'bg-surface-container-high border border-white/10 text-primary',
  },
  canchas: {
    bar: 'border-b',
    brand: 'text-[#15803d]',
    title: 'text-[#0f172a]',
    subtitle: 'text-[#64748b]',
    brandBtn: 'text-left',
    action: 'bg-white text-[#0f172a] border border-[#e2e8f0]',
  },
};

export const MobileTopBar: React.FC<MobileTopBarProps> = ({
  variant,
  brand,
  title,
  subtitle,
  actions,
  onBrandClick,
}) => {
  const c = variantClasses[variant];
  const style =
    variant === 'canchas'
      ? { background: 'rgba(255,255,255,0.92)', borderColor: 'var(--b2b-line)', backdropFilter: 'blur(16px)' }
      : { backdropFilter: 'blur(16px)' };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 md:hidden pt-safe ${c.bar}`}
      style={style}
    >
      <div className="flex h-16 items-stretch justify-between gap-2 px-3">
        {/* Marca a la izquierda: ícono + nombre de la app */}
        <button
          type="button"
          onClick={onBrandClick}
          className={`flex min-w-0 items-center gap-2.5 ${c.brandBtn}`}
        >
          <span className={`material-symbols-outlined text-[24px] ${c.brand} shrink-0`}>sports_soccer</span>
          <span className="flex min-w-0 flex-col justify-center leading-none">
            <span className={`truncate text-[13px] font-extrabold uppercase tracking-tight ${c.title}`}>{brand}</span>
            <span className={`truncate text-[10px] uppercase tracking-widest mt-1 ${c.subtitle}`}>{title}</span>
            {subtitle && <span className={`truncate text-[10px] mt-0.5 ${c.subtitle}`}>{subtitle}</span>}
          </span>
        </button>

        {/* Acciones a la derecha, alineadas sin desbordar */}
        {actions && actions.length > 0 && (
          <div className="flex shrink-0 items-center gap-1.5">
            {actions.map((action) => (
              <button
                key={action.label ?? action.icon}
                type="button"
                onClick={action.onClick}
                aria-label={action.label ?? action.icon}
                className={`flex h-9 items-center justify-center gap-1 rounded-full px-2.5 text-[11px] font-bold uppercase tracking-wide transition-transform active:scale-95 ${c.action}`}
              >
                <span className="material-symbols-outlined text-[17px]">{action.icon}</span>
                {action.label && <span className="leading-none">{action.label}</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
};