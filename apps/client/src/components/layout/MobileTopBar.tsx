import React from 'react';

export type MobileShellVariant = 'game' | 'canchas';

export interface MobileTopBarAction {
  icon: string;
  label: string;
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
    action: 'bg-surface-container-high text-primary',
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
      <div className="flex h-16 items-center justify-between gap-3 px-4">
        <button
          type="button"
          onClick={onBrandClick}
          className={`flex min-w-0 items-center gap-3 ${c.brandBtn}`}
        >
          <span className={`material-symbols-outlined text-[26px] ${c.brand}`}>sports_soccer</span>
          <span className="flex min-w-0 flex-col">
            <span className={`text-[10px] font-bold uppercase tracking-widest ${c.brand}`}>{brand}</span>
            <span className={`truncate text-lg font-extrabold uppercase leading-tight ${c.title}`}>{title}</span>
            {subtitle && <span className={`truncate text-[11px] ${c.subtitle}`}>{subtitle}</span>}
          </span>
        </button>

        {actions && actions.length > 0 && (
          <div className="flex shrink-0 items-center gap-2">
            {actions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={action.onClick}
                aria-label={action.label}
                className={`flex h-11 min-w-11 items-center justify-center gap-1 rounded-full px-3 text-[13px] font-bold transition-transform active:scale-95 ${c.action}`}
              >
                <span className="material-symbols-outlined text-[20px]">{action.icon}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
};
