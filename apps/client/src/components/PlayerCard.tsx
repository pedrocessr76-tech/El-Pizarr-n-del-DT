import React from 'react';

export interface PlayerStats {
  pac: number;
  sho: number;
  pas: number;
  dri: number;
  def: number;
  phy: number;
}

export interface Player {
  id: string;
  name: string;
  rating: number;
  position: string;
  nation: string;
  club: string;
  rarity: 'common' | 'rare' | 'legend';
  stats: PlayerStats;
  avatarUrl?: string;
}

interface PlayerCardProps {
  player: Player;
  variant?: 'full' | 'mini';
  onClick?: () => void;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ player, variant = 'full', onClick }) => {
  const getBorderColor = () => {
    switch (player.rarity) {
      case 'legend':
        return 'border-[#e9c349] bg-gradient-to-b from-[#1b4332] to-[#0b1326] shadow-[0_0_20px_rgba(233,195,73,0.3)]';
      case 'rare':
        return 'border-[#a5d0b9] bg-gradient-to-b from-[#171f33] to-[#060e20] shadow-[0_0_15px_rgba(165,208,185,0.2)]';
      default:
        return 'border-[#414844] bg-[#131b2e]';
    }
  };

  if (variant === 'mini') {
    return (
      <div
        onClick={onClick}
        className={`cursor-pointer rounded-xl p-2 border ${getBorderColor()} flex flex-col items-center justify-center transition-all hover:scale-105 hover:z-20 w-24 h-28 text-center relative overflow-hidden`}
      >
        <div className="flex items-center justify-between w-full text-[11px] font-montserrat font-bold px-1">
          <span className="text-[#e9c349]">{player.rating}</span>
          <span className="text-gray-300">{player.position}</span>
        </div>
        <div className="w-10 h-10 my-1 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
          <span className="material-symbols-outlined text-gray-300 text-xl">person</span>
        </div>
        <div className="font-montserrat font-bold text-[10px] text-white truncate w-full px-1">
          {player.name}
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`relative cursor-pointer rounded-2xl p-4 border ${getBorderColor()} flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl w-56 h-80 overflow-hidden group`}
    >
      {/* Header Info */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col items-start">
          <span className="font-montserrat font-black text-3xl text-[#e9c349] leading-none tracking-tight">
            {player.rating}
          </span>
          <span className="font-montserrat font-bold text-sm text-gray-300 tracking-wider">
            {player.position}
          </span>
        </div>
        <div className="text-right">
          <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-gray-300 font-medium">
            {player.nation}
          </span>
        </div>
      </div>

      {/* Visual Avatar */}
      <div className="relative my-2 h-28 flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b1326] via-transparent to-transparent z-10 opacity-70"></div>
        <div className="w-20 h-20 rounded-full bg-[#222a3d] border border-white/10 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
          <span className="material-symbols-outlined text-gray-400 text-5xl">person</span>
        </div>
      </div>

      {/* Identity */}
      <div className="text-center z-20 mb-2">
        <h4 className="font-montserrat font-bold text-base text-white truncate tracking-wide">
          {player.name}
        </h4>
        <p className="text-[11px] text-gray-400 font-medium">{player.club}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 pt-2 border-t border-white/10 text-xs font-montserrat z-20 bg-black/20 p-2 rounded-lg">
        <div className="flex justify-between">
          <span className="text-gray-400 font-semibold">PAC</span>
          <span className="font-bold text-white">{player.stats.pac}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400 font-semibold">DRI</span>
          <span className="font-bold text-white">{player.stats.dri}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400 font-semibold">SHO</span>
          <span className="font-bold text-white">{player.stats.sho}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400 font-semibold">DEF</span>
          <span className="font-bold text-white">{player.stats.def}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400 font-semibold">PAS</span>
          <span className="font-bold text-white">{player.stats.pas}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400 font-semibold">PHY</span>
          <span className="font-bold text-white">{player.stats.phy}</span>
        </div>
      </div>
    </div>
  );
};
