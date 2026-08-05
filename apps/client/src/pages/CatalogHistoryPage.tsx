import React, { useState } from 'react';
import { Player, PlayerCard } from '../components/PlayerCard';

interface MatchHistoryItem {
  id: string;
  opponent: string;
  myScore: number;
  oppScore: number;
  result: 'W' | 'L' | 'D';
  date: string;
  formation: string;
}

const MOCK_MATCHES: MatchHistoryItem[] = [
  { id: '1', opponent: 'Real Madrid F.C.', myScore: 3, oppScore: 1, result: 'W', date: '04 Ago 2026', formation: '4-3-3' },
  { id: '2', opponent: 'Boca Juniors', myScore: 2, oppScore: 2, result: 'D', date: '03 Ago 2026', formation: '4-4-2' },
  { id: '3', opponent: 'Manchester City', myScore: 1, oppScore: 2, result: 'L', date: '01 Ago 2026', formation: '3-5-2' },
  { id: '4', opponent: 'Bayern München', myScore: 4, oppScore: 0, result: 'W', date: '29 Jul 2026', formation: '4-3-3' },
];

const MOCK_CATALOG_PLAYERS: Player[] = [
  { id: '1', name: 'Mbappé', rating: 92, position: 'DC', nation: 'FRA', club: 'Real Madrid', rarity: 'legend', stats: { pac: 97, sho: 90, pas: 80, dri: 92, def: 36, phy: 78 } },
  { id: '2', name: 'Bellingham', rating: 91, position: 'MCO', nation: 'ENG', club: 'Real Madrid', rarity: 'legend', stats: { pac: 82, sho: 87, pas: 88, dri: 90, def: 78, phy: 85 } },
  { id: '3', name: 'Vinicius Jr', rating: 91, position: 'EI', nation: 'BRA', club: 'Real Madrid', rarity: 'legend', stats: { pac: 95, sho: 84, pas: 81, dri: 92, def: 29, phy: 68 } },
  { id: '4', name: 'Courtois', rating: 90, position: 'GK', nation: 'BEL', club: 'Real Madrid', rarity: 'legend', stats: { pac: 85, sho: 89, pas: 75, dri: 88, def: 52, phy: 88 } },
  { id: '5', name: 'Valverde', rating: 89, position: 'MC', nation: 'URU', club: 'Real Madrid', rarity: 'rare', stats: { pac: 88, sho: 84, pas: 85, dri: 84, def: 80, phy: 85 } },
  { id: '6', name: 'Rüdiger', rating: 88, position: 'DFC', nation: 'GER', club: 'Real Madrid', rarity: 'rare', stats: { pac: 82, sho: 54, pas: 71, dri: 72, def: 89, phy: 86 } },
  { id: '7', name: 'Pedri', rating: 87, position: 'MC', nation: 'ESP', club: 'FC Barcelona', rarity: 'rare', stats: { pac: 78, sho: 72, pas: 89, dri: 89, def: 68, phy: 73 } },
  { id: '8', name: 'Mendy', rating: 84, position: 'LI', nation: 'FRA', club: 'Real Madrid', rarity: 'common', stats: { pac: 92, sho: 64, pas: 75, dri: 80, def: 82, phy: 85 } },
];

export const CatalogHistoryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'history' | 'catalog'>('catalog');
  const [rarityFilter, setRarityFilter] = useState<'all' | 'legend' | 'rare' | 'common'>('all');

  const filteredPlayers = MOCK_CATALOG_PLAYERS.filter(
    (p) => rarityFilter === 'all' || p.rarity === rarityFilter
  );

  return (
    <div className="min-h-[calc(100vh-73px)] pitch-gradient pitch-pattern p-6 flex flex-col items-center">
      {/* Top Header & Tab Control */}
      <div className="w-full max-w-7xl glass-panel rounded-2xl p-6 mb-8 border border-white/10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-montserrat font-extrabold text-2xl text-white tracking-wide">
            Historial & Catálogo Élite
          </h2>
          <p className="text-xs text-gray-400">Revisa tu historial de partidos o explora la colección completa de cartas.</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[#060e20] p-1.5 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-5 py-2 rounded-lg text-sm font-montserrat font-bold transition-all ${
              activeTab === 'catalog'
                ? 'bg-[#1b4332] text-[#a5d0b9] border border-[#a5d0b9]/30 shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Todas las Cartas
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-5 py-2 rounded-lg text-sm font-montserrat font-bold transition-all ${
              activeTab === 'history'
                ? 'bg-[#1b4332] text-[#a5d0b9] border border-[#a5d0b9]/30 shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Historial de Partidos
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="w-full max-w-7xl">
        {activeTab === 'catalog' ? (
          <div>
            {/* Filter Bar */}
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm font-montserrat font-semibold text-gray-300">
                Mostrando <span className="text-[#a5d0b9]">{filteredPlayers.length}</span> cartas de jugador
              </span>

              <div className="flex items-center gap-2">
                {(['all', 'legend', 'rare', 'common'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRarityFilter(r)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-montserrat font-semibold capitalize border transition-all ${
                      rarityFilter === r
                        ? 'bg-[#a5d0b9] text-[#0e3727] border-[#a5d0b9]'
                        : 'bg-[#131b2e] text-gray-400 border-white/10 hover:text-white'
                    }`}
                  >
                    {r === 'all' ? 'Todas' : r}
                  </button>
                ))}
              </div>
            </div>

            {/* Players Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 justify-items-center">
              {filteredPlayers.map((player) => (
                <PlayerCard key={player.id} player={player} variant="full" />
              ))}
            </div>
          </div>
        ) : (
          /* Match History View */
          <div className="glass-panel rounded-2xl p-6 border border-white/10">
            <h3 className="font-montserrat font-extrabold text-xl text-white mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#a5d0b9]">history</span>
              Últimas Partidas Jugadas
            </h3>

            <div className="space-y-4">
              {MOCK_MATCHES.map((match) => (
                <div
                  key={match.id}
                  className="bg-[#131b2e] border border-white/10 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4 hover:border-white/20 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center font-montserrat font-black text-lg ${
                        match.result === 'W'
                          ? 'bg-[#1b4332] text-[#a5d0b9] border border-[#a5d0b9]/30'
                          : match.result === 'L'
                          ? 'bg-[#93000a]/40 text-[#ffb4ab] border border-[#ffb4ab]/30'
                          : 'bg-[#374b42] text-gray-300'
                      }`}
                    >
                      {match.result}
                    </div>

                    <div>
                      <h4 className="font-montserrat font-bold text-white text-base">{match.opponent}</h4>
                      <p className="text-xs text-gray-400">
                        Formación: <span className="text-gray-200">{match.formation}</span> • {match.date}
                      </p>
                    </div>
                  </div>

                  <div className="font-montserrat font-black text-2xl text-white tracking-widest bg-[#060e20] px-4 py-2 rounded-lg border border-white/10">
                    {match.myScore} - {match.oppScore}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
