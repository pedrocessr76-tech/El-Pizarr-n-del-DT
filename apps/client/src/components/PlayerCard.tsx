import React from 'react';
import type { Player } from '../../../../packages/shared/types/models';

interface PlayerMiniCardProps {
  player: Player;
  rating: number;
  onClick?: () => void;
  isRelocating?: boolean;
  className?: string;
}

// Mini carta del jugador (mismo estilo que PlayerCard pero compacta).
// Muestra el OVR, la posición, el icono y el nombre; sin las stats detalladas.
export const PlayerMiniCard: React.FC<PlayerMiniCardProps> = ({
  player,
  rating,
  onClick,
  isRelocating,
  className,
}) => {
  const rarity = getRarity(rating);
  const isGold = rarity === 'gold';
  const isSilver = rarity === 'silver';

  const textRating = isGold ? 'text-[#FFDF00] drop-shadow-[0_0_6px_rgba(255,223,0,0.8)]' : isSilver ? 'text-on-surface' : 'text-[#CD7F32] drop-shadow-[0_0_6px_rgba(205,127,50,0.8)]';
  const nameColor = isGold ? 'text-on-surface' : isSilver ? 'text-on-surface-variant' : 'text-[#CD7F32]';
  const border = isGold ? 'border-[#FFDF00]/50' : isSilver ? 'border-outline-variant/50' : 'border-[#CD7F32]/50';
  const bg = isGold
    ? 'bg-gradient-to-br from-[#FFDF00]/15 to-surface-container'
    : isSilver
      ? 'bg-surface-container'
      : 'bg-gradient-to-br from-[#CD7F32]/15 to-surface-container';
  const iconColor = isGold ? 'text-tertiary' : isSilver ? 'text-on-surface-variant opacity-80' : 'text-[#CD7F32] opacity-80';

  return (
    <button
      onClick={onClick}
      type="button"
      title={`${player.name} · ${rating} OVR`}
      className={`relative aspect-[2/3] rounded-lg overflow-hidden ${bg} ${border} shadow-lg flex flex-col items-center px-1 pt-1 pb-1 group cursor-pointer transition-all hover:scale-105 ${
        isRelocating ? 'ring-2 ring-tertiary' : ''
      } ${className || 'w-12'}`}
    >
      {isGold && <div className="absolute inset-0 metallic-sheen opacity-40 z-0 pointer-events-none"></div>}
      <div className="relative z-10 flex flex-col items-center w-full">
        <div className="flex items-baseline gap-1 w-full justify-center">
          <span className={`font-stat-value text-[16px] leading-none ${textRating}`}>{rating}</span>
          <span className="font-label-md text-[7px] text-on-surface-variant uppercase">{player.position}</span>
        </div>
        <div className="flex-1 flex items-center justify-center py-0.5">
          <span className={`material-symbols-outlined text-[22px] ${iconColor}`}>person</span>
        </div>
        <div className={`w-full text-center border-t ${isGold ? 'border-[#FFDF00]/30' : 'border-outline-variant/30'} pt-0.5 mt-auto`}>
          <h3
            className={`font-label-md text-[8px] leading-tight ${nameColor} uppercase truncate w-full`}
          >
            {player.name}
          </h3>
        </div>
      </div>
    </button>
  );
};

interface PlayerCardProps {
  player: Player;
}

// Orden de estadísticas que se muestra en la carta (coincide con el mock)
const STAT_LABELS: { key: keyof Player['stats']; label: string }[] = [
  { key: 'pace', label: 'PAC' },
  { key: 'dribbling', label: 'DRI' },
  { key: 'shooting', label: 'SHO' },
  { key: 'defending', label: 'DEF' },
  { key: 'passing', label: 'PAS' },
  { key: 'physical', label: 'PHY' },
];

// Determina la rareza de la carta según el rating
export const getRarity = (rating: number) => {
  if (rating >= 85) return 'gold';
  if (rating >= 75) return 'silver';
  return 'bronze';
};

const RARITY_COLORS: Record<string, { border: string; text: string; shadow: string; bg: string }> = {
  gold: {
    border: 'border-[#FFDF00]/50',
    text: 'text-[#FFDF00]',
    shadow: 'shadow-[0_0_15px_rgba(255,223,0,0.4)]',
    bg: 'bg-gradient-to-br from-[#FFDF00]/20 to-surface-container',
  },
  silver: {
    border: 'border-outline-variant/50',
    text: 'text-on-surface',
    shadow: 'shadow-[0_0_15px_rgba(192,192,192,0.3)]',
    bg: 'bg-surface-container',
  },
  bronze: {
    border: 'border-[#CD7F32]/50',
    text: 'text-[#CD7F32]',
    shadow: 'shadow-[0_0_15px_rgba(205,127,50,0.4)]',
    bg: 'bg-gradient-to-br from-[#CD7F32]/20 to-surface-container',
  },
};

export const PlayerCard: React.FC<PlayerCardProps> = ({ player }) => {
  const rarity = getRarity(player.rating ?? 50);
  const colors = RARITY_COLORS[rarity];
  const isGold = rarity === 'gold';
  const isSilver = rarity === 'silver';

  return (
    <article
      className={`relative aspect-[2/3] rounded-xl overflow-hidden ${colors.bg} ${colors.border} deep-field-shadow group cursor-pointer transform hover:scale-105 hover:-translate-y-2 transition-all duration-300`}
    >
      {isGold && <div className="absolute inset-0 metallic-sheen opacity-50 z-0"></div>}
      {isSilver && <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity z-0"></div>}

      <div className="absolute inset-0 z-10 flex flex-col p-3">
        {/* Rating & Position */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex flex-col items-center">
            <span
              className={`font-stat-value text-[24px] ${
                isGold
                  ? 'text-[#FFDF00] drop-shadow-[0_0_8px_rgba(255,223,0,0.8)]'
                  : isSilver
                    ? 'text-on-surface'
                    : 'text-[#CD7F32] drop-shadow-[0_0_8px_rgba(205,127,50,0.8)]'
              }`}
            >
              {player.rating}
            </span>
            <span className="font-label-md text-[10px] text-on-surface-variant">{player.position}</span>
          </div>
        </div>

        {/* Player Icon */}
        <div className="flex-1 relative flex items-center justify-center">
          <span
            className={`material-symbols-outlined text-[64px] ${
              isGold ? 'text-tertiary' : isSilver ? 'text-on-surface-variant opacity-80' : 'text-[#CD7F32] opacity-80'
            }`}
          >
            person
          </span>
        </div>

        {/* Player Name */}
        <div className={`text-center border-b ${isGold ? 'border-[#FFDF00]/30' : 'border-outline-variant/30'} pb-1 mb-1`}>
          <h3
            className={`font-headline-sm text-[14px] ${
              isGold ? 'text-on-surface' : isSilver ? 'text-on-surface-variant' : 'text-[#CD7F32]'
            } uppercase tracking-tight`}
          >
            {player.name}
          </h3>
        </div>

        {/* Stats Grid */}
        <div className={`grid grid-cols-2 gap-x-2 gap-y-1 mt-auto ${isSilver ? 'opacity-80' : ''}`}>
          {STAT_LABELS.map((stat) => (
            <div key={stat.label} className="flex justify-between items-center">
              <span className="font-label-md text-[8px] text-on-surface-variant">{stat.label}</span>
              <span className={`font-stat-value text-[12px] ${isGold ? 'text-on-surface' : isSilver ? 'text-on-surface-variant' : 'text-[#CD7F32]'}`}>
                {player.stats[stat.key as keyof Player['stats']]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
};