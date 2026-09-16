import type { MobileShellVariant } from './MobileTopBar';

export interface MobileTab<T extends string> {
  id: T;
  label: string;
  icon: string;
}

interface MobileTabBarProps<T extends string> {
  variant: MobileShellVariant;
  tabs: MobileTab<T>[];
  activeTab: T;
  onSelect: (id: T) => void;
}

export function MobileTabBar<T extends string>({ variant, tabs, activeTab, onSelect }: MobileTabBarProps<T>) {
  const isCanchas = variant === 'canchas';
  const style = isCanchas
    ? { background: 'rgba(255,255,255,0.95)', borderColor: 'var(--b2b-line)', backdropFilter: 'blur(16px)' }
    : { backdropFilter: 'blur(16px)' };

  return (
    <nav
      className={`fixed inset-x-0 bottom-0 z-40 md:hidden pb-safe ${
        isCanchas ? 'border-t' : 'border-t border-white/10 bg-surface/90'
      }`}
      style={style}
    >
      <div className="flex items-stretch justify-around px-1">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          const activeClass = isCanchas
            ? 'text-[#15803d] font-bold'
            : 'text-primary font-bold';
          const inactiveClass = isCanchas ? 'text-[#64748b]' : 'text-on-surface-variant';
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelect(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex h-16 min-w-14 flex-1 flex-col items-center justify-center gap-1 transition-colors active:scale-95 ${
                isActive ? activeClass : inactiveClass
              }`}
            >
              <span className="material-symbols-outlined text-[22px]">{tab.icon}</span>
              <span className="text-[10px] leading-none">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
