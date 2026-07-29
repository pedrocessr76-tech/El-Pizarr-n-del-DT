import { useState } from 'react';

interface CaptainScreenProps {
  onNext?: () => void;
}

export function CaptainScreen({ onNext }: CaptainScreenProps) {
  const [selectedCaptain, setSelectedCaptain] = useState<string>('MESSI');

  const captains = [
    { name: 'MBAPPÉ', rating: 96, colorClass: 'text-[#ffd700]', bgCard: 'bg-[#2e2a1e] border-[#ffd700]/30', stats: { pac: 97, sho: 94, pas: 88, dri: 92, def: 45, phy: 83 } },
    { name: 'DE BRUYNE', rating: 94, colorClass: 'text-[#c6c6c6]', bgCard: 'bg-[#25282d] border-[#c6c6c6]/30', stats: { pac: 76, sho: 88, pas: 95, dri: 87, def: 64, phy: 78 } },
    { name: 'MESSI', rating: 98, isRecommended: true, colorClass: 'text-[#ffd1ac]', bgCard: 'bg-[#393528] border-[#ffdcc1]/60', stats: { pac: 85, sho: 92, pas: 97, dri: 99, def: 40, phy: 70 } },
    { name: 'HAALAND', rating: 95, colorClass: 'text-[#ffd700]', bgCard: 'bg-[#2e2a1e] border-[#ffd700]/30', stats: { pac: 92, sho: 96, pas: 68, dri: 82, def: 48, phy: 90 } },
    { name: 'ZIDANE', rating: 91, colorClass: 'text-[#ffdcc1]', bgCard: 'bg-[#332b26] border-[#ffdcc1]/30', stats: { pac: 82, sho: 86, pas: 92, dri: 93, def: 65, phy: 84 } },
  ];

  return (
    <div className="relative bg-[#111316] min-h-screen font-body-md text-[#e2e2e6]">
      {/* Background Image */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center opacity-25 scale-105 blur-sm pointer-events-none"
        style={{ backgroundImage: "url('/images/stadium_bg.jpg')" }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-[#111316]/90 via-[#111316]/95 to-[#111316] pointer-events-none" />

      {/* Main Selection Container */}
      <div className="relative z-10 px-8 py-12 flex flex-col items-center min-h-screen justify-center">
        {/* Header Section */}
        <div className="w-full max-w-6xl mb-10 text-center lg:text-left flex flex-col lg:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-2">
              <div className="h-[2px] w-12 bg-[#39ff14]" />
              <span className="text-xs text-[#39ff14] uppercase tracking-[0.2em] font-bold">
                Selección de Élite
              </span>
            </div>
            <h1 className="text-3xl lg:text-5xl text-white font-extrabold tracking-tight">
              Elige a tu <span className="text-[#39ff14]">Capitán</span>
            </h1>
            <p className="text-sm text-gray-400 max-w-2xl mt-2 leading-relaxed">
              El líder de tu escuadra define la química y el carácter del equipo. Selecciona una leyenda para guiar a tu plantilla hacia la gloria.
            </p>
          </div>

          <button
            onClick={onNext}
            className="bg-[#39ff14] text-[#111316] hover:bg-[#79ff5b] text-base px-8 py-4 rounded-xl shadow-[0_0_25px_-5px_#39ff14] transition-all flex items-center gap-2 font-black flex-shrink-0 cursor-pointer"
          >
            <span>CONFIRMAR CAPITÁN</span>
            <span className="material-symbols-outlined text-[24px]">arrow_forward</span>
          </button>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 w-full max-w-7xl">
          {captains.map((cap) => {
            const isSelected = selectedCaptain === cap.name;
            return (
              <button
                key={cap.name}
                onClick={() => setSelectedCaptain(cap.name)}
                className={`group relative flex flex-col items-center transition-all duration-500 hover:scale-105 hover:-translate-y-3 focus:outline-none ${
                  cap.isRecommended ? 'scale-105 z-20' : ''
                }`}
              >
                {cap.isRecommended && (
                  <div className="absolute -top-4 bg-[#39ff14] text-[#111316] font-extrabold text-[10px] px-3 py-1 rounded-full shadow-lg z-30 uppercase tracking-widest animate-bounce">
                    RECOMENDADO
                  </div>
                )}

                <div
                  className={`relative w-full aspect-[2/3] ${cap.bgCard} border overflow-hidden shadow-2xl transition-all rounded-2xl p-4 flex flex-col justify-between ${
                    isSelected
                      ? 'ring-4 ring-[#39ff14] shadow-[0_0_40px_rgba(57,255,20,0.6)]'
                      : 'group-hover:shadow-[0_0_30px_rgba(57,255,20,0.3)]'
                  }`}
                >
                  <div className="flex justify-between items-start z-10">
                    <span className={`text-4xl font-black ${cap.colorClass}`}>{cap.rating}</span>
                    <span className="material-symbols-outlined text-white/20 text-5xl">person</span>
                  </div>

                  <div className="z-10 mt-auto">
                    <div className={`text-xl uppercase font-black text-center mb-2 tracking-wide ${cap.colorClass}`}>
                      {cap.name}
                    </div>
                    <div className="w-full h-[1px] bg-white/10 mb-3" />
                    <div className="grid grid-cols-3 gap-1 text-center text-xs font-bold text-gray-300">
                      <div><span className="text-[9px] text-gray-500 block">PAC</span>{cap.stats.pac}</div>
                      <div><span className="text-[9px] text-gray-500 block">SHO</span>{cap.stats.sho}</div>
                      <div><span className="text-[9px] text-gray-500 block">PAS</span>{cap.stats.pas}</div>
                      <div><span className="text-[9px] text-gray-500 block">DRI</span>{cap.stats.dri}</div>
                      <div><span className="text-[9px] text-gray-500 block">DEF</span>{cap.stats.def}</div>
                      <div><span className="text-[9px] text-gray-500 block">PHY</span>{cap.stats.phy}</div>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
