import React from 'react';

interface BracketMatch {
  id: string;
  round: 'cuartos' | 'semis' | 'final';
  team1: { name: string; score: number; winner?: boolean };
  team2: { name: string; score: number; winner?: boolean };
  status: 'Finalizado' | 'En Vivo' | 'Pendiente';
}

const BRACKET_DATA: BracketMatch[] = [
  // Cuartos de Final
  { id: 'q1', round: 'cuartos', team1: { name: 'Real Madrid', score: 3, winner: true }, team2: { name: 'Boca Juniors', score: 1 }, status: 'Finalizado' },
  { id: 'q2', round: 'cuartos', team1: { name: 'Man City', score: 2, winner: true }, team2: { name: 'Flamengo', score: 0 }, status: 'Finalizado' },
  { id: 'q3', round: 'cuartos', team1: { name: 'Bayern München', score: 4, winner: true }, team2: { name: 'Juventus', score: 2 }, status: 'Finalizado' },
  { id: 'q4', round: 'cuartos', team1: { name: 'Barcelona', score: 2 }, team2: { name: 'PSG', score: 3, winner: true }, status: 'Finalizado' },

  // Semifinales
  { id: 's1', round: 'semis', team1: { name: 'Real Madrid', score: 2, winner: true }, team2: { name: 'Man City', score: 1 }, status: 'Finalizado' },
  { id: 's2', round: 'semis', team1: { name: 'Bayern München', score: 1 }, team2: { name: 'PSG', score: 2, winner: true }, status: 'Finalizado' },

  // Gran Final
  { id: 'f1', round: 'final', team1: { name: 'Real Madrid', score: 3, winner: true }, team2: { name: 'PSG', score: 1 }, status: 'Finalizado' },
];

export const TournamentBracketPage: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-73px)] pitch-gradient pitch-pattern p-6 flex flex-col items-center">
      {/* Header Banner */}
      <div className="w-full max-w-7xl glass-panel rounded-2xl p-8 mb-8 border border-white/10 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <span className="material-symbols-outlined text-9xl text-[#e9c349]">emoji_events</span>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3c2f00] border border-[#e9c349]/40 text-[#e9c349] text-xs font-montserrat font-bold uppercase tracking-widest mb-3">
          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: '"FILL" 1' }}>emoji_events</span>
          Torneo de Eliminación Directa
        </div>

        <h2 className="font-montserrat font-black text-4xl text-transparent bg-clip-text bg-gradient-to-r from-white via-[#e9c349] to-[#cba72f] tracking-tight mb-2">
          COPA ÉLITE 2026
        </h2>
        <p className="text-sm text-gray-300 max-w-lg mx-auto">
          Cuadro completo de eliminatorias. Observa la ruta hacia el campeonato supremo.
        </p>
      </div>

      {/* Bracket Tree Canvas Container */}
      <div className="w-full max-w-7xl custom-scrollbar overflow-x-auto pb-6">
        <div className="min-w-[900px] grid grid-cols-3 gap-8 items-center relative py-4">
          {/* Column 1: Cuartos de Final */}
          <div className="flex flex-col gap-6">
            <h3 className="font-montserrat font-extrabold text-sm text-gray-400 uppercase tracking-wider text-center mb-2">
              Cuartos de Final
            </h3>
            {BRACKET_DATA.filter((m) => m.round === 'cuartos').map((match) => (
              <BracketCard key={match.id} match={match} />
            ))}
          </div>

          {/* Column 2: Semifinales */}
          <div className="flex flex-col gap-16 justify-center">
            <h3 className="font-montserrat font-extrabold text-sm text-[#a5d0b9] uppercase tracking-wider text-center mb-2">
              Semifinales
            </h3>
            {BRACKET_DATA.filter((m) => m.round === 'semis').map((match) => (
              <BracketCard key={match.id} match={match} />
            ))}
          </div>

          {/* Column 3: Gran Final */}
          <div className="flex flex-col gap-6 justify-center">
            <h3 className="font-montserrat font-extrabold text-sm text-[#e9c349] uppercase tracking-wider text-center mb-2">
              Gran Final
            </h3>
            {BRACKET_DATA.filter((m) => m.round === 'final').map((match) => (
              <BracketCard key={match.id} match={match} isFinal />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const BracketCard: React.FC<{ match: BracketMatch; isFinal?: boolean }> = ({ match, isFinal }) => {
  return (
    <div
      className={`glass-panel rounded-xl p-4 border transition-all ${
        isFinal
          ? 'border-[#e9c349] shadow-[0_0_20px_rgba(233,195,73,0.3)] bg-gradient-to-b from-[#1b4332] to-[#0b1326]'
          : 'border-white/10 bg-[#131b2e]'
      }`}
    >
      <div className="flex justify-between items-center text-[10px] text-gray-400 font-montserrat uppercase mb-2">
        <span>Partido {match.id.toUpperCase()}</span>
        <span className="text-[#a5d0b9] font-bold">{match.status}</span>
      </div>

      <div className="space-y-2">
        {/* Team 1 */}
        <div
          className={`flex justify-between items-center p-2 rounded-lg ${
            match.team1.winner ? 'bg-[#1b4332]/60 border border-[#a5d0b9]/30 font-bold text-white' : 'text-gray-400'
          }`}
        >
          <span className="font-montserrat text-sm truncate">{match.team1.name}</span>
          <span className="font-montserrat font-black text-sm text-[#e9c349]">{match.team1.score}</span>
        </div>

        {/* Team 2 */}
        <div
          className={`flex justify-between items-center p-2 rounded-lg ${
            match.team2.winner ? 'bg-[#1b4332]/60 border border-[#a5d0b9]/30 font-bold text-white' : 'text-gray-400'
          }`}
        >
          <span className="font-montserrat text-sm truncate">{match.team2.name}</span>
          <span className="font-montserrat font-black text-sm text-[#e9c349]">{match.team2.score}</span>
        </div>
      </div>
    </div>
  );
};
