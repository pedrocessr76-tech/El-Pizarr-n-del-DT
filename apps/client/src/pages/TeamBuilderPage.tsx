import React, { useState } from 'react';
import { Player, PlayerCard } from '../components/PlayerCard';

const MOCK_PLAYERS: Player[] = [
  { id: '1', name: 'Courtois', rating: 90, position: 'GK', nation: 'BEL', club: 'Real Madrid', rarity: 'legend', stats: { pac: 85, sho: 89, pas: 75, dri: 88, def: 52, phy: 88 } },
  { id: '2', name: 'Carvajal', rating: 86, position: 'LD', nation: 'ESP', club: 'Real Madrid', rarity: 'rare', stats: { pac: 82, sho: 60, pas: 78, dri: 80, def: 84, phy: 82 } },
  { id: '3', name: 'Rüdiger', rating: 88, position: 'DFC', nation: 'GER', club: 'Real Madrid', rarity: 'rare', stats: { pac: 82, sho: 54, pas: 71, dri: 72, def: 89, phy: 86 } },
  { id: '4', name: 'Araujo', rating: 87, position: 'DFC', nation: 'URU', club: 'FC Barcelona', rarity: 'rare', stats: { pac: 85, sho: 50, pas: 65, dri: 68, def: 88, phy: 87 } },
  { id: '5', name: 'Mendy', rating: 84, position: 'LI', nation: 'FRA', club: 'Real Madrid', rarity: 'common', stats: { pac: 92, sho: 64, pas: 75, dri: 80, def: 82, phy: 85 } },
  { id: '6', name: 'Valverde', rating: 89, position: 'MC', nation: 'URU', club: 'Real Madrid', rarity: 'legend', stats: { pac: 88, sho: 84, pas: 85, dri: 84, def: 80, phy: 85 } },
  { id: '7', name: 'Bellingham', rating: 91, position: 'MCO', nation: 'ENG', club: 'Real Madrid', rarity: 'legend', stats: { pac: 82, sho: 87, pas: 88, dri: 90, def: 78, phy: 85 } },
  { id: '8', name: 'Pedri', rating: 87, position: 'MC', nation: 'ESP', club: 'FC Barcelona', rarity: 'rare', stats: { pac: 78, sho: 72, pas: 89, dri: 89, def: 68, phy: 73 } },
  { id: '9', name: 'Rodrygo', rating: 86, position: 'ED', nation: 'BRA', club: 'Real Madrid', rarity: 'rare', stats: { pac: 89, sho: 82, pas: 80, dri: 88, def: 42, phy: 68 } },
  { id: '10', name: 'Mbappé', rating: 92, position: 'DC', nation: 'FRA', club: 'Real Madrid', rarity: 'legend', stats: { pac: 97, sho: 90, pas: 80, dri: 92, def: 36, phy: 78 } },
  { id: '11', name: 'Vinicius Jr', rating: 91, position: 'EI', nation: 'BRA', club: 'Real Madrid', rarity: 'legend', stats: { pac: 95, sho: 84, pas: 81, dri: 92, def: 29, phy: 68 } },
];

export const TeamBuilderPage: React.FC = () => {
  const [formation, setFormation] = useState<'4-3-3' | '4-4-2' | '3-5-2'>('4-3-3');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const teamOvr = Math.round(
    MOCK_PLAYERS.reduce((acc, p) => acc + p.rating, 0) / MOCK_PLAYERS.length
  );
  const chemistry = 33; // Max 33 chemistry score

  return (
    <div className="min-h-[calc(100vh-73px)] pitch-gradient pitch-pattern p-6 flex flex-col items-center">
      {/* Top Tactical Dashboard */}
      <div className="w-full max-w-7xl glass-panel rounded-2xl p-6 mb-6 flex flex-wrap items-center justify-between gap-4 border border-white/10">
        <div>
          <h2 className="font-montserrat font-extrabold text-2xl text-white tracking-wide flex items-center gap-2">
            <span className="material-symbols-outlined text-[#a5d0b9]">grid_view</span>
            Pizarrón Táctico
          </h2>
          <p className="text-xs text-gray-400">Configura tu alineación y analiza el rendimiento general.</p>
        </div>

        {/* Formation Switcher */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-montserrat font-semibold text-gray-300 uppercase">Formación:</label>
          <select
            value={formation}
            onChange={(e) => setFormation(e.target.value as any)}
            className="bg-[#060e20] border border-white/20 text-white text-sm font-montserrat font-bold rounded-lg px-3 py-1.5 focus:border-[#a5d0b9]"
          >
            <option value="4-3-3">4-3-3 (Ofensivo)</option>
            <option value="4-4-2">4-4-2 (Clásico)</option>
            <option value="3-5-2">3-5-2 (Carrileros)</option>
          </select>
        </div>

        {/* Team Stats Indicators */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 bg-[#131b2e] px-4 py-2 rounded-xl border border-white/10">
            <span className="material-symbols-outlined text-[#e9c349]">stars</span>
            <div>
              <div className="text-[10px] text-gray-400 uppercase font-medium">VALORACIÓN OVR</div>
              <div className="font-montserrat font-black text-xl text-[#e9c349] leading-none">{teamOvr}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-[#131b2e] px-4 py-2 rounded-xl border border-white/10">
            <span className="material-symbols-outlined text-[#a5d0b9]">bolt</span>
            <div>
              <div className="text-[10px] text-gray-400 uppercase font-medium">QUÍMICA</div>
              <div className="font-montserrat font-black text-xl text-[#a5d0b9] leading-none">{chemistry} / 33</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Pitch & Sidebar Container */}
      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tactical Field Container (3 columns) */}
        <div className="lg:col-span-3 glass-panel rounded-3xl p-8 border border-white/15 relative flex flex-col justify-between items-center min-h-[640px] overflow-hidden bg-gradient-to-b from-[#081c15] to-[#1b4332] shadow-2xl">
          {/* Field Lines overlay */}
          <div className="absolute inset-4 border-2 border-white/10 rounded-2xl pointer-events-none flex flex-col justify-between">
            {/* Penalty box Top */}
            <div className="w-64 h-32 border-b-2 border-x-2 border-white/10 mx-auto rounded-b-2xl"></div>
            {/* Center Line & Circle */}
            <div className="w-full border-t-2 border-white/10 relative flex items-center justify-center">
              <div className="w-36 h-36 border-2 border-white/10 rounded-full absolute -top-18"></div>
            </div>
            {/* Penalty box Bottom */}
            <div className="w-64 h-32 border-t-2 border-x-2 border-white/10 mx-auto rounded-t-2xl"></div>
          </div>

          {/* Player Lineup Positions */}
          <div className="relative z-10 w-full flex flex-col justify-between h-full gap-8 py-4">
            {/* Delanteros */}
            <div className="flex justify-around w-full">
              {MOCK_PLAYERS.slice(8, 11).map((player) => (
                <PlayerCard key={player.id} player={player} variant="mini" onClick={() => setSelectedPlayer(player)} />
              ))}
            </div>

            {/* Mediocampistas */}
            <div className="flex justify-around w-full">
              {MOCK_PLAYERS.slice(5, 8).map((player) => (
                <PlayerCard key={player.id} player={player} variant="mini" onClick={() => setSelectedPlayer(player)} />
              ))}
            </div>

            {/* Defensas */}
            <div className="flex justify-around w-full">
              {MOCK_PLAYERS.slice(1, 5).map((player) => (
                <PlayerCard key={player.id} player={player} variant="mini" onClick={() => setSelectedPlayer(player)} />
              ))}
            </div>

            {/* Arquero */}
            <div className="flex justify-center w-full">
              {MOCK_PLAYERS.slice(0, 1).map((player) => (
                <PlayerCard key={player.id} player={player} variant="mini" onClick={() => setSelectedPlayer(player)} />
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Panel (1 column) */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* Selected Player Detail Card */}
          <div className="glass-panel rounded-2xl p-6 border border-white/10 flex flex-col items-center">
            <h3 className="font-montserrat font-bold text-sm text-gray-300 uppercase tracking-wider mb-4 self-start">
              Detalles de Jugador
            </h3>
            {selectedPlayer ? (
              <PlayerCard player={selectedPlayer} variant="full" />
            ) : (
              <div className="text-center py-12 text-gray-400 text-xs">
                <span className="material-symbols-outlined text-4xl block mb-2 opacity-50">touch_app</span>
                Selecciona un jugador en el campo para ver sus estadísticas completas.
              </div>
            )}
          </div>

          {/* Quick Actions Panel */}
          <div className="glass-panel rounded-2xl p-6 border border-white/10">
            <h3 className="font-montserrat font-bold text-sm text-white mb-3">Acciones Tácticas</h3>
            <button
              onClick={() => alert('Alineación guardada')}
              className="w-full bg-[#a5d0b9] text-[#0e3727] font-montserrat font-bold py-2.5 rounded-xl hover:bg-[#c1ecd4] transition-colors mb-2 text-sm shadow-md"
            >
              Guardar Alineación
            </button>
            <button
              onClick={() => alert('Sugerencia táctica optimizada')}
              className="w-full bg-[#222a3d] text-[#a5d0b9] border border-white/10 font-montserrat font-semibold py-2 rounded-xl hover:bg-[#2d3449] transition-colors text-xs"
            >
              Optimizar Química
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
